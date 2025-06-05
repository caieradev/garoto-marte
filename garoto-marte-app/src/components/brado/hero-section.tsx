"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Grupos de nomes de produtos da coleção BRADO
const PRODUCT_GROUPS = {
    group1: [
        "Casaco Linhas Tortas",
        "Pantacourt DUO",
        "Camisa PURE COLOR",
        "Casaco Black SOUL"
    ],
    group2: [
        "Camisa FERVOR",
        "Calça Untied",
        "Bermuda ALL",
        "Camisa SIDE"
    ],
    group3: [
        "Calça ORIGIN",
        "Camisa ECHO",
        "Camisa CIRCLES",
        "Calça LOOSE"
    ],
    group4: [
        "Calça FADED Memories",
        "Calça Trindade",
        "Calça Correnteza",
        "Calça SHIELD"
    ],
    group5: [
        "Calça FLUID",
        "Calça HIDDEN",
        "Calça Moinhos",
        "Regata SOLO"
    ],
    group6: [
        "Calça FLOOR",
        "Calça Paradoxal"
    ]
};

// Função utilitária para validar as URLs de imagem
const validateImageUrls = (products: any[]) => {
    return products.map(product => ({
        ...product,
        mainImage: product.mainImage && product.mainImage !== "" ? product.mainImage : null,
        secondaryImage: product.secondaryImage && product.secondaryImage !== "" ? product.secondaryImage : null
    }));
};

// Reusable function to fetch and display product cards
interface ProductSectionProps {
    groupKey: 'group1' | 'group2' | 'group3' | 'group4' | 'group5' | 'group6';
    onProductsLoaded?: (products: any[]) => void;
}

function useProductCards(groupKey: 'group1' | 'group2' | 'group3' | 'group4' | 'group5' | 'group6') {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const productNames = PRODUCT_GROUPS[groupKey];

                const response = await fetch('/api/products/get-by-names', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productNames
                    }),
                });

                if (!response.ok) {
                    throw new Error('Falha ao buscar produtos');
                }

                const data = await response.json();
                if (data.success && data.products && data.products.length > 0) {
                    // Garantir que todos os produtos têm URLs de imagem válidas
                    const validatedProducts = validateImageUrls(data.products);
                    setProducts(validatedProducts);
                }
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                // Fallback para produtos mockados em caso de erro
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [groupKey]);

    return { products, loading };
}

