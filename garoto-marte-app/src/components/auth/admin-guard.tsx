'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface AdminGuardProps {
    children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            // Se está na página de login e já está logado, redirecionar para admin
            if (pathname === '/admin/login' && user) {
                router.push('/admin');
                return;
            }

            // Se não está logado e não está na página de login, redirecionar para login
            if (!user && pathname !== '/admin/login') {
                router.push('/admin/login');
                return;
            }
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se está na página de login, sempre mostrar (independente do estado de autenticação)
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }
    // Para outras páginas admin, só mostrar se estiver logado e for admin
    if (!user) {
        return null;
    }

    return <>{children}</>;
};
