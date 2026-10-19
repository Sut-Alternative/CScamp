import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso à tela de login
  if (pathname === "/admin/login") {
    // Se já estiver logado, redireciona para o dashboard
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (verifySessionToken(token)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Proteger todas as outras rotas /admin/*
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!verifySessionToken(token)) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // O webhook GSI (/api/gsi/*) fica fora do matcher para máxima performance
  matcher: ["/admin/:path*"],
};