function ProductSection({ groupKey }: ProductSectionProps) {
    const { products, loading } = useProductCards(groupKey);
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Funcionalidade de swipe para dispositivos de toque
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const nextSlide = () => {
        if (products.length > 0) {
            setCurrentSlide((prev) => (prev === products.length - 1 ? 0 : prev + 1));
        }
    };

    const prevSlide = () => {
        if (products.length > 0) {
            setCurrentSlide((prev) => (prev === 0 ? products.length - 1 : prev - 1));
        }
    };

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
            <div className="w-full">
                <div className="hidden md:grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-300 h-64 mb-4 rounded-md"></div>
                            <div className="bg-gray-300 h-8 w-2/3 mx-auto md:mx-0 rounded"></div>
                        </div>
                    ))}
                </div>

                {/* Versão Mobile (loading) */}
                <div className="md:hidden animate-pulse">
                    <div className="bg-gray-300 h-64 mb-4 rounded-md"></div>
                    <div className="bg-gray-300 h-8 w-2/3 mx-auto rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Versão Desktop (Grid) */}
            <div
                className={
                    products.length === 2
                        ? "hidden md:flex md:w-full md:justify-around md:gap-0"
                        : "hidden md:grid md:grid-cols-4 gap-6"
                }
            >
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
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
                        {products.map((product) => (
                            <div key={product.id} className="w-full flex-shrink-0">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>

                {products.length > 1 && (
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
                            {products.map((_, index) => (
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
        </div>
    );
}

export function BradoHeroSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Use our reusable hook for each product group
    const { products: featuredProducts1, loading: isLoading } = useProductCards('group1');

    // Funcionalidade de swipe para dispositivos de toque
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Mínima distância para ser considerada um swipe
    const minSwipeDistance = 50;

    const nextSlide = () => {
        if (featuredProducts1.length > 0) {
            setCurrentSlide((prev) => (prev === featuredProducts1.length - 1 ? 0 : prev + 1));
        }
    };

    const prevSlide = () => {
        if (featuredProducts1.length > 0) {
            setCurrentSlide((prev) => (prev === 0 ? featuredProducts1.length - 1 : prev - 1));
        }
    };

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

    return (
        <section ref={sectionRef} className="relative w-full overflow-hidden">
            {/* Imagem principal de fundo */}
            <div className="relative w-full mb-12">
                <Image
                    src="/brado/hero.png"
                    alt="BRADO - Garoto Marte"
                    priority
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                    style={{ width: '100%', height: 'auto' }}
                />
                <div className="absolute bottom-10 w-full flex justify-center">
                    <Image
                        src="/brado/hero-text.png"
                        alt="BRADO - Garoto Marte"
                        priority
                        width={1000}
                        height={0}
                        className="w-[70%]"
                    />
                </div>
                <p className="absolute bottom-3 right-5">tudo em um só</p>
            </div>

            {/* Usando nosso componente reutilizável para o primeiro grupo de produtos */}
            <ProductSection groupKey="group1" />

            <h2 className="text-center mt-10 text-3xl mb-10">Nous voulons révolutionner la scène.</h2>

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                <div className="relative w-[456px] h-[382px]">
                    <Image
                        src="/brado/1.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[411px] h-[382px]">
                    <Image
                        src="/brado/2.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[516px] h-[382px]">
                    <Image
                        src="/brado/3.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center mt-10 mb-10">
                <Image
                    src="/brado/4.png"
                    alt="BRADO - Garoto Marte"
                    priority
                    width={600}
                    height={600}
                    className=""
                />
                <div className="w-full flex flex-col items-center justify-center">
                    <h2 className="text-5xl md:text-left text-center md:mt-0 mt-12">Gravatas no estilo <br />único da Garoto Marte.</h2>
                    <Link
                        href="/produto/4oksLahWBOQa5jf19gCc"
                        className="bg-[#D9D9D9] text-black w-30 rounded-lg flex items-center justify-center text-center mt-10"
                    >
                        acesse<br />aqui
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                {/* Usando nosso componente reutilizável para o segundo grupo de produtos */}
                <ProductSection groupKey="group2" />
            </div>
            <div className="flex flex-col md:flex-row w-full items-center justify-center mt-10">
                <div className="relative w-[426px] h-[402px]">
                    <Image
                        src="/brado/5.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[426px] h-[402px]">
                    <Image
                        src="/brado/6.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[419px] h-[402px]">
                    <Image
                        src="/brado/7.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[235px] h-[402px]">
                    <Image
                        src="/brado/8.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>
            <h2 className="text-center mt-10 text-2xl mx-22 font-thin mb-12">Representadas por cortes estruturados pré-estabelecidos na curadoria dos brechós, tecidos lisos e detalhes marcantes. As peças misturam formas amplas e detalhes ajustados, criando uma harmonia entre imponência e conforto.</h2>

            {/* mais 4 produtos */}            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                {/* Usando nosso componente reutilizável para o terceiro grupo de produtos */}
                <ProductSection groupKey="group3" />


            </div>
            <div className="flex flex-col md:flex-row w-full items-center justify-center mt-12">
                <div className="relative w-[316px] h-[377]">
                    <Image
                        src="/brado/9.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[573px] h-[377]">
                    <Image
                        src="/brado/10.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[550px] h-[377]">
                    <Image
                        src="/brado/11.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>
            <h2 className="text-center mt-10 text-2xl mx-22 font-thin mb-12">
                Contém pinturas dinâmicas e fluídas, texturas contrastantes e uma paleta de cores que dialoga entre tons neutros (cinza claro e azul bebê) e vibrantes (vermelho intenso, vermelho bordô e azul marinho), simbolizando a união entre a natureza e a força emocional.</h2>

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                {/* Usando nosso componente reutilizável para o segundo grupo de produtos */}
                <ProductSection groupKey="group4" />
            </div>

            {/* mais 4 produtos */}

            <div className="flex flex-col md:flex-row w-full items-center justify-center mt-12">
                <div className="relative w-[316px] h-[377]">
                    <Image
                        src="/brado/12.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[573px] h-[377]">
                    <Image
                        src="/brado/13.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[550px] h-[377]">
                    <Image
                        src="/brado/14.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>
            <h2 className="text-center mt-10 text-lg md:text-2xl mx-22 mb-12">
                Destacamos os elementos que remetem a símbolos de resistência e pertencimento, como padrões geométricos e técnicas artesanais. Esses detalhes criam um elo entre passado e presente.</h2>

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                {/* Usando nosso componente reutilizável para o segundo grupo de produtos */}
                <ProductSection groupKey="group5" />
            </div>

            <div className="flex flex-col md:flex-row w-full items-center justify-center mt-12">
                {/* Usando nosso componente reutilizável para o segundo grupo de produtos */}
                <ProductSection groupKey="group6" />
            </div>

            <div className="relative md:-mt-100 z-[-1]">
                <Image
                    src="/brado/16.png"
                    alt="BRADO - Garoto Marte"
                    priority
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                    style={{ width: '100%', height: 'auto' }}
                />
                {/* Desktop: texto absoluto sobre a imagem; Mobile: texto abaixo da imagem */}
                <h2 className="hidden md:block absolute bottom-0 left-0 text-left mt-10 text-sm md:text-2xl w-140" style={{ marginLeft: 0 }}>
                    Por fim, a coleção prioriza reutilizar tecidos/retalhos e processos conscientes (peças de brechó), reforçando a responsabilidade com o planeta, que também é uma forma de BRADO.
                </h2>
                <h2 className="block md:hidden mt-4 text-sm w-full text-left px-4">
                    Por fim, a coleção prioriza reutilizar tecidos/retalhos e processos conscientes (peças de brechó), reforçando a responsabilidade com o planeta, que também é uma forma de BRADO.
                </h2>
            </div>

        </section>
    );
}
