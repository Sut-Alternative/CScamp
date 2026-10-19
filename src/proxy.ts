import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (antigo "middleware" — renomeado no Next.js 16).
 *
 * Responsável por barrar acesso não autenticado ao /admin, redirecionando
 * para /admin/login. A checagem real do cookie de sessão será implementada
 * na etapa de autenticação.
 *
 * IMPORTANTE: o proxy é só a primeira barreira. Toda Server Action do admin
 * também deve validar a sessão (Server Actions são POSTs na própria rota).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // TODO(etapa auth): validar cookie de sessão; se inválido:
  // return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  // Webhook GSI (/api/gsi/*) fica FORA do matcher — precisa ser o mais rápido possível.
  matcher: ["/admin/:path*"],
};
