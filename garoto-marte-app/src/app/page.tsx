import { Navbar } from "@/components/layout/navbar";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Garoto Marte - Streetwear Exclusiva",
};

export default function RootPage({
    children,
}: {
    children: React.ReactNode;
}) {
    // This just passes through to the public home page
    return <>
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar />
            {children}
        </div>;
    </>
}