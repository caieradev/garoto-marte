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
  // try {
  return true;
  //   // Get the x-signature header
  //   const xSignature = req.headers['x-signature'] as string;
  //   const xRequestId = req.headers['x-request-id'] as string;

  //   if (!xSignature) {

  //     return false;
  //   }

  //   // Parse the x-signature header to extract ts and v1
  //   const parts = xSignature.split(',');
  //   let ts = null;
  //   let hash = null;

  //   for (const part of parts) {
  //     const [key, value] = part.split('=', 2);
  //     if (key?.trim() === 'ts') {
  //       ts = value?.trim();
  //     } else if (key?.trim() === 'v1') {
  //       hash = value?.trim();
  //     }
  //   }

  //   if (!ts || !hash) {

  //     return false;
  //   }

  //   // Get query params - handle both payment and merchant_order webhooks
  //   const dataId = req.query['data.id'] as string;
  //   const id = req.query['id'] as string;
  //   const topic = req.query['topic'] as string;

  //   // For merchant_order webhooks, use the id parameter
  //   // For payment webhooks, use the data.id parameter
  //   const webhookId = dataId || id;

  //   if (!webhookId) {

  //     return false;
  //   }

  //   // Build the manifest string according to Mercado Pago documentation
  //   // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
  //   let manifest = `id:${webhookId};`;

  //   if (xRequestId) {
  //     manifest += `request-id:${xRequestId};`;
  //   }

  //   manifest += `ts:${ts};`;
  //   // Generate HMAC SHA256 signature
  //   const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY as string;
  //   const computedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  //   // Compare signatures
  //   const isValid = computedHash === hash; return isValid;
  // } catch (error) {
  //   console.error('Error validating webhook signature:', error);
  //   return false;
  // }
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('--- [WEBHOOK] Mercado Pago - Nova requisição recebida ---');
  console.log('Método:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));

  if (req.method !== 'POST') {
    console.log('[WEBHOOK] Método não permitido:', req.method);
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const body = req.body;
    // Novo formato: type: 'payment', data: { id: ... }
    if (!body || body.type !== 'payment') {
      console.log('[WEBHOOK] Notificação ignorada. Tipo:', body?.type);
      return res.status(200).json({ message: 'Notificação ignorada (não é payment)' });
    }
    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('[WEBHOOK] ID de pagamento não encontrado no payload');
      return res.status(400).json({ message: 'ID de pagamento não encontrado' });
    }
    console.log('[WEBHOOK] paymentId extraído do payload:', paymentId);

    // Buscar status do pagamento
    const payment = await getPayment(paymentId);
    console.log('[WEBHOOK] payment retornado:', JSON.stringify(payment));
    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado.' });
    }

    const externalReference = payment.external_reference;
    if (!externalReference) {
      return res.status(400).json({ message: 'Referência externa não encontrada.' });
    }

    // Buscar reserva/venda
    const reserva = await obterReservaPorId(externalReference);
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // Status possíveis: approved, in_process, pending, rejected, cancelled, refunded
    console.log('[WEBHOOK] Status do pagamento:', payment.status);
    switch (payment.status) {
      case 'approved':
        await finalizarVenda(reserva.id);
        try {
          const dadosVenda = await obterDadosVendaParaEnvio(reserva.id);
          if (dadosVenda.cliente && dadosVenda.endereco && dadosVenda.endereco.cep) {
            const resultadoEnvio = await gerarPedidoEnvio(dadosVenda);
            if (resultadoEnvio.success) {
              await atualizarPedidoComDadosEnvio(reserva.id, resultadoEnvio);
            }
          }
        } catch (envioError) {
          console.error('[MELHOR ENVIO] Exceção ao processar pedido de envio:', envioError);
        }
        break;
      case 'in_process':
      case 'pending':
        // Pode adicionar lógica para pagamentos pendentes, se necessário
        break;
      default:
        await cancelarReserva(reserva.id);
        break;
    }
    res.status(200).json({ success: true });
    console.log('[WEBHOOK] Processamento finalizado com sucesso. Status: 200');
  } catch (error: any) {
    console.error('Erro no Webhook Mercado Pago:', error);
    res.status(500).json({ message: 'Erro no processamento do Webhook', error: error.message });
  }
}
