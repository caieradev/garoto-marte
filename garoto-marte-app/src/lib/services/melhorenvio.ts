import axios from 'axios';
import { db } from "../firebase/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const API_URL = process.env.MELHOR_ENVIO_API_URL || 'https://sandbox.melhorenvio.com.br/api/v2';
const TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const VENDAS_COLLECTION = "vendas";

// Tipos para respostas da API do Melhor Envio
interface MelhorEnvioService {
    id: number;
    name: string;
    price: number;
    delivery_time: number;
    company: {
        id: number;
        name: string;
    };
}

interface MelhorEnvioCart {
    id: string;
    status: string;
    protocol: string;
    service_id: number;
}

/**
 * Gera um pedido de envio no Melhor Envio (cria envio aguardando pagamento no painel)
 */
export async function gerarPedidoEnvio(venda: any) {
    try {
        if (!venda.endereco || !venda.itens || venda.itens.length === 0) {
            throw new Error('Informações incompletas para gerar pedido de envio');
        }

        // Montar os dados do destinatário (comprador)
        const comprador = {
            name: venda.cliente.nome || 'Cliente',
            email: venda.cliente.email || 'comprador@exemplo.com',
            phone: venda.cliente.telefone || '00000000000',
            address: venda.endereco.logradouro || 'Rua não informada',
            number: venda.endereco.numero || '0',
            complement: venda.endereco.complemento || '',
            district: venda.endereco.bairro || 'Bairro não informado',
            city: venda.endereco.cidade || 'Cidade não informada',
            state_abbr: venda.endereco.estado || 'Estado não Informado',
            postal_code: venda.endereco.cep.replace(/\D/g, '') || '00000000',
        };

        // Montar os dados do remetente (loja)
        const remetente = {
            name: 'Garoto Marte',
            phone: '5182060312',
            email: 'contatogarotomarte@gmail.com',
            document: '56334712000100',
            address: 'Av Ninopolis',
            number: '210',
            complement: '210',
            district: 'PETROPOLIS',
            city: 'PORTO ALEGRE',
            state_abbr: 'RS',
            postal_code: '90460050',
        };

        // 1. Cotação de frete (POST /me/shipment/calculate)
        const calculateBody = {
            from: { postal_code: remetente.postal_code },
            to: { postal_code: comprador.postal_code },
            products: [
                {
                    weight: venda.pesoTotal || 0.5,
                    width: 15,
                    height: 10,
                    length: 20,
                    insurance_value: venda.valorTotal,
                },
            ],
            services: [String(venda.opcaoEnvio?.codigo || 1)],
            options: {
                receipt: false,
                own_hand: false,
                collect: false,
            },
        };

        const quoteResponse = await axios.post(`${API_URL}/me/shipment/calculate`, calculateBody, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        if (!quoteResponse.data || !Array.isArray(quoteResponse.data) || quoteResponse.data.length === 0) {
            throw new Error('Nenhuma cotação de envio disponível para este endereço');
        }

        // 2. Criar o envio (POST /me/shipment/checkout)
        const pedido = {
            service: String(venda.opcaoEnvio?.codigo || 1),
            from: remetente,
            to: comprador,
            products: venda.itens.map((item: any) => ({
                name: item.produto.nome,
                quantity: item.quantidade,
                unitary_value: item.precoUnitario,
            })),
            volumes: [
                {
                    height: 10,
                    width: 15,
                    length: 20,
                    weight: venda.pesoTotal || 0.5,
                },
            ],
            options: {
                insurance_value: venda.valorTotal,
                receipt: false,
                own_hand: false,
                collect: false,
            },
            tags: [`pedido-${venda.id}`],
        };

        const shipmentResponse = await axios.post(`${API_URL}/me/shipment/checkout`, [pedido], {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        if (!shipmentResponse.data || !Array.isArray(shipmentResponse.data) || !shipmentResponse.data[0].id) {
            throw new Error('Falha ao criar pedido de envio no Melhor Envio');
        }

        const shipmentId = shipmentResponse.data[0].id;

        return {
            success: true,
            pedidoEnvioId: shipmentId,
            detalhes: {
                shipment: shipmentResponse.data[0],
                quote: quoteResponse.data[0],
            },
        };
    } catch (error: any) {
        console.error('Erro ao gerar pedido no Melhor Envio:', error);
        return {
            success: false,
            error: error.message,
            details: error.response?.data || {},
        };
    }
}

/**
 * Atualiza o status de um pedido no banco de dados com as informações do Melhor Envio
 */
export async function atualizarPedidoComDadosEnvio(vendaId: string, dadosEnvio: any) {
    try {
        // Atualizar a venda com os dados do envio
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        await updateDoc(docRef, {
            dadosEnvio: {
                pedidoEnvioId: dadosEnvio.pedidoEnvioId,
                detalhes: dadosEnvio.detalhes,
                dataCriacao: serverTimestamp()
            }
        });


        return true;
    } catch (error) {
        console.error('Erro ao atualizar pedido com dados de envio:', error);
        return false;
    }
}
