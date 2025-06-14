import "./globals.css";
import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const firaCode = Fira_Code({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Garoto Marte",
    description: "Roupas streetwear únicas e exclusivas",
    icons: {
        icon: '/logo-gm.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark overflow-x-hidden w-full">
            <body className={`${firaCode.className} bg-black text-white overflow-x-hidden w-full min-h-screen flex flex-col`} suppressHydrationWarning>
                <Navbar />
                <div className="flex-1 flex flex-col">
                    {children}
                </div>
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