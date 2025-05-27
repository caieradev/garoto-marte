import { FavoritesSection } from "@/components/home/favorites-section";
import { HeroSection } from "@/components/home/hero-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Garoto Marte - Streetwear Exclusiva",
    description: "Roupas streetwear únicas e exclusivas - Cada peça é única e tem apenas um exemplar disponível.",
};

export default function HomePage() {
    return (
        <>
            <main className="flex-1">
                <HeroSection />
                <FavoritesSection />
                {/* Aqui podem ser adicionadas outras seções conforme necessário */}
            </main>
        </>
    );
}