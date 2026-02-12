"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/shared/utils';
import { BarChart3, Package, Users, Home, CalendarClock, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/presentation/providers/auth.provider';

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: Home,
    },
    {
        title: 'Inventario',
        href: '/admin/inventory',
        icon: Package,
    },
    {
        title: 'Reservas',
        href: '/admin/inventory/reservas',
        icon: CalendarClock,
    },
    {
        title: 'Perfil',
        href: '/admin/profile',
        icon: Users,
    },
];

export function AdminSidebar({ collapsed = false }: { collapsed?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <aside className={cn(
            'flex h-screen flex-col bg-white shadow-lg transition-width duration-200 overflow-hidden',
            collapsed ? 'w-20' : 'w-64'
        )}>
            <div className="flex h-16 items-center border-b px-4">
                <h2 className={cn('text-lg font-semibold transition-opacity duration-200', collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100')}>Admin Panel</h2>
                <div className="ml-auto">
                    {/* space for optional controls */}
                </div>
            </div>
            <nav className="flex-1 space-y-1 p-2">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className={cn('ml-3 transition-opacity duration-200', collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100')}>{item.title}</span>
                        </Link>
                    );
                })}
            </nav>
            
            {/* Botón de cerrar sesión */}
            <div className="border-t p-2">
                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        'text-red-600 hover:bg-red-50 hover:text-red-700'
                    )}
                >
                    <LogOut className="h-5 w-5" />
                    <span className={cn('ml-3 transition-opacity duration-200', collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100')}>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}