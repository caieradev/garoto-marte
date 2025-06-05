import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configure Mercado Pago SDK
const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
});
const preferenceClient = new Preference(mp);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { produtoId, varianteId, dadosEntrega, compradorEmail, externalReference, valorTotal, produtoNome, produtoDescricao } = req.body;

    if (!produtoId || !compradorEmail || !externalReference || !valorTotal || !produtoNome) {
      return res.status(400).json({ message: 'Dados obrigatórios ausentes.' });
    }

    const preference = {
      items: [
        {
          id: produtoId,
          title: produtoNome,
          description: produtoDescricao || '',
          quantity: 1,
          unit_price: valorTotal,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: compradorEmail,
      },
      external_reference: externalReference,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/resumo`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/resumo`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago-webhook`,
    };

    const response = await preferenceClient.create({ body: preference });
    res.status(200).json({
      init_point: response.init_point,
      id: response.id,
    });
  } catch (error: any) {
    console.error('Erro ao criar preferência Mercado Pago:', error);
    res.status(500).json({ message: 'Erro ao criar preferência Mercado Pago', error: error.message });
  }
}
