/**
 * Layout para el grupo de rutas protegidas (admin)
 * 
 * Este layout maneja el HTML, body y providers para las páginas de administración
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/shared/auth/AuthProvider";
import { ToastProvider } from "@/shared/ui/feedback/toast-provider";
import "@/shared/theme/globals.css";

// Marcar todas las rutas protegidas como dinámicas
export const dynamic = 'force-dynamic';

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Admin - FabLab INACAP",
    description: "Panel de administración del FabLab INACAP",
    robots: "noindex, nofollow",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" }
    ]
};

export default function ProtectedGroupLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <AuthProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
