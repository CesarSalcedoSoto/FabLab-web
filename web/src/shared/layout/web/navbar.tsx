"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/ui/buttons/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/misc/sheet";
import { Badge } from "@/shared/ui/badges/badge";
import { Menu, Cpu, Wifi, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/shared/auth/useAuth";
import { Logo } from "@/shared/ui/branding/logo";
import Image from "next/image";

interface NavigationItem {
    href: string;
    label: string;
    badge?: string;
}

const navigationItemsLeft: NavigationItem[] = [
    { href: "/proyectos", label: "Proyectos" },
    { href: "/tecnologias", label: "Tecnologías" },
    { href: "/equipo", label: "Equipo" },
    { href: "/contacto", label: "Contacto" },
];

const navigationItemsRight: NavigationItem[] = [
    { href: "/blog", label: "Blog" },
    { href: "/eventos", label: "Eventos" },
    { href: "/recursos", label: "Recursos" },
    { href: "/galeria", label: "Galería" },
];

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();

    // Close user menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50">
            <div className="relative">
                {/* Barra con trapecio - siempre visible */}
                <div className="absolute inset-x-0 top-0 h-[5rem] pointer-events-none z-0">
                    <svg
                        className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                        viewBox="0 0 1920 80"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0 0 H1920 V44 H1120 L1080 80 H840 L800 44 H0 Z"
                            fill="#ffffff"
                        />
                    </svg>
                </div>

                {/* Hidden admin shortcut - top right corner */}
                <Link href="/admin" className="absolute right-0 top-0 w-6 h-6 opacity-0 z-50" aria-hidden="true" tabIndex={-1} />

                {/* Desktop Navigation Left */}
                <div className="hidden lg:flex absolute left-0 top-0 h-11 w-[40%] justify-center items-center space-x-6 z-20 px-8">
                    {navigationItemsLeft.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 group"
                        >
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-orange-500 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Brand - siempre visible en el centro */}
                <div className="hidden lg:flex absolute top-4 left-1/2 transform -translate-x-1/2 z-50 items-center justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center group cursor-pointer"
                    >
                        <Logo size={40} className="group-hover:scale-110 transition-transform" />
                    </Link>
                </div>

                {/* Desktop Navigation Right */}
                <div className="hidden lg:flex absolute right-0 top-0 h-11 w-[40%] justify-center items-center space-x-6 z-20 px-8">
                    {navigationItemsRight.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 group"
                        >
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-orange-500 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}

                    {user ? (
                        <div className="relative group">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 relative">
                                    {user.avatar ? (
                                        <Image
                                            src={user.avatar}
                                            alt={user.name || 'Avatar'}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                                    {user.name || "Usuario"}
                                </span>
                            </Link>

                            <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="bg-white rounded-lg shadow-lg border py-1 overflow-hidden">
                                    <div className="px-4 py-2 border-b bg-gray-50/50">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <Link
                                        href="/admin/profile"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Perfil
                                    </Link>
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                    >
                                        <Cpu className="w-4 h-4" />
                                        Admin Panel
                                    </Link>
                                    <div className="h-px bg-gray-100 my-1" />
                                    <button
                                        onClick={() => logout()}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Mobile Menu Button */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild className="lg:hidden absolute left-1/2 top-2 transform -translate-x-1/2 z-20">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-800 hover:text-orange-500 hover:bg-orange-50"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <div className="flex flex-col space-y-6 mt-6">
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3">
                                <Logo size={36} />
                                <div>
                                    <h2 className="font-bold text-lg">FabLab INACAP</h2>
                                    <p className="text-xs text-muted-foreground">Los Ángeles</p>
                                </div>
                            </Link>

                            <div className="flex flex-col space-y-1">
                                {/* Navegación principal */}
                                {[...navigationItemsLeft, ...navigationItemsRight].map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-between text-base font-medium hover:text-orange-500 transition-colors duration-200 p-2 rounded-lg hover:bg-orange-50"
                                    >
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <Badge variant="secondary" className="text-xs bg-orange-500 text-white flex items-center gap-1">
                                                {item.href === "/control-iot" && <Wifi className="w-3 h-3" />}
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </Link>
                                ))}

                                {/* Usuario autenticado: mostrar info y opciones */}
                                {user && (
                                    <div className="pt-3 border-t mt-2">
                                        <div className="flex items-center gap-3 px-2 py-2 mb-2">
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 relative">
                                                {user.avatar ? (
                                                    <Image
                                                        src={user.avatar}
                                                        alt={user.name || 'Avatar'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 text-base font-medium hover:text-orange-500 transition-colors duration-200 p-2 rounded-lg hover:bg-orange-50"
                                        >
                                            <Cpu className="w-4 h-4 text-orange-500" />
                                            <span>Admin Panel</span>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-base font-medium text-red-600 hover:text-red-700 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50"
                                            onClick={() => {
                                                logout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Cerrar sesión
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
