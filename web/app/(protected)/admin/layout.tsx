"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/features/auth";
import { AdminSidebar } from "@/shared/layout/admin/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/misc/sheet";
import { Menu, ShieldAlert } from "lucide-react";

// Rutas permitidas para usuarios NO administradores
const VIEWER_ALLOWED_ROUTES = [
    '/admin/equipment-usage',
    '/admin/profile',
    '/admin/reservas',
    '/admin/reservas-salas',
    '/admin/calendario',
    '/admin/mis-proyectos',
];

// Función para verificar si una ruta está permitida para usuarios no-admin
function isRouteAllowedForViewer(pathname: string): boolean {
    return VIEWER_ALLOWED_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    // Verificar si el usuario es admin
    // El rol puede venir en diferentes formatos dependiendo de cómo se cargue el usuario
    const userRole = user?.role;
    const roleCode = typeof userRole === 'string' 
        ? userRole 
        : userRole?.code || (user as any)?.payloadRole;
    
    const isAdmin = roleCode === 'super_admin' || 
                    roleCode === 'admin' || 
                    roleCode === 'editor';

    // Redirigir si no está autenticado (después del render)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    // Verificar acceso a rutas para usuarios no-admin
    useEffect(() => {
        if (!isLoading && isAuthenticated && !isAdmin) {
            // Si es usuario no-admin y está en una ruta NO permitida
            if (!isRouteAllowedForViewer(pathname)) {
                setAccessDenied(true);
                // Redirigir después de mostrar mensaje
                const timeout = setTimeout(() => {
                    router.replace("/admin/equipment-usage");
                }, 2000);
                return () => clearTimeout(timeout);
            } else {
                setAccessDenied(false);
            }
        } else {
            setAccessDenied(false);
        }
    }, [isLoading, isAuthenticated, isAdmin, pathname, router]);

    // Cerrar el menú móvil cuando cambia la ruta
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Mientras verifica autenticación inicial
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Cargando...</p>
            </div>
        );
    }

    // Si no está autenticado, mostrar loading mientras redirige
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Redirigiendo...</p>
            </div>
        );
    }

    // Mostrar página de acceso denegado
    if (accessDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
                    <p className="text-gray-600 mb-4">
                        No tienes permisos para acceder a esta sección.
                    </p>
                    <p className="text-sm text-gray-500">
                        Redirigiendo a tu página principal...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            {/* Sidebar Desktop - Visible solo en md y superior */}
            <div className="hidden md:block">
                <AdminSidebar />
            </div>

            {/* Header Móvil - Visible solo en mobile */}
            <div className="md:hidden border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Image 
                        src="/images/logos/fablab-logo.png" 
                        alt="FabLab" 
                        width={32}
                        height={32}
                        className="h-8 w-8"
                    />
                    <span className="font-semibold text-gray-900">FabLab</span>
                </Link>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <button 
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="Abrir menú"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0" hideCloseButton>
                        <AdminSidebar onClose={() => setMobileMenuOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 w-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
