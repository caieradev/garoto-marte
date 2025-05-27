import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se é uma rota admin (exceto login), verificar autenticação no cliente
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // O middleware do Next.js não tem acesso direto ao Firebase Auth no cliente
    // A verificação real será feita no componente AdminGuard
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
