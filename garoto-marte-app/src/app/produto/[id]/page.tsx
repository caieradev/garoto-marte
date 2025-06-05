"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProductById, markProductAsSold, markTieVariantAsSold } from "@/lib/services/products";
import { Product, ProductType, TieProduct, RegularProduct, TieVariant } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function Page({ params }: PageProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<TieVariant | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [cep, setCep] = useState("");
    const [cepError, setCepError] = useState("");
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [shippingError, setShippingError] = useState("");
    const router = useRouter();

    // Carregar dados do produto
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const resolvedParams = await params;
                const productData = await getProductById(resolvedParams.id);
                setProduct(productData);

                // Se for um produto do tipo gravata, seleciona a primeira variante disponível
                if (productData?.type === ProductType.TIE) {
                    const tieProduct = productData as TieProduct;
                    const availableVariant = tieProduct.variants.find(v => !v.sold);
                    setSelectedVariant(availableVariant || null);
                }
            } catch (error) {
                console.error("Erro ao carregar produto:", error);
                toast.error("Erro ao carregar detalhes do produto");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [params]);

    // Função para mudar a imagem exibida
    const handleImageChange = (index: number) => {
        setCurrentImageIndex(index);
    };

    // Função para selecionar variante de gravata
    const handleVariantSelect = (variant: TieVariant) => {
        setSelectedVariant(variant);
    };    // Função para iniciar processo de compra
    const handleBuyClick = async () => {
        alert("Comprar");
    };

    // Validação e formatação de CEP
    const isValidCEP = (cep: string) => /^\d{5}-?\d{3}$/.test(cep);
    const formatCEP = (cep: string) => {
        const numericCEP = cep.replace(/\D/g, "");
        return numericCEP.length === 8 ? `${numericCEP.slice(0, 5)}-${numericCEP.slice(5)}` : numericCEP;
    };

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        setCep(formatCEP(value));
        setCepError("");
    };

    const handleShippingCalc = async () => {
        setShippingError("");
        if (!isValidCEP(cep)) {
            setCepError("CEP inválido. Use o formato 00000-000");
            setShippingOptions([]);
            return;
        }
        setShippingLoading(true);
        setShippingOptions([]);
        try {
            const price = product?.type === ProductType.TIE && selectedVariant ? selectedVariant.price : product?.price;
            const res = await fetch("/api/shipping-calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cep: cep.replace(/\D/g, ""), price }),
            });
            const data = await res.json();
            if (!res.ok || !Array.isArray(data)) {
                setShippingError(data.error || "Erro ao calcular frete");
                setShippingOptions([]);
            } else {
                setShippingOptions(data);
            }
        } catch (err) {
            setShippingError("Erro ao consultar frete. Tente novamente.");
        } finally {
            setShippingLoading(false);
        }
    };

    // Renderização condicional baseada no estado de carregamento
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 bg-gray-800 rounded mb-4"></div>
                        <div className="h-96 w-96 bg-gray-800 rounded mb-4"></div>
                        <div className="h-6 w-48 bg-gray-800 rounded mb-2"></div>
                        <div className="h-6 w-32 bg-gray-800 rounded mb-4"></div>
                        <div className="h-10 w-36 bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Se o produto não for encontrado
    if (!product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
                    <Button onClick={() => router.push("/")}>Voltar para a home</Button>
                </div>
            </div>
        );
    }

    // Determina as imagens a serem exibidas
    const mainImage = product.mainImage?.imageUrl;
    const secondaryImage = product.secondaryImage?.imageUrl;

    // Para produtos regulares, preparar galeria com todas as imagens
    const allImages = product.type === ProductType.REGULAR
        ? [
            mainImage,
            secondaryImage,
            ...(product as RegularProduct).imageUrls?.map(img => img.secure_url) || []
        ].filter(Boolean) as string[]
        : [mainImage, secondaryImage].filter(Boolean) as string[];

    const currentImage = allImages[currentImageIndex];

    // Verifica se o produto está disponível para compra
    const isRegularProductAvailable = product.type === ProductType.REGULAR && !product.sold;
    const isTieProductAvailable = product.type === ProductType.TIE && selectedVariant && !selectedVariant.sold;
    const isProductAvailable = isRegularProductAvailable || isTieProductAvailable;

    // Dicionário para traduzir as chaves das medidas para português
    const medidasLabels: Record<string, string> = {
        chest: "Peito",
        shoulders: "Ombros",
        length: "Comprimento",
        sleeves: "Mangas",
        waist: "Cintura",
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Galeria de Imagens */}
                <div className="space-y-4">
                    <div className="bg-white relative h-[500px] w-full rounded-lg overflow-hidden">
                        {currentImage ? (
                            <Image
                                src={currentImage}
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-400">Imagem não disponível</span>
                            </div>
                        )}
                    </div>

                    {/* Miniaturas */}
                    {allImages.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto py-2">
                            {allImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleImageChange(index)}
                                    className={`relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${currentImageIndex === index ? "border-red-600" : "border-transparent"
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`Miniatura ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Informações do Produto */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                        <div className="flex items-center space-x-2 mb-4">
                            {product.sold ? (
                                <Badge variant="destructive">Esgotado</Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-800 text-white">Disponível</Badge>
                            )}
                            {product.collectionName && (
                                <Badge variant="secondary">{product.collectionName}</Badge>
                            )}
                        </div>
                        <p className="text-3xl font-semibold mb-6">
                            {product.type === ProductType.TIE && selectedVariant
                                ? formatCurrency(selectedVariant.price)
                                : formatCurrency(product.price)}
                        </p>
                        {product.type === ProductType.REGULAR && (product as RegularProduct).tamanho && (
                            <div className="mb-4">
                                <span className="font-medium">Tamanho:</span> {(product as RegularProduct).tamanho}
                            </div>
                        )}
                        <div className="prose prose-invert mb-6">
                            <p>{product.description}</p>
                        </div>
                    </div>

                    {/* Seleção de Variantes (apenas para gravatas) */}
                    {product.type === ProductType.TIE && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-medium">Escolha uma gravata:</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(product as TieProduct).variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => handleVariantSelect(variant)}
                                        disabled={variant.sold}
                                        className={`relative p-2 rounded-md border ${selectedVariant?.id === variant.id
                                            ? "border-red-600"
                                            : variant.sold
                                                ? "border-gray-700 opacity-50"
                                                : "border-gray-600 hover:border-gray-400"
                                            }`}
                                    >
                                        <div className="relative h-24 w-full mb-2">
                                            <Image
                                                src={variant.imageUrl}
                                                alt={variant.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <p className="text-sm font-medium">{variant.name || `Gravata #${variant.number}`}</p>
                                        <p className="text-sm">{formatCurrency(variant.price)}</p>
                                        {variant.sold && (
                                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                                                <span className="text-white font-medium">Esgotado</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Medidas (apenas para produtos regulares) */}
                    {product.type === ProductType.REGULAR && (product as RegularProduct).measurements && (
                        <div className="space-y-2">
                            <h3 className="text-xl font-medium">Medidas:</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries((product as RegularProduct).measurements || {})
                                    .filter(([_, value]) => value && value !== 0)
                                    .map(([key, value]) => (
                                        <div key={key} className="flex justify-between border-b border-gray-700 py-1">
                                            <span className="capitalize">{medidasLabels[key] || key}:</span>
                                            <span>{value} cm</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Cálculo de Frete */}
                    <div className="space-y-2">
                        <label htmlFor="cep" className="font-medium">Calcule o frete:</label>
                        <div className="flex gap-2 items-center">
                            <Input
                                id="cep"
                                placeholder="Digite seu CEP"
                                value={cep}
                                onChange={handleCepChange}
                                maxLength={9}
                                className={cepError ? "border-red-500" : ""}
                                inputMode="numeric"
                                autoComplete="postal-code"
                            />
                            <Button type="button" variant="secondary" onClick={handleShippingCalc} disabled={shippingLoading || !cep}>
                                {shippingLoading ? "Calculando..." : "Calcular"}
                            </Button>
                        </div>
                        <a
                            href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground underline hover:text-primary"
                        >
                            Não sei meu CEP
                        </a>
                        {cepError && <div className="text-red-500 text-xs mt-1">{cepError}</div>}
                        {shippingError && <div className="text-red-500 text-xs mt-1">{shippingError}</div>}
                        {shippingOptions.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <div className="font-medium text-sm mb-1">Opções de frete:</div>
                                {shippingOptions.filter(opt => !opt.error).map((opt, idx) => (
                                    <div key={idx} className="flex items-center justify-between border-b border-gray-700 py-1 text-sm gap-2">
                                        <div className="flex items-center gap-2">
                                            {opt.company?.picture && (
                                                <Image src={opt.company.picture} alt={opt.company.name} width={28} height={28} className="rounded bg-white border" />
                                            )}
                                            <span>{opt.company?.name || ""} {opt.name && opt.name !== ".Package" && opt.name !== ".Com" ? `- ${opt.name}` : ""}</span>
                                        </div>
                                        <span>{opt.price ? formatCurrency(Number(opt.price)) : "-"} ({opt.delivery_time} dias)</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="space-y-4 pt-4">
                        <Button
                            onClick={handleBuyClick}
                            disabled={!isProductAvailable || processing}
                            className="w-full py-6 text-lg"
                        >
                            {processing ? "Processando..." : isProductAvailable ? "Comprar Agora" : "Esgotado"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
