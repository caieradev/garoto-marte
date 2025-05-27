'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import AdminHeader from '@/components/admin/admin-header';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AdminHeader />
      <main className="flex-1 container mx-auto p-6">{children}</main>
      <footer className="border-t border-border/40 bg-card py-4">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Garoto Marte. Todos os direitos reservados.
        </div>
      </footer>

      {/* Script do Cloudinary Upload Widget */}
      <Script
        src="https://upload-widget.cloudinary.com/global/all.js"
        strategy="beforeInteractive"
      />
    </div>
  );
}
