import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Aqui você pode receber notificações do Mercado Pago e, se aprovado, integrar com Melhor Envio
  // Exemplo de stub para integração futura
  res.status(200).json({ success: true, message: 'Integração com Melhor Envio será implementada aqui.' });
}
