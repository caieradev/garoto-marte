import axios from 'axios';
import { db } from "../firebase/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const API_URL = 'https://www.melhorenvio.com.br/api/v2';
const TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const VENDAS_COLLECTION = "vendas";

// Tipos para respostas da API do Melhor Envio
interface MelhorEnvioQuote {
    id: number;
    name: string;
    price: number;
    custom_price?: number;
    discount: number;
    currency: string;
    delivery_time: number;
    delivery_range: {
        min: number;
        max: number;
    };
    custom_delivery_time?: number;
    custom_delivery_range?: {
        min: number;
        max: number;
    };
    packages: any[];
    additional_services: {
        receipt: boolean;
        own_hand: boolean;
        collect: boolean;
    };
    company: {
        id: number;
        name: string;
        picture: string;
    };
}

interface MelhorEnvioCartResponse {
    id: string;
    protocol: string;
    service_id: number;
    agency_id?: number;
    contract?: string;
    service_code?: string;
    quote: number;
    price: number;
    discount: number;
    format: string;
    dimensions?: {
        width: number;
        height: number;
        length: number;
    };
    weight?: number;
    insurance_value: number;
    tracking?: string;
    status: string;
}

interface DadosEnvioRetorno {
    error?: string;
    details?: any;
    success: boolean;
    pedidoEnvioId: string;
    detalhes: {
        cart: MelhorEnvioCartResponse;
        quote: MelhorEnvioQuote;
        urlRastreio: string | null;
        preco: number;
        prazoEntrega: number;
        nomeServico: string;
        empresa: string;
        urlEtiqueta: string | null;
    };
}

/**
 * Gera um pedido de envio no Melhor Envio (cria envio aguardando pagamento no painel)
 */
export async function gerarPedidoEnvio(venda: any): Promise<DadosEnvioRetorno | { success: false, error: string, details: any }> {
    try {
        if (!venda.endereco || !venda.itens || venda.itens.length === 0) {
            throw new Error('Informações incompletas para gerar pedido de envio');
        }

        console.log(venda);

        // Montar os dados do destinatário (comprador)
        const documentoComprador = (venda.cliente.documento || venda.cliente.cpf || venda.dadosCliente?.documento || venda.dadosCliente?.cpf || '').toString();
        console.log('[MELHOR ENVIO] Documento do comprador enviado:', documentoComprador);
        const comprador = {
            name: venda.cliente.nome || 'Cliente',
            email: venda.cliente.email || 'comprador@exemplo.com',
            phone: venda.cliente.telefone || '00000000000',
            document: documentoComprador, // CPF do cliente
            address: venda.endereco.logradouro || 'Rua não informada',
            number: venda.endereco.numero || '0',
            complement: venda.endereco.complemento || '',
            district: venda.endereco.bairro || 'Bairro não informado',
            city: venda.endereco.cidade || 'Cidade não informada',
            state_abbr: venda.endereco.estado || 'RS', // Default para RS
            postal_code: venda.endereco.cep.replace(/\D/g, '') || '00000000',
            country_id: 'BR',
        };

        // Montar os dados do remetente (loja)
        const remetente = {
            name: 'Garoto Marte',
            phone: '5182060312',
            email: 'contatogarotomarte@gmail.com',
            company_document: '56334712000100',
            address: 'Av Ninopolis',
            number: '210',
            complement: '210',
            district: 'PETROPOLIS',
            city: 'PORTO ALEGRE',
            state_abbr: 'RS',
            postal_code: '90460050',
            country_id: 'BR',
        };

        // NOVO: Usar dados de envio já salvos na venda, sem cotação
        const shipping = venda.opcaoEnvio;
        if (!shipping) {
            throw new Error('Dados de envio não encontrados na venda.');
        }

        // Montar dados do carrinho usando os dados salvos
        const cartData = {
            service: shipping.id,
            agency: shipping.empresaId,
            from: remetente,
            to: comprador,
            products: venda.itens.map((item: any) => ({
                name: item.produto.nome,
                quantity: item.quantidade,
                unitary_value: item.precoUnitario,
            })),
            volumes: [
                {
                    height: 12,
                    width: 22,
                    length: 33,
                    weight: 1,
                },
            ],
            options: {
                insurance_value: venda.valorTotal,
                receipt: false,
                own_hand: false,
                collect: false,
                non_commercial: true,
            },
        };

        console.log('[MELHOR ENVIO] Dados do carrinho:', JSON.stringify(cartData));

        const cartResponse = await axios.post<MelhorEnvioCartResponse>(`${API_URL}/me/cart`, cartData, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        console.log('[MELHOR ENVIO] Resposta do carrinho:', JSON.stringify(cartResponse.data));

        if (!cartResponse.data || !cartResponse.data.id) {
            throw new Error('Falha ao adicionar envio ao carrinho no Melhor Envio');
        }

        return {
            success: true,
            pedidoEnvioId: cartResponse.data.id,
            detalhes: {
                cart: cartResponse.data,
                quote: shipping, // salva a cotação/serviço selecionado
                urlRastreio: cartResponse.data.tracking || null,
                preco: shipping.preco,
                prazoEntrega: shipping.prazo,
                nomeServico: shipping.nome,
                empresa: shipping.empresa,
                urlEtiqueta: null // Será preenchido após o pagamento
            },
        };
    } catch (error: any) {
        console.error('[MELHOR ENVIO] Erro ao gerar pedido:', error);
        console.error('[MELHOR ENVIO] Detalhes do erro:', error.response?.data || {});
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
export async function atualizarPedidoComDadosEnvio(vendaId: string, dadosEnvio: DadosEnvioRetorno | { success: false, error: string, details: any }): Promise<boolean> {
    try {
        console.log('[MELHOR ENVIO] Atualizando venda com dados de envio:', vendaId);

        if (!dadosEnvio.success) {
            throw new Error(`Não é possível atualizar com dados de erro: ${dadosEnvio.error}`);
        }

        // Atualizar a venda com os dados do envio
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        await updateDoc(docRef, {
            dadosEnvio: {
                pedidoEnvioId: dadosEnvio.pedidoEnvioId,
                dataCriacao: serverTimestamp(),
                status: 'aguardando_pagamento'
            }
        });

        console.log('[MELHOR ENVIO] Venda atualizada com sucesso');
        return true;
    } catch (error) {
        console.error('[MELHOR ENVIO] Erro ao atualizar pedido com dados de envio:', error);
        return false;
    }
}
