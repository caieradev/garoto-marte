"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";

// Nomes dos produtos favoritos que queremos exibir
const FEATURED_PRODUCT_NAMES = [
    "Calça Moinhos",
    "Regata SOLO",
    "Camisa CIRCLES",
    "Calça FLUID"
];

// Função utilitária para validar as URLs de imagem
const validateImageUrls = (products: any[]) => {
    return products.map(product => ({
        ...product,
        mainImage: product.mainImage && product.mainImage !== "" ? product.mainImage : null,
        secondaryImage: product.secondaryImage && product.secondaryImage !== "" ? product.secondaryImage : null
    }));
};

// Produtos para fallback caso a API falhe
const FALLBACK_PRODUCTS = [
    {
        id: "1",
        name: "Calça Moinhos",
        mainImage: "/home/img-7.png",
        secondaryImage: "/home/img-5.png"
    },
    {
        id: "2",
        name: "Regata SOLO",
        mainImage: "/home/img-8.png",
        secondaryImage: "/home/img-5.png"
    },
    {
        id: "3",
        name: "Camisa CIRCLES",
        mainImage: "/home/img-9.png",
        secondaryImage: "/home/img-5.png"
    },
    {
        id: "4",
        name: "Calça Fluid",
        mainImage: "/home/img-10.png",
        secondaryImage: "/home/img-5.png"
    }
];

export function FavoritesSection() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFeaturedProducts() {
            try {
                const response = await fetch('/api/products/get-by-names', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productNames: FEATURED_PRODUCT_NAMES
                    }),
                });

                if (!response.ok) {
                    throw new Error('Falha ao buscar produtos');
                } const data = await response.json();
                if (data.success && data.products && data.products.length > 0) {
                    // Garantir que todos os produtos têm URLs de imagem válidas
                    const validatedProducts = validateImageUrls(data.products);
                    setFeaturedProducts(validatedProducts);
                } else {
                    console.error('Resposta da API não contém produtos', data);
                    // Fallback para produtos mockados em caso de erro
                    setFeaturedProducts(validateImageUrls(FALLBACK_PRODUCTS));
                }
            } catch (error) {
                console.error('Erro ao buscar produtos favoritos:', error);
                // Fallback para produtos mockados em caso de erro
                setFeaturedProducts(validateImageUrls(FALLBACK_PRODUCTS));
            } finally {
                setLoading(false);
            }
        }

        fetchFeaturedProducts();
    }, []);

    const nextSlide = () => {
        if (featuredProducts.length > 0) {
            setCurrentSlide((prev) => (prev === featuredProducts.length - 1 ? 0 : prev + 1));
        }
    };

    const prevSlide = () => {
        if (featuredProducts.length > 0) {
            setCurrentSlide((prev) => (prev === 0 ? featuredProducts.length - 1 : prev - 1));
        }
    };    // Funcionalidade de swipe para dispositivos de toque
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Mínima distância para ser considerada um swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }
    };

    if (loading) {
        return (
            <section className="bg-white py-12 overflow-hidden w-full">
                <div className="container mx-auto px-4 overflow-hidden">
                    <div className="w-full text-center md:text-left md:pl-4 mb-8">
                        <h2 className="text-black text-5xl font-medium">FAVORITOS</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-300 h-64 mb-4 rounded-md"></div>
                                <div className="bg-gray-300 h-8 w-2/3 mx-auto md:mx-0 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white py-12 overflow-hidden w-full">
            <div className="container mx-auto px-4 overflow-hidden">
                <div className="w-full text-center md:text-left md:pl-4 mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
                    <h2 className="text-black text-5xl font-medium">FAVORITOS</h2>
                    <Link href="/brado" passHref className="text-black mx-auto md:mx-0 mt-4 md:mt-0 flex items-center justify-center gap-1 group">
                        Coleção completa
                        <span className="transition-transform group-hover:translate-x-1">&gt;</span>
                    </Link>
                </div>

                {/* Versão Mobile (Carrossel) */}
                <div className="relative md:hidden">
                    <div ref={carouselRef} className="overflow-hidden w-full">
                        <div
                            className="flex transition-transform duration-300 ease-in-out w-full"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {featuredProducts.map((product) => (
                                <div key={product.id} className="w-full flex-shrink-0">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {featuredProducts.length > 1 && (
                        <div className="flex justify-between mt-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={prevSlide}
                                className="rounded-full bg-black text-white border-none hover:bg-gray-800"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex space-x-2">
                                {featuredProducts.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${currentSlide === index ? 'bg-black' : 'bg-gray-300'}`}
                                        onClick={() => setCurrentSlide(index)}
                                    />
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={nextSlide}
                                className="rounded-full bg-black text-white border-none hover:bg-gray-800"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Versão Desktop (Grid) */}
                <div className="hidden md:grid md:grid-cols-4 gap-6">
                    {featuredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
