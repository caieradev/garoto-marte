import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Venda } from "../types/venda";
import { getProductById } from "./products";

const VENDAS_COLLECTION = "vendas";

/**
 * Busca todos os detalhes de uma venda para envio
 */
export async function obterDadosVendaParaEnvio(vendaId: string) {
    try {
        // Buscar venda
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error(`Venda ${vendaId} não encontrada`);
        }

        const venda = docSnap.data() as Venda;
        venda.id = docSnap.id;

        // Buscar produto para ter acesso a detalhes adicionais (se necessário)
        const produto = await getProductById(venda.produtoId);

        // Estruturar os dados para o Melhor Envio
        const vendaComDados = {
            ...venda,
            cliente: {
                nome: venda.dadosCliente?.nome || 'Cliente',
                email: venda.dadosCliente?.email || '',
                telefone: venda.dadosCliente?.telefone || '',
            },
            endereco: {
                logradouro: venda.dadosCliente?.endereco?.logradouro || '',
                numero: venda.dadosCliente?.endereco?.numero || '',
                complemento: venda.dadosCliente?.endereco?.complemento || '',
                bairro: venda.dadosCliente?.endereco?.bairro || '',
                cidade: venda.dadosCliente?.endereco?.cidade || '',
                estado: venda.dadosCliente?.endereco?.estado || '',
                cep: venda.dadosEntrega?.cep || ''
            },
            itens: [{
                produto: {
                    nome: venda.produtoNome,
                    id: venda.produtoId
                },
                quantidade: 1,
                precoUnitario: venda.valorProduto
            }],
            opcaoEnvio: {
                codigo: venda.dadosEntrega?.frete?.empresa === 'CORREIOS' ? 1 : 2, // 1 para PAC, 2 para SEDEX
                nome: venda.dadosEntrega?.frete?.nome || 'PAC'
            },
            pesoTotal: 1 // Peso em kg
        };

        return vendaComDados;
    } catch (error) {
        console.error('Erro ao obter dados da venda para envio:', error);
        throw error;
    }
}
