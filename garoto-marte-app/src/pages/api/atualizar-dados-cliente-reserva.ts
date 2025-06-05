import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }
    try {
        const { reservaId, dadosCliente } = req.body;
        if (!reservaId || !dadosCliente) {
            return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
        }
        const docRef = doc(db, 'vendas', reservaId);
        // Remove campos undefined
        const dadosClienteLimpo = JSON.parse(JSON.stringify(dadosCliente));
        await updateDoc(docRef, { dadosCliente: dadosClienteLimpo });
        return res.status(200).json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
