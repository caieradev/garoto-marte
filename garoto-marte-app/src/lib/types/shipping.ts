// Interface para opções de frete
export interface ShippingOption {
    id: number;
    name: string;
    price: number;
    delivery_time: number;
    error: string | null;
    company: {
        id: number;
        name: string;
        picture?: string;
    };
}

// Adicionar uma exportação padrão vazia para garantir que o arquivo seja um módulo
export default {};
