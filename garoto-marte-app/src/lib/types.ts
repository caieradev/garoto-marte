// Interface para representar uma coleção
export interface Collection {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Interface para formulário de coleção (sem campos automáticos)
export interface CollectionFormData {
    name: string;
    description: string;
    active: boolean;
}
