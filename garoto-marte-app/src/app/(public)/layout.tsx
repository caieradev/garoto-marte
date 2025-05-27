import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Garoto Marte - Streetwear Exclusiva",
    description: "Roupas streetwear únicas e exclusivas",
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar />
            {children}
            <Footer />
        </div>
    );
}
