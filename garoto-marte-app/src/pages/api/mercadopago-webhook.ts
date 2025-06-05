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
  // Liberação de CORS para todas as origens e métodos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('--- [IPN/WEBHOOK] Mercado Pago - Nova requisição recebida ---');
  console.log('Método:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Query:', JSON.stringify(req.query));
  console.log('Body:', JSON.stringify(req.body));

  // Aceita tanto POST quanto GET para IPN
  if (req.method !== 'POST' && req.method !== 'GET') {
    console.log('[IPN/WEBHOOK] Método não permitido:', req.method);
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // IPN: id e topic vêm na query string
    // Webhook: pode vir no body ou na query
    let paymentId: string | null = null;
    let topic: string | null = null;

    // 1. IPN padrão (GET ou POST)
    if (req.query.id && req.query.topic) {
      paymentId = req.query.id as string;
      topic = req.query.topic as string;
      console.log('[IPN] paymentId extraído de query.id:', paymentId);
      console.log('[IPN] topic extraído de query.topic:', topic);
    }

    // 2. Webhook v1/v2 (POST body)
    if (!paymentId && req.body?.data?.id) {
      paymentId = req.body.data.id;
      topic = req.body.type || req.body.topic;
      console.log('[WEBHOOK] paymentId extraído de body.data.id:', paymentId);
      console.log('[WEBHOOK] topic extraído de body.type/topic:', topic);
    }

    // 3. Fallback para outros formatos
    if (!paymentId && req.body?.id) {
      paymentId = req.body.id.toString();
      topic = req.body.type || req.body.topic;
      console.log('[FALLBACK] paymentId extraído de body.id:', paymentId);
      console.log('[FALLBACK] topic extraído de body.type/topic:', topic);
    }

    if (!paymentId || topic !== 'payment') {
      console.log('[IPN/WEBHOOK] Notificação ignorada. paymentId:', paymentId, 'topic:', topic);
      return res.status(200).json({ message: 'Notificação ignorada (não é payment ou id ausente)' });
    }

    // Buscar status do pagamento
    const payment = await getPayment(paymentId);
    console.log('[IPN/WEBHOOK] payment retornado:', JSON.stringify(payment));
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
    console.log('[IPN/WEBHOOK] Status do pagamento:', payment.status);
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
    console.log('[IPN/WEBHOOK] Processamento finalizado com sucesso. Status: 200');
  } catch (error: any) {
    console.error('Erro no IPN/Webhook Mercado Pago:', error);
    res.status(500).json({ message: 'Erro no processamento do IPN/Webhook', error: error.message });
  }
}
