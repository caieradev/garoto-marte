import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

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
            <body className={`${inter.className} bg-black text-white`} suppressHydrationWarning>
                {children}
                <Toaster richColors position="top-right" />
                <Script
                    src="https://widget.cloudinary.com/v2.0/global/all.js"
                    strategy="lazyOnload"
                />
            </body>
        </html>
    );
}