// Interface para opções de frete
export interface ShippingOption {
    name: string;
    price: number;
    delivery_time: number;
    error: string | null;
    company: {
        name: string;
        picture?: string;
    };
}

// Adicionar uma exportação padrão vazia para garantir que o arquivo seja um módulo
export default {};
