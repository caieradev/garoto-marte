import { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import { AdminGuard } from "@/components/auth/admin-guard";
import AdminLayoutWrapper from "@/components/admin/admin-layout-wrapper";

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
        <AuthProvider>
            <AdminGuard>
                <AdminLayoutWrapper>
                    {children}
                </AdminLayoutWrapper>
            </AdminGuard>
        </AuthProvider>
    );
}
