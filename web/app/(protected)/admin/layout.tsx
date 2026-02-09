"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { AdminSidebar } from "@/shared/layout/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    // Redirigir si no está autenticado (después del render)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, router]);

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

    return (
        <div className="min-h-screen flex bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}
