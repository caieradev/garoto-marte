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
        console.log('Dados da venda obtidos:', venda);

        // Buscar produto para ter acesso a detalhes adicionais (se necessário)
        const produto = await getProductById(venda.produtoId);

        // Dados do cliente com valores padrão para evitar erros de tipo
        const dadosCliente = venda.dadosCliente || { nome: '', email: '', telefone: '' };

        // Dados de endereço com valores padrão
        const endereco = venda.dadosCliente?.endereco || {
            logradouro: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: ''
        };

        // Dados de entrega com valores padrão
        const dadosEntrega = venda.dadosEntrega || { cep: '' };

        // Dados de frete com valores padrão
        const frete = venda.dadosEntrega?.frete || {
            nome: 'PAC',
            empresa: 'CORREIOS',
            preco: 0,
            prazo: 0
        };

        // Determinar código de serviço do Melhor Envio
        // Códigos padrão: 1 = PAC, 2 = SEDEX
        const codigoServico = frete.empresa === 'CORREIOS'
            ? (frete.nome.includes('SEDEX') ? 2 : 1)
            : 1;

        // Estruturar os dados para o Melhor Envio
        const vendaComDados = {
            id: venda.id,
            produtoId: venda.produtoId,
            produtoNome: venda.produtoNome || '',
            status: venda.status,
            valorProduto: venda.valorProduto || 0,
            valorFrete: venda.valorFrete || 0,
            valorTotal: venda.valorTotal || 0,
            cliente: {
                nome: dadosCliente.nome || 'Cliente',
                email: dadosCliente.email || '',
                telefone: dadosCliente.telefone || '',
            },
            endereco: {
                logradouro: endereco.logradouro || '',
                numero: endereco.numero || '',
                complemento: endereco.complemento || '',
                bairro: endereco.bairro || '',
                cidade: endereco.cidade || '',
                estado: endereco.estado || '',
                cep: dadosEntrega.cep || ''
            },
            itens: [{
                produto: {
                    nome: venda.produtoNome || (produto ? produto.name : 'Produto'),
                    id: venda.produtoId
                },
                quantidade: 1,
                precoUnitario: venda.valorProduto || 0
            }],
            opcaoEnvio: {
                codigo: codigoServico,
                nome: frete.nome || 'PAC'
            },
            pesoTotal: produto && 'weight' in produto ? produto.weight : 0.5 // Peso em kg, usando dados do produto ou valor padrão
        };

        return vendaComDados;
    } catch (error) {
        console.error('Erro ao obter dados da venda para envio:', error);
        throw error;
    }
}
