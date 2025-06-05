import { Timestamp } from "firebase/firestore";

// Enum para status da venda
export enum VendaStatus {
    RESERVADO = 'reservado',
    FINALIZADO = 'finalizado',
    CANCELADO = 'cancelado',
    EXPIRADO = 'expirado'
}

// Interface para dados de entrega
export interface DadosEntrega {
    cep: string;
    frete: {
        nome: string;
        preco: number;
        prazo: number;
        empresa: string;
    };
}

// Interface para dados do cliente
export interface DadosCliente {
    nome: string;
    email: string;
    telefone: string;
    endereco?: {
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cidade: string;
        estado: string;
    };
}

// Interface para dados de envio do Melhor Envio
export interface DadosEnvio {
    pedidoEnvioId: string;
    detalhes: any;
    dataCriacao: Timestamp;
}

// Interface para representar uma venda
export interface Venda {
    id: string;
    produtoId: string;
    produtoNome: string;
    produtoImagem: string | null;
    varianteId: string | null;
    status: VendaStatus;
    valorProduto: number;
    valorFrete: number;
    valorTotal: number;
    dadosEntrega: DadosEntrega | null;
    dadosCliente?: DadosCliente | null;
    dadosEnvio?: DadosEnvio | null;
    dataReserva: Timestamp;
    expiraEm: Timestamp;
    dataCancelamento: Timestamp | null;
    dataFinalizacao: Timestamp | null;
}
