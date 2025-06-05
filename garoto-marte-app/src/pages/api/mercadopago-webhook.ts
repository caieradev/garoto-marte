import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { cancelarReserva, finalizarVenda, obterReservaPorId } from '../../lib/services/vendas';

// Configure Mercado Pago SDK
const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
});
const paymentClient = new Payment(mp);

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
  // Autenticação do webhook via header
  const secret = req.headers['x-webhook-secret'] || req.headers['x-webhook-secret-key'];
  if (!secret || secret !== process.env.MERCADO_PAGO_WEBHOOK_SECRET_KEY) {
    return res.status(401).json({ message: 'Unauthorized: invalid webhook secret' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { id, topic, type, data } = req.body;
    let paymentId = id;
    if (!paymentId && data?.id) paymentId = data.id;

    if (!paymentId) {
      return res.status(400).json({ message: 'ID do pagamento não informado.' });
    }

    const payment = await getPayment(paymentId);
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
    switch (payment.status) {
      case 'approved':
        // Finaliza a venda (marca como vendida)
        await finalizarVenda(reserva.id);
        // Aqui você pode acionar integração com Melhor Envio
        break;
      case 'in_process':
      case 'pending':
        // Não faz nada, aguarda processamento
        break;
      default:
        // Qualquer outro status cancela a reserva
        await cancelarReserva(reserva.id);
        break;
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.status(500).json({ message: 'Erro no processamento do webhook', error: error.message });
  }
}
