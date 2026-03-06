"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

// ============================================================
// VERIFICACIÓN DE ADMIN
// ============================================================

/**
 * Verificar si el usuario actual es administrador
 * Usar en funciones que requieren permisos de admin
 */
async function verifyAdminAccess(): Promise<{ isAdmin: boolean; userId?: number | string }> {
  try {
    const payload = await getPayload({ config });
    const cookieStore = await cookies();
    const token = cookieStore.get("payload-token")?.value || cookieStore.get("fablab_token")?.value;
    
    if (!token) {
      return { isAdmin: false };
    }
    
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) });
    
    if (!user) {
      return { isAdmin: false };
    }
    
    const role = (user as any).role;
    const isAdmin = role === 'admin' || role === 'super_admin' || 
                    (typeof role === 'object' && (role?.code === 'admin' || role?.code === 'super_admin'));
    
    return { isAdmin, userId: user.id };
  } catch {
    return { isAdmin: false };
  }
}

/**
 * Lanzar error si el usuario no es admin
 */
async function requireAdmin(): Promise<void> {
  const { isAdmin } = await verifyAdminAccess();
  if (!isAdmin) {
    throw new Error("Acceso denegado: Se requieren permisos de administrador");
  }
}

// ============================================================
// TIPOS
// ============================================================

export interface DashboardMetrics {
  // Especialistas
  totalSpecialists: number;
  activeSpecialists: number;
  teamImprovement: number; // porcentaje

  // Proyectos
  activeProjects: number;
  projectsTrend: number; // porcentaje vs mes anterior

  // Inventario (local Payload)
  totalEquipment: number;
  equipmentInUse: number;
  lowStockItems: number;
  totalInventoryItems: number;
  totalInventoryStock: number;

  // Almacenamiento
  storageUsed: number; // bytes
  storageTotal: number; // bytes
  storageFiles: number; // cantidad de archivos

  // Alertas
  newContactMessages: number;   // mensajes con estado "nuevo"
  pendingSolicitudes: number;   // solicitudes con status "pending"
}

export interface StorageInfo {
  used: number;
  total: number;
  files: number;
  available: number;
  usagePercent: number;
}

// ============================================================
// ESPECIALISTAS
// ============================================================

export async function getSpecialistsMetrics() {
  try {
    const payload = await getPayload({ config });

    // Obtener total de usuarios
    const { totalDocs: totalUsers } = await payload.find({
      collection: "users",
      limit: 1,
    });

    // Obtener usuarios visibles en equipo (showInTeam = true)
    const { totalDocs: activeCount } = await payload.find({
      collection: "users",
      where: {
        showInTeam: {
          equals: true,
        },
      },
      limit: 1,
    });

    // Calcular mejora del equipo
    const improvement = activeCount > 5 ? 15 : activeCount > 2 ? 8 : 0;

    return {
      total: totalUsers,
      active: activeCount,
      improvement: Math.max(0, improvement),
    };
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo especialistas:", error);
    return {
      total: 0,
      active: 0,
      improvement: 0,
    };
  }
}

export async function getActiveSpecialists() {
  try {
    const payload = await getPayload({ config });

    // Obtener usuarios con showInTeam = true de la colección users
    const { docs } = await payload.find({
      collection: "users",
      where: {
        showInTeam: {
          equals: true,
        },
      },
      limit: 100,
      depth: 1,
      sort: 'order',
    });

    return docs.map((doc: any) => {
      return {
        id: doc.id,
        name: doc.name || 'Sin nombre',
        email: doc.email,
        role: doc.jobTitle || '',
        category: doc.category || 'specialist',
        specialty: doc.jobTitle || '',
        image: typeof doc.avatar === "object" ? doc.avatar?.url : null,
        active: true,
      };
    });
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo especialistas activos:", error);
    return [];
  }
}

// ============================================================
// PROYECTOS
// ============================================================

export async function getProjectsMetrics() {
  try {
    const payload = await getPayload({ config });

    // Proyectos publicados (activos)
    const { totalDocs: activeProjects } = await payload.find({
      collection: "projects",
      where: {
        status: {
          equals: "published",
        },
      },
      limit: 1,
    });

    // Calcular tendencia real: proyectos creados este mes
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { totalDocs: newThisMonth } = await payload.find({
      collection: "projects",
      where: {
        createdAt: {
          greater_than_equal: startOfMonth,
        },
      },
      limit: 1,
    });

    return {
      active: activeProjects,
      trend: newThisMonth,
    };
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo proyectos:", error);
    return {
      active: 0,
      trend: 0,
    };
  }
}

export async function getActiveProjects() {
  try {
    const payload = await getPayload({ config });

    const { docs } = await payload.find({
      collection: "projects",
      where: {
        status: {
          equals: "published",
        },
      },
      limit: 10,
      depth: 1,
    });

    return docs.map((doc) => {
      const project = doc as { id: string; title?: string; status?: string; description?: string; createdAt?: string };
      return {
        id: project.id,
        title: project.title,
        status: project.status,
        description: project.description,
        createdAt: project.createdAt,
      };
    });
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo proyectos activos:", error);
    return [];
  }
}

