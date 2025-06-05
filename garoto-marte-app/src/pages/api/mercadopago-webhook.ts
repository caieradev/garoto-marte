import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { cancelarReserva, finalizarVenda, obterReservaPorId } from '../../lib/services/vendas';
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
      console.log('No x-signature header found');
      return false;
    }

    console.log('Validating signature:', xSignature);
    console.log('X-Request-ID:', xRequestId);

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
      console.log('Missing ts or v1 in signature');
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
      console.log('Missing data.id or id in query params');
      return false;
    }

    // Build the manifest string according to Mercado Pago documentation
    // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    let manifest = `id:${webhookId};`;

    if (xRequestId) {
      manifest += `request-id:${xRequestId};`;
    }

    manifest += `ts:${ts};`;

    console.log('Manifest string:', manifest);

    // Generate HMAC SHA256 signature
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY as string;
    const computedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    console.log('Computed hash:', computedHash);
    console.log('Received hash:', hash);

    // Compare signatures
    const isValid = computedHash === hash;
    console.log('Signature validation result:', isValid);

    return isValid;
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
  console.log('========== NEW WEBHOOK REQUEST ==========');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Method:', req.method);

  // Identify webhook type based on user-agent or other headers
  const userAgent = req.headers['user-agent'] as string;
  const isV2Webhook = userAgent?.includes('Feed v2.0');

  console.log('Webhook type detected:', isV2Webhook ? 'Feed v2.0' : 'WebHook v1.0');

  // Only validate signature for v1.0 webhooks for now
  // v2.0 webhooks may use different signature format
  if (!isV2Webhook) {
    if (!validateWebhookSignature(req)) {
      console.log('Webhook signature validation failed');
      return res.status(401).json({ message: 'Unauthorized: invalid webhook signature' });
    }
    console.log('Webhook signature validation passed');
  } else {
    console.log('Skipping signature validation for v2.0 webhook');
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
      console.log('Payment ID from query data.id:', paymentId);
    }

    // Method 2: From body data (for v2.0 and some v1.0)
    if (!paymentId && req.body?.data?.id) {
      paymentId = req.body.data.id;
      console.log('Payment ID from body data.id:', paymentId);
    }

    // Method 3: From body id field (some webhook types)
    if (!paymentId && req.body?.id) {
      // Check if this is actually a payment ID (should be numeric and reasonable length)
      const bodyId = req.body.id.toString();
      if (bodyId.match(/^\d{8,}$/)) { // Payment IDs are usually 8+ digits
        paymentId = bodyId;
        console.log('Payment ID from body id:', paymentId);
      }
    }

    // Method 4: From resource field
    if (!paymentId && req.body?.resource) {
      const resourceMatch = req.body.resource.match(/\/payments\/(\d+)/);
      if (resourceMatch) {
        paymentId = resourceMatch[1];
        console.log('Payment ID extracted from resource:', paymentId);
      }
    }

    // Handle different webhook topics
    const topic = req.query.topic as string || req.body?.topic;
    console.log('Webhook topic:', topic);

    if (topic === 'merchant_order') {
      console.log('Merchant order webhook detected, skipping payment processing');
      return res.status(200).json({ success: true, message: 'Merchant order webhook received' });
    }

    if (!paymentId) {
      console.log('ERROR: Payment ID not found in webhook data');
      console.log('Searched in:');
      console.log('- query data.id:', req.query['data.id']);
      console.log('- body data.id:', req.body?.data?.id);
      console.log('- body id:', req.body?.id);
      console.log('- body resource:', req.body?.resource);
      return res.status(400).json({ message: 'ID do pagamento não encontrado.' });
    }

    console.log('==> Processing payment ID:', paymentId); const payment = await getPayment(paymentId);
    if (!payment) {
      console.log('ERROR: Payment not found for ID:', paymentId);
      return res.status(404).json({ message: 'Pagamento não encontrado.' });
    }

    console.log('✓ Payment found:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount,
      payment_method_id: payment.payment_method_id
    });

    const externalReference = payment.external_reference;
    if (!externalReference) {
      console.log('ERROR: External reference not found for payment:', paymentId);
      return res.status(400).json({ message: 'Referência externa não encontrada.' });
    }

    // Buscar reserva/venda
    console.log('Looking for reserva with external reference:', externalReference);
    const reserva = await obterReservaPorId(externalReference);
    if (!reserva) {
      console.log('ERROR: Reserva not found for external reference:', externalReference);
      return res.status(404).json({ message: 'Reserva não encontrada.' });
    } console.log('✓ Reserva found:', {
      id: reserva.id,
      status: reserva.status
    });

    console.log('==> Processing payment status:', payment.status, 'for reserva:', reserva.id);

    // Status possíveis: approved, in_process, pending, rejected, cancelled, refunded
    switch (payment.status) {
      case 'approved':
        console.log('✓ Payment approved, finalizing sale');
        await finalizarVenda(reserva.id);
        console.log('✓ Sale finalized successfully');
        break;
      case 'in_process':
      case 'pending':
        console.log('⏳ Payment still processing, no action needed');
        break;
      default:
        console.log('❌ Payment failed/cancelled, cancelling reservation');
        await cancelarReserva(reserva.id);
        console.log('✓ Reservation cancelled successfully');
        break;
    }

    console.log('========== WEBHOOK PROCESSED SUCCESSFULLY ==========');
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.status(500).json({ message: 'Erro no processamento do webhook', error: error.message });
  }
}
