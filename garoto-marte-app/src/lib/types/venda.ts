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
    dataReserva: Timestamp;
    expiraEm: Timestamp;
    dataCancelamento: Timestamp | null;
    dataFinalizacao: Timestamp | null;
}
