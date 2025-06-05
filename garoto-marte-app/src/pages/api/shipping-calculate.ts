import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { cep, price } = req.body;
        if (!cep || !price) {
            return res.status(400).json({ error: 'CEP e preço são obrigatórios.' });
        }

        const payload = {
            from: { postal_code: process.env.NEXT_PUBLIC_CEP_ORIGEM },
            to: { postal_code: cep.replace(/\D/g, '') },
            products: [
                {
                    id: '1',
                    width: 22,
                    height: 12,
                    length: 33,
                    weight: 1,
                    insurance_value: price,
                    quantity: 1,
                },
            ],
        };

        const apiUrl = process.env.MELHOR_ENVIO_SANDBOX === 'true'
            ? 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
            : 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';

        const response = await axios.post(apiUrl, payload, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
            },
        });

        console.log('Resposta do Melhor Envio:', response.data);

        // Filtrar apenas Correios e Jadlog
        const allowedCompanies = ['Correios', 'Jadlog'];
        const options = Array.isArray(response.data)
            ? response.data
                .filter((opt: any) => allowedCompanies.includes(opt.company?.name))
                .map((opt: any) => ({
                    id: opt.id ?? 0,
                    name: opt.name,
                    price: opt.price,
                    delivery_time: opt.delivery_time,
                    error: opt.error || null,
                    company: {
                        id: opt.company?.id ?? 0,
                        name: opt.company?.name,
                        picture: opt.company?.picture,
                    },
                }))
            : [];

        res.status(200).json(options);
    } catch (error: any) {
        console.error('Erro ao calcular frete:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Falha ao calcular o frete' });
    }
}
