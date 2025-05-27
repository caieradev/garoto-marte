import "./globals.css";
import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const firaCode = Fira_Code({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Garoto Marte - Streetwear Exclusiva",
    description: "Roupas streetwear únicas e exclusivas",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark">
            <body className={`${firaCode.className} bg-black text-white`} suppressHydrationWarning>
                <Navbar />
                {children}
                <Footer />
                <Toaster richColors position="top-right" />
                <Script
                    src="https://widget.cloudinary.com/v2.0/global/all.js"
                    strategy="lazyOnload"
                />
            </body>
        </html>
    );
}