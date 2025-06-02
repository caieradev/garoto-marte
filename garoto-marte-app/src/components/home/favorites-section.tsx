"use client";

import { useState } from "react";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";

// Produtos favoritos mockados
const FEATURED_PRODUCTS: any[] = [
    {
        name: "Calça Moinhos",
        mainImage: "/home/img-7.png",
        secondaryImage: "/home/img-5.png"
    },
    {
        name: "Regata SOLO",
        mainImage: "/home/img-8.png",
        secondaryImage: "/home/img-5.png"
    },
    {
        name: "Camisa CIRCLES",
        mainImage: "/home/img-9.png",
        secondaryImage: "/home/img-5.png"
    },
    {
        name: "Calça Fluid",
        mainImage: "/home/img-10.png",
        secondaryImage: "/home/img-5.png"
    },
];

export function FavoritesSection() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    const nextSlide = () => {
        if (FEATURED_PRODUCTS.length > 0) {
            setCurrentSlide((prev) => (prev === FEATURED_PRODUCTS.length - 1 ? 0 : prev + 1));
        }
    };

    const prevSlide = () => {
        if (FEATURED_PRODUCTS.length > 0) {
            setCurrentSlide((prev) => (prev === 0 ? FEATURED_PRODUCTS.length - 1 : prev - 1));
        }
    };

    // Funcionalidade de swipe para dispositivos de toque
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
    }; return (
        <section className="bg-white py-12 overflow-hidden w-full">
            <div className="container mx-auto px-4 overflow-hidden"><div className="w-full text-center md:text-left md:pl-4 mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
                <h2 className="text-black text-5xl font-medium">FAVORITOS</h2>
                <Link href="/brado" passHref className="text-black mx-auto md:mx-0 mt-4 md:mt-0 flex items-center justify-center gap-1 group">
                    Coleção completa
                    <span className="transition-transform group-hover:translate-x-1">&gt;</span>
                </Link>
            </div>{/* Versão Mobile (Carrossel) */}                <div className="relative md:hidden">
                    <div ref={carouselRef} className="overflow-hidden w-full">
                        <div
                            className="flex transition-transform duration-300 ease-in-out w-full"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {FEATURED_PRODUCTS.map((product) => (
                                <div key={product.id} className="w-full flex-shrink-0">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {FEATURED_PRODUCTS.length > 1 && (
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
                                {FEATURED_PRODUCTS.map((_, index) => (
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
                    {FEATURED_PRODUCTS.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
