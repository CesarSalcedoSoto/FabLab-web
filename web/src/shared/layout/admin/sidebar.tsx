"use client";

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { useAuth, hasModuleAccess } from '@/features/auth';
import type { FeatureModule, UserModuleAccess } from '@/features/auth/domain/value-objects/permission';
import {
  Package,
  Users,
  Settings,
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
  ExternalLink
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: FeatureModule; // Módulo requerido para ver este item
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
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
    title: 'Equipos',
    href: '/admin/inventory/items',
    icon: Wrench,
  },
  {
    title: 'Proyectos',
    href: '/admin/content/projects',
    icon: FolderTree,
  },
  {
    title: 'Especialistas',
    href: '/admin/content/team',
    icon: Users,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
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

function SidebarItemComponent({ item, level = 0 }: { item: SidebarItem; level?: number }) {
  const [isPressed, setIsPressed] = useState(false);
  const Icon = item.icon;

  const handleMouseDown = useCallback(() => setIsPressed(true), []);
  const handleMouseUp = useCallback(() => setIsPressed(false), []);
  const handleMouseLeave = useCallback(() => setIsPressed(false), []);

  return (
    <Link
      href={item.href || '/admin'}
      className={cn(
        'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
        isPressed
          ? 'bg-gray-900 text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className="h-5 w-5" />
      <span>{item.title}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const { effectiveModuleAccess, isSimulating, stopSimulation, user } = useAuth();

  // Filtrar items según acceso a módulos (usa effectiveModuleAccess que incluye simulación)
  const visibleItems = filterItemsByModule(sidebarItems, effectiveModuleAccess);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">FL</span>
        </div>
        <span className="font-bold text-lg">Fab Lab ERP</span>
      </div>

      {isSimulating && (
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
      
      <nav className="p-4 space-y-1 flex-1">
        {visibleItems.map((item) => (
          <SidebarItemComponent key={item.title} item={item} />
        ))}
      </nav>

      {/* Footer con usuario */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm">
          <p className="font-medium text-gray-900">Administrador</p>
          <p className="text-gray-600">{user?.email || 'admin@fablab.com'}</p>
        </div>
      </div>
    </aside>
  );
}