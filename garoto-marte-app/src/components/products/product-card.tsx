import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
    product: {
        id?: string;
        name: string;
        mainImage?: string;
        sold?: boolean;
    };
};

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Link href={`/products/${product.id}`} passHref>
            <div className="group cursor-pointer text-center">
                <div className="flex items-center justify-center relative h-64 mb-4 overflow-hidden rounded-md bg-gray-100">
                    {product.mainImage ? (
                        <Image
                            src={product.mainImage}
                            alt={product.name}
                            width={400}
                            height={400}
                            className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
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
