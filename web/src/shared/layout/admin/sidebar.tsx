"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/utils';
import { useAuth, hasModuleAccess } from '@/features/auth';
import type { FeatureModule, UserModuleAccess } from '@/features/auth/domain/value-objects/permission';
import {
  Package,
  Users,
  Home,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FolderTree,
  Boxes,
  FileText,
  List,
  PlusCircle,
  Shield,
  UserCog,
  Building2,
  ArrowDownUp,
  CalendarClock,
  Database,
  Wrench,
  Cpu,
  Calendar,
  HelpCircle,
  MessageSquare,
  ImageIcon,
  ExternalLink,
  PanelLeftClose,
  PanelLeft,
  Monitor,
  User,
  LogOut,
  ClipboardList,
  BookOpen,
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: FeatureModule; // Módulo requerido para ver este item
  children?: SidebarItem[];
  adminOnly?: boolean; // Solo visible para admins
}

// Items para usuarios admin
const adminSidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
    adminOnly: true,
  },
  {
    title: 'Inventario',
    href: '/admin/inventory',
    icon: Package,
    adminOnly: true,
  },
  {
    title: 'Equipos',
    href: '/admin/inventory/items',
    icon: Wrench,
    adminOnly: true,
  },
  {
    title: 'Usos de Equipos',
    href: '/admin/equipment-usage',
    icon: Monitor,
  },
  {
    title: 'Solicitudes FabLab',
    href: '/admin/solicitudes',
    icon: ClipboardList,
    adminOnly: true,
  },
  {
    title: 'Contacto',
    href: '/admin/contacto',
    icon: MessageSquare,
    adminOnly: true,
  },
  {
    title: 'Blog',
    href: '/admin/blog',
    icon: FileText,
    adminOnly: true,
  },
  {
    title: 'Eventos',
    href: '/admin/eventos',
    icon: Calendar,
    adminOnly: true,
  },
  {
    title: 'Recursos',
    href: '/admin/recursos',
    icon: BookOpen,
    adminOnly: true,
  },
  {
    title: 'Galería',
    href: '/admin/galeria',
    icon: ImageIcon,
    adminOnly: true,
  },
  {
    title: 'Proyectos',
    href: '/admin/content/projects',
    icon: FolderTree,
    adminOnly: true,
  },
  {
    title: 'Especialistas',
    href: '/admin/content/team',
    icon: Users,
    adminOnly: true,
  },
];

// Items para usuarios normales (viewer)
const viewerSidebarItems: SidebarItem[] = [
  {
    title: 'Usos de Equipos',
    href: '/admin/equipment-usage',
    icon: Monitor,
  },
  {
    title: 'Mi Perfil',
    href: '/admin/profile',
    icon: User,
  },
];

/**
 * Verificar si el usuario tiene acceso a un módulo
 */
function userHasModuleAccess(userAccess: UserModuleAccess, requiredModule?: FeatureModule): boolean {
  if (!requiredModule) return true; // Sin módulo requerido = visible para todos
  return hasModuleAccess(userAccess, requiredModule, 'view');
}

/**
 * Filtrar items según acceso del usuario a módulos
 */
function filterItemsByModule(items: SidebarItem[], userAccess: UserModuleAccess): SidebarItem[] {
  return items
    .filter(item => userHasModuleAccess(userAccess, item.module))
    .map(item => ({
      ...item,
      children: item.children
        ? filterItemsByModule(item.children, userAccess)
        : undefined,
    }))
    .filter(item => !item.children || item.children.length > 0);
}

function SidebarItemComponent({ item, collapsed = false }: { item: SidebarItem; collapsed?: boolean }) {
  const [isPressed, setIsPressed] = useState(false);
  const Icon = item.icon;

  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);
  const handleMouseLeave = useCallback(() => setIsPressed(false), []);

  return (
    <Link
      href={item.href || '/admin'}
      className={cn(
        'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
        collapsed ? 'justify-center' : 'space-x-3',
        isPressed
          ? 'bg-gray-900 text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      title={collapsed ? item.title : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
}

export function AdminSidebar({ onClose }: { onClose?: () => void } = {}) {
  const { effectiveModuleAccess, isSimulating, stopSimulation, user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // En modo móvil (cuando hay onClose), no colapsamos, cerramos el panel
  const isMobileMode = !!onClose;

  // Verificar si el usuario es admin
  // Verificamos tanto el role.code del sistema de auth como el payloadRole directo
  const isAdmin = user?.role?.code === 'super_admin' || 
                  user?.role?.code === 'admin' || 
                  (user as any)?.payloadRole === 'admin';

  // Seleccionar items según el rol del usuario
  const baseItems = isAdmin ? adminSidebarItems : viewerSidebarItems;

  // Filtrar items según acceso a módulos (usa effectiveModuleAccess que incluye simulación)
  const visibleItems = filterItemsByModule(baseItems, effectiveModuleAccess);

  const handleLogout = async () => {
    try {
      // Llamar al logout del auth provider
      await logout();
      // Limpiar storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fablab_user');
        localStorage.removeItem('fablab_user');
        localStorage.removeItem('user');
      }
      // Forzar recarga completa a login
      window.location.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así intentar redirigir
      window.location.replace('/login');
    }
  };

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 overflow-y-auto flex flex-col transition-all duration-300",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      {/* Logo y botón de colapsar */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between min-h-[64px]">
        <Link 
          href="/"
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-300 hover:opacity-80",
            collapsed ? "w-10" : "w-full"
          )}
        >
          <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
            <Image
              src="/images/logos/fablab-logo.png"
              alt="FabLab"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
        </Link>
        <button
          onClick={() => isMobileMode ? onClose?.() : setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-2",
            collapsed && "ml-1"
          )}
          title={isMobileMode ? "Cerrar menú" : (collapsed ? "Expandir menú" : "Contraer menú")}
        >
          {isMobileMode ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {isSimulating && !collapsed && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 text-center">
          <p className="text-xs font-medium text-amber-800 mb-2">
            Modo Simulación
          </p>
          <button
            onClick={stopSimulation}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md transition-colors"
          >
            Volver a mi vista
          </button>
        </div>
      )}
      
      <nav className={cn("p-2 space-y-1 flex-1", collapsed && "px-2")}>
        {visibleItems.map((item) => (
          <SidebarItemComponent key={item.title} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer con usuario y botón de cerrar sesión */}
      <div className="border-t border-gray-200 bg-gray-50">
        {!collapsed && (
          <div className="p-4 pb-2">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{isAdmin ? 'Administrador' : 'Usuario'}</p>
              <p className="text-gray-600 truncate">{user?.name || user?.email || 'usuario@fablab.com'}</p>
            </div>
          </div>
        )}
        <div className={cn("p-2", collapsed ? "px-2" : "px-4 pb-4")}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-red-600 hover:bg-red-50 hover:text-red-700",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}