import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Libera CORS para todas as origens, métodos e headers
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', '*');
  response.headers.set('Access-Control-Allow-Headers', '*');

  // Se for preflight (OPTIONS), responde imediatamente
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  const { pathname } = request.nextUrl;

  // Se é uma rota admin (exceto login), verificar autenticação no cliente
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // O middleware do Next.js não tem acesso direto ao Firebase Auth no cliente
    // A verificação real será feita no componente AdminGuard
    return response;
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
