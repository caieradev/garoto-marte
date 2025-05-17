import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Painel Admin - Garoto Marte",
    description: "Painel de administração do Garoto Marte",
};

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b border-border/40 bg-card">
                <div className="container flex h-16 items-center justify-between px-4">
                    <h1 className="text-xl font-bold">Garoto Marte - Admin</h1>
                </div>
            </header>
            <main className="flex-1 container mx-auto p-6">{children}</main>
            <footer className="border-t border-border/40 bg-card py-4">
                <div className="container text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Garoto Marte. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}