// ============================================================
// ALMACENAMIENTO
// ============================================================

export async function getStorageMetrics(): Promise<StorageInfo> {
  try {
    const payload = await getPayload({ config });

    // Contar archivos reales desde la colección media de Payload
    const { totalDocs: fileCount } = await payload.find({
      collection: 'media',
      limit: 0,
      overrideAccess: true,
    });

    // Directorio de medios (donde Payload guarda los archivos)
    const mediaDir = path.join(process.cwd(), "media");

    let totalSize = 0;

    // Calcular tamaño total de archivos en el directorio media
    try {
      const files = await getFilesRecursively(mediaDir);
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;
        } catch {
          // Ignorar archivos que no se pueden leer
        }
      }
    } catch {
      // Si el directorio no existe, comenzar con 0
    }

    // Límite de almacenamiento configurable (default 500MB)
    const storageLimit =
      parseInt(process.env.STORAGE_LIMIT_MB || "500", 10) * 1024 * 1024;

    const available = Math.max(0, storageLimit - totalSize);
    const usagePercent = storageLimit > 0 ? (totalSize / storageLimit) * 100 : 0;

    return {
      used: totalSize,
      total: storageLimit,
      files: fileCount,
      available,
      usagePercent: Math.round(usagePercent * 10) / 10,
    };
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo almacenamiento:", error);
    return {
      used: 0,
      total: 500 * 1024 * 1024, // 500MB default
      files: 0,
      available: 500 * 1024 * 1024,
      usagePercent: 0,
    };
  }
}

async function getFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await getFilesRecursively(fullPath)));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignorar errores de lectura
  }

  return files;
}

// ============================================================
// INVENTARIO (local Payload)
// ============================================================

export async function getInventoryMetrics() {
  try {
    const payload = await getPayload({ config });

    const [equipResult, invResult] = await Promise.all([
      payload.find({ collection: 'equipment', limit: 500, overrideAccess: true }),
      payload.find({ collection: 'inventory-items', limit: 500, overrideAccess: true }),
    ]);

    const equipDocs = equipResult.docs as any[];
    const invDocs = invResult.docs as any[];

    // Sumar stock total real de todos los insumos
    const totalStock = invDocs.reduce((sum: number, d: any) => sum + (Number(d.quantity) || 0), 0);

    return {
      total: equipDocs.length,
      inUse: equipDocs.filter(d => d.status === 'in-use').length,
      lowStock: invDocs.filter(d => d.status === 'low-stock' || d.status === 'out-of-stock').length,
      totalInventoryItems: invDocs.length,
      totalInventoryStock: totalStock,
    };
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo inventario local:", error);
    return { total: 0, inUse: 0, lowStock: 0, totalInventoryItems: 0 };
  }
}

// ============================================================
// ALERTAS (Contacto y Solicitudes)
// ============================================================

export async function getAlertCounts() {
  try {
    const payload = await getPayload({ config });

    const [contactResult, solicitudesResult] = await Promise.all([
      payload.find({
        collection: 'contact-messages',
        where: { estado: { equals: 'nuevo' } },
        limit: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'equipment-requests',
        where: { status: { equals: 'pending' } },
        limit: 1,
        overrideAccess: true,
      }),
    ]);

    return {
      newContactMessages: contactResult.totalDocs,
      pendingSolicitudes: solicitudesResult.totalDocs,
    };
  } catch (error) {
    console.error("[DashboardMetrics] Error obteniendo alertas:", error);
    return { newContactMessages: 0, pendingSolicitudes: 0 };
  }
}

// ============================================================
// ACTIVIDAD RECIENTE
// ============================================================

export interface RecentActivityItem {
  id: string;
  type: "equipment_usage" | "new_member" | "project" | "file_upload";
  title: string;
  user: string;
  userAvatar?: string;
  time: string;
  timeRaw: Date;
  metadata?: {
    equipmentName?: string;
    duration?: string;
    isActive?: boolean;
  };
}

/**
 * Obtener actividad reciente (usos de equipos + nuevos integrantes)
 */
