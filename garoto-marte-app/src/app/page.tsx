import { FavoritesSection } from "@/components/home/favorites-section";
import { GalerySection } from "@/components/home/galery-section";
import { HeroSection } from "@/components/home/hero-section";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Garoto Marte",
    description: "Roupas streetwear únicas e exclusivas - Cada peça é única e tem apenas um exemplar disponível.",
};

export default function HomePage() {
    return (
        <>
            <main className="flex-1">
                <HeroSection />
                <FavoritesSection />
                <GalerySection />
                {/* Aqui podem ser adicionadas outras seções conforme necessário */}
            </main>
        </>
    );
}