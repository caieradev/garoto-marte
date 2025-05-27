import { Navbar } from "@/components/layout/navbar";

export default function PublicRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar />
            {children}
        </div>
    );
}
