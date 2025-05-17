import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

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
            <body className={inter.className}>
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}