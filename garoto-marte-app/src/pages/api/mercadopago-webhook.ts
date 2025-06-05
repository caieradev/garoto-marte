import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { cancelarReserva, finalizarVenda, obterReservaPorId } from '../../lib/services/vendas';
import { obterDadosVendaParaEnvio } from '../../lib/services/vendaEnvio';
import { gerarPedidoEnvio, atualizarPedidoComDadosEnvio } from '../../lib/services/melhorenvio';
import crypto from 'crypto';

// Configure Mercado Pago SDK
const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
});
const paymentClient = new Payment(mp);

function validateWebhookSignature(req: NextApiRequest): boolean {
  try {
    // Get the x-signature header
    const xSignature = req.headers['x-signature'] as string;
    const xRequestId = req.headers['x-request-id'] as string;

    if (!xSignature) {

      return false;
    }

    // Parse the x-signature header to extract ts and v1
    const parts = xSignature.split(',');
    let ts = null;
    let hash = null;

    for (const part of parts) {
      const [key, value] = part.split('=', 2);
      if (key?.trim() === 'ts') {
        ts = value?.trim();
      } else if (key?.trim() === 'v1') {
        hash = value?.trim();
      }
    }

    if (!ts || !hash) {

      return false;
    }

    // Get query params - handle both payment and merchant_order webhooks
    const dataId = req.query['data.id'] as string;
    const id = req.query['id'] as string;
    const topic = req.query['topic'] as string;

    // For merchant_order webhooks, use the id parameter
    // For payment webhooks, use the data.id parameter
    const webhookId = dataId || id;

    if (!webhookId) {

      return false;
    }

    // Build the manifest string according to Mercado Pago documentation
    // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    let manifest = `id:${webhookId};`;

    if (xRequestId) {
      manifest += `request-id:${xRequestId};`;
    }

    manifest += `ts:${ts};`;
    // Generate HMAC SHA256 signature
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY as string;
    const computedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    // Compare signatures
    const isValid = computedHash === hash; return isValid;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

async function getPayment(paymentId: string) {
  try {
    const payment = await paymentClient.get({ id: paymentId });
    return payment;
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Identify webhook type based on user-agent or other headers
  const userAgent = req.headers['user-agent'] as string;
  const isV2Webhook = userAgent?.includes('Feed v2.0');
  // Only validate signature for v1.0 webhooks for now
  // v2.0 webhooks may use different signature format
  if (!isV2Webhook) {
    if (!validateWebhookSignature(req)) {

      return res.status(401).json({ message: 'Unauthorized: invalid webhook signature' });
    }

  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Extract payment ID based on webhook type and structure
    let paymentId: string | null = null;

    // Method 1: From query parameters (most reliable for v1.0)
    const dataId = req.query['data.id'] as string;
    if (dataId) {
      paymentId = dataId;

    }

    // Method 2: From body data (for v2.0 and some v1.0)
    if (!paymentId && req.body?.data?.id) {
      paymentId = req.body.data.id;

    }

    // Method 3: From body id field (some webhook types)
    if (!paymentId && req.body?.id) {
      // Check if this is actually a payment ID (should be numeric and reasonable length)
      const bodyId = req.body.id.toString();
      if (bodyId.match(/^\d{8,}$/)) { // Payment IDs are usually 8+ digits
        paymentId = bodyId;

      }
    }

    // Method 4: From resource field
    if (!paymentId && req.body?.resource) {
      const resourceMatch = req.body.resource.match(/\/payments\/(\d+)/);
      if (resourceMatch) {
        paymentId = resourceMatch[1];

      }
    }

    // Handle different webhook topics
    const topic = req.query.topic as string || req.body?.topic; if (topic === 'merchant_order') {
      console.log('[WEBHOOK] Merchant order webhook recebido. Status: 200');
      return res.status(200).json({ success: true, message: 'Merchant order webhook received' });
    }

    if (!paymentId) {
      console.log('[WEBHOOK] ID do pagamento não encontrado. Status: 400');
      return res.status(400).json({ message: 'ID do pagamento não encontrado.' });
    } const payment = await getPayment(paymentId);
    if (!payment) {
      console.log('[WEBHOOK] Pagamento não encontrado. Status: 404');
      return res.status(404).json({ message: 'Pagamento não encontrado.' });
    }

    const externalReference = payment.external_reference;
    if (!externalReference) {
      console.log('[WEBHOOK] Referência externa não encontrada. Status: 400');
      return res.status(400).json({ message: 'Referência externa não encontrada.' });
    }

    // Buscar reserva/venda

    const reserva = await obterReservaPorId(externalReference);
    if (!reserva) {
      console.log('[WEBHOOK] Reserva não encontrada. Status: 404');
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }
    // Status possíveis: approved, in_process, pending, rejected, cancelled, refunded
    switch (payment.status) {
      case 'approved':
        await finalizarVenda(reserva.id);        // MELHOR ENVIO INTEGRAÇÃO
        console.log('[MELHOR ENVIO] Iniciando geração de pedido de envio para reserva:', reserva.id);
        try {
          // 1. Obter todos os dados necessários da venda para o envio
          const dadosVenda = await obterDadosVendaParaEnvio(reserva.id);
          console.log('[MELHOR ENVIO] Dados da venda para envio:', JSON.stringify(dadosVenda));
          // 2. Verificar se temos dados suficientes para criar o envio
          if (!dadosVenda.cliente || !dadosVenda.endereco || !dadosVenda.endereco.cep) {
            console.error('[MELHOR ENVIO] Dados insuficientes para criar envio. Dados do cliente ou endereço incompletos.');
            // Continuar mesmo sem dados completos - o envio poderá ser feito manualmente depois
          } else {
            // 3. Gerar o pedido de envio no Melhor Envio usando a API atualizada
            const resultadoEnvio = await gerarPedidoEnvio(dadosVenda);
            console.log('[MELHOR ENVIO] Resultado da geração do pedido:', JSON.stringify(resultadoEnvio));

            // 4. Atualizar a venda com os dados do envio gerado
            if (resultadoEnvio.success) {
              await atualizarPedidoComDadosEnvio(reserva.id, resultadoEnvio);
              console.log('[MELHOR ENVIO] Pedido de envio atualizado na venda:', reserva.id);
            } else {
              console.error('[MELHOR ENVIO] Erro ao gerar pedido:', resultadoEnvio.error, resultadoEnvio.details);
            }
          }
        } catch (envioError) {
          console.error('[MELHOR ENVIO] Exceção ao processar pedido de envio:', envioError);
        }
        // FIM MELHOR ENVIO INTEGRAÇÃO
        break;
      case 'in_process':
      case 'pending':
        break;
      default:
        await cancelarReserva(reserva.id);
        break;
    }    res.status(200).json({ success: true });
    console.log('[WEBHOOK] Processamento finalizado com sucesso. Status: 200');
  } catch (error: any) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.status(500).json({ message: 'Erro no processamento do webhook', error: error.message });
    console.log('[WEBHOOK] Erro no processamento do webhook. Status: 500');
  }
}