export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const activities: RecentActivityItem[] = [];
  
  try {
    const payload = await getPayload({ config });
    
    // 1. Obtener usos de equipos recientes (últimas 24-48 horas)
    try {
      const { docs: usages } = await payload.find({
        collection: "equipment-usage",
        sort: "-startTime",
        limit: 20,
        depth: 2, // depth 2 para cargar user -> avatar (relación anidada)
      });

      for (const usage of usages) {
        const u = usage as any;
        const startTime = new Date(u.startTime);
        const isActive = u.status === "active";
        
        // Obtener avatar del usuario (puede estar en u.user.avatar.url o u.user.avatar)
        let userAvatar: string | undefined;
        if (typeof u.user === 'object' && u.user) {
          const avatar = u.user.avatar;
          if (avatar) {
            // Si avatar es un objeto con url (relación cargada)
            if (typeof avatar === 'object' && avatar.url) {
              userAvatar = avatar.url;
            } 
            // Si avatar es un string directo (URL)
            else if (typeof avatar === 'string' && avatar.startsWith('/')) {
              userAvatar = avatar;
            }
          }
        }

        const userName = u.userName || (typeof u.user === 'object' ? u.user?.name : 'Usuario');
        
        activities.push({
          id: `usage-${u.id}`,
          type: "equipment_usage",
          title: isActive 
            ? `${userName} está usando ${u.equipmentName}` 
            : `${userName} usó ${u.equipmentName}`,
          user: userName,
          userAvatar,
          time: formatRelativeTime(startTime),
          timeRaw: startTime,
          metadata: {
            equipmentName: u.equipmentName,
            duration: u.estimatedDuration,
            isActive,
          },
        });
      }
    } catch (err) {
      console.debug("[RecentActivity] No se pudo obtener usos de equipos:", err);
    }

    // 2. Obtener nuevos especialistas (usuarios agregados al equipo recientemente)
    try {
      const { docs: newMembers } = await payload.find({
        collection: "users",
        where: {
          showInTeam: { equals: true },
        },
        sort: "-createdAt",
        limit: 10,
        depth: 2, // depth 2 para cargar avatar (relación a media)
      });

      // Filtrar solo los agregados en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const member of newMembers) {
        const m = member as any;
        const createdAt = new Date(m.createdAt);
        
        if (createdAt > thirtyDaysAgo) {
          // Obtener avatar del usuario
          let userAvatar: string | undefined;
          if (m.avatar) {
            if (typeof m.avatar === 'object' && m.avatar.url) {
              userAvatar = m.avatar.url;
            } else if (typeof m.avatar === 'string' && m.avatar.startsWith('/')) {
              userAvatar = m.avatar;
            }
          }

          activities.push({
            id: `member-${m.id}`,
            type: "new_member",
            title: `¡Nuevo integrante en FabLab!`,
            user: m.name || m.email || 'Nuevo miembro',
            userAvatar,
            time: formatRelativeTime(createdAt),
            timeRaw: createdAt,
          });
        }
      }
    } catch (err) {
      console.debug("[RecentActivity] No se pudo obtener nuevos miembros:", err);
    }

    // Ordenar por fecha más reciente
    activities.sort((a, b) => b.timeRaw.getTime() - a.timeRaw.getTime());

    // Retornar las 10 más recientes
    return activities.slice(0, 10);
  } catch (error) {
    console.error("[RecentActivity] Error obteniendo actividad reciente:", error);
    return [];
  }
}

/**
 * Formatear tiempo relativo (hace X minutos/horas/días)
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ============================================================
// MÉTRICAS COMPLETAS DEL DASHBOARD
// ============================================================

// Valores por defecto para métricas fallidas
const DEFAULT_SPECIALISTS = { total: 0, active: 0, improvement: 0 };
const DEFAULT_PROJECTS = { active: 0, trend: 0 };
const DEFAULT_STORAGE = { used: 0, total: 500 * 1024 * 1024, files: 0, available: 500 * 1024 * 1024, usagePercent: 0 };
const DEFAULT_INVENTORY = { total: 0, inUse: 0, lowStock: 0, totalInventoryItems: 0, totalInventoryStock: 0 };
const DEFAULT_ALERTS = { newContactMessages: 0, pendingSolicitudes: 0 };

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Verificar acceso de admin
  await requireAdmin();
  
  // Ejecutar todas las consultas en paralelo, cada una con manejo de errores independiente
  const [specialists, projects, storage, inventory, alerts] = await Promise.all([
    getSpecialistsMetrics().catch((err) => {
      console.error("[Dashboard] Error en métricas de especialistas:", err);
      return DEFAULT_SPECIALISTS;
    }),
    getProjectsMetrics().catch((err) => {
      console.error("[Dashboard] Error en métricas de proyectos:", err);
      return DEFAULT_PROJECTS;
    }),
    getStorageMetrics().catch((err) => {
      console.error("[Dashboard] Error en métricas de almacenamiento:", err);
      return DEFAULT_STORAGE;
    }),
    getInventoryMetrics().catch((err) => {
      console.error("[Dashboard] Error en métricas de inventario:", err);
      return DEFAULT_INVENTORY;
    }),
    getAlertCounts().catch((err) => {
      console.error("[Dashboard] Error en alertas:", err);
      return DEFAULT_ALERTS;
    }),
  ]);

  return {
    // Especialistas
    totalSpecialists: specialists.total,
    activeSpecialists: specialists.active,
    teamImprovement: specialists.improvement,

    // Proyectos
    activeProjects: projects.active,
    projectsTrend: projects.trend,

    // Inventario (local)
    totalEquipment: inventory.total,
    equipmentInUse: inventory.inUse,
    lowStockItems: inventory.lowStock,
    totalInventoryItems: inventory.totalInventoryItems,
    totalInventoryStock: inventory.totalInventoryStock,

    // Almacenamiento
    storageUsed: storage.used,
    storageTotal: storage.total,
    storageFiles: storage.files,

    // Alertas
    newContactMessages: alerts.newContactMessages,
    pendingSolicitudes: alerts.pendingSolicitudes,
  };
}
