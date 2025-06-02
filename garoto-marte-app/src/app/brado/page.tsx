import { BradoHeroSection } from "@/components/brado/hero-section";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "BRADO - Garoto Marte",
    description: "BRADO - Entre espirais, coroas e olhos, nasce a BRADO. Ela não grita, mas arde.",
};

export default function BradoPage() {
    return (
        <>
            <main className="flex-1">
                <BradoHeroSection />
                {/* Outras seções da página BRADO podem ser adicionadas aqui */}
            </main>
        </>
    );
}
