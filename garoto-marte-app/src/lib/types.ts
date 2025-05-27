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

// Enum para os tipos de produto
export enum ProductType {
    REGULAR = 'regular',
    TIE = 'tie'
}

// Interface base para produtos
export interface BaseProduct {
    id?: string;
    name: string;
    description: string;
    price: number;
    type: ProductType;
    collectionId?: string;
    collectionName?: string;
    mainImage: {
        imageId: string | null;
        imageUrl: string | null;
    };
    secondaryImage?: {
        imageId: string | null;
        imageUrl: string | null;
    };
    active: boolean;
    sold: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Interface para produtos regulares
export interface RegularProduct extends BaseProduct {
    type: ProductType.REGULAR;
    imageUrls: ImageData[];
    measurements: {
        chest?: number;
        shoulders?: number;
        length?: number;
        sleeves?: number;
        waist?: number;
    };
}

// Interface para uma gravata individual
export interface TieVariant {
    id?: string;
    parentId?: string;
    name: string;
    number: number;
    imageId?: string;
    imageUrl: string;
    price: number;
    sold: boolean;
}

// Interface para o grupo de gravatas
export interface TieProduct extends BaseProduct {
    type: ProductType.TIE;
    variants: TieVariant[];
}

// Union type para qualquer tipo de produto
export type Product = RegularProduct | TieProduct;

// Interface para formulário de produto regular
export interface RegularProductFormData {
    name: string;
    description: string;
    price: number;
    type: ProductType.REGULAR;
    collectionId: string; // Tornado obrigatório
    mainImageId: string;
    mainImageUrl: string;
    secondaryImageId?: string;
    secondaryImageUrl?: string;
    imageUrls: ImageData[];
    active: boolean;
    sold: boolean;
    measurements: {
        chest?: number;
        shoulders?: number;
        length?: number;
        sleeves?: number;
        waist?: number;
    };
}

// Interface para formulário de gravata
export interface TieProductFormData {
    name: string;
    description: string;
    price: number;
    type: ProductType.TIE;
    collectionId: string; // Tornado obrigatório
    mainImageId: string;
    mainImageUrl: string;
    secondaryImageId?: string;
    secondaryImageUrl?: string;
    imageUrls: ImageData[];
    active: boolean; variants: {
        id?: string;
        name: string;
        number: number;
        imageId?: string;
        imageUrl: string;
        price: number;
        sold: boolean;
    }[];
}

// Interface para dados da imagem
export interface ImageData {
    secure_url: string;
    public_id: string;
}
