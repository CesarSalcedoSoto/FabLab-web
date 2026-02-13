import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de autenticación para Next.js
 *
 * Protege rutas que requieren login:
 * - /admin/* (todas las rutas de admin)
 * - /control-iot/*
 * - /cms/*
 *
 * NOTA: La verificación de ROLES se hace en el layout/páginas del servidor,
 * porque el token JWT de Payload NO incluye el rol del usuario.
 * El middleware solo verifica que el usuario esté autenticado (tenga token).
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("fablab_token")?.value || req.cookies.get("payload-token")?.value;

  // No procesar si ya está en login
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Protect admin routes - solo verificar autenticación
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    // La verificación de roles se hace en el layout de admin (server-side)
    return NextResponse.next();
  }

  // Protect control-iot routes
  if (pathname.startsWith("/control-iot")) {
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/control-iot/:path*"],
};
