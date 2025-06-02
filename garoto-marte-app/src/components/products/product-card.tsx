import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product } from "@/lib/types";

// Interface para compatibilidade com os dados existentes e o tipo Product
interface ProductCardData {
    id?: string;
    name: string;
    mainImage?: string | { imageUrl: string | null };
    secondaryImage?: string | { imageUrl: string | null };
    sold?: boolean;
}

type ProductCardProps = {
    product: ProductCardData;
};

export function ProductCard({ product }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Função para extrair a URL da imagem de maneira segura
    const getImageUrl = (image: string | { imageUrl: string | null } | undefined): string | null => {
        if (!image) return null;
        if (typeof image === 'string') return image !== "" ? image : null;
        return image.imageUrl !== null && image.imageUrl !== "" ? image.imageUrl : null;
    };

    // Extrair URLs das imagens
    const mainImageUrl = getImageUrl(product.mainImage);
    const secondaryImageUrl = getImageUrl(product.secondaryImage);

    // Determina qual imagem mostrar com base no estado de hover
    const displayImage = isHovered && secondaryImageUrl
        ? secondaryImageUrl
        : mainImageUrl
            ? mainImageUrl
            : null;

    return (
        <Link href={`/products/${product.id}`} passHref>
            <div
                className="group cursor-pointer text-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center justify-center relative h-64 mb-4 overflow-hidden rounded-md bg-gray-100">
                    {displayImage ? (
                        <Image
                            src={displayImage}
                            alt={product.name}
                            width={400}
                            height={400}
                            className="object-cover h-full w-full transition-all duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                            <span className="text-gray-500">Sem imagem</span>
                        </div>
                    )}
                    {product.sold && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
                            Esgotado
                        </div>
                    )}
                </div>
                <p className="font-bold text-2xl text-black">{product.name}</p>
            </div>
        </Link>
    );
}
