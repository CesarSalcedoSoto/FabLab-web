"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { promises as fs } from "fs";
import path from "path";

// ============================================================
// TIPOS
// ============================================================

export interface PublicDashboardMetrics {
  // Especialistas
  totalSpecialists: number;
  activeSpecialists: number;

  // Proyectos
  activeProjects: number;
  projectsTrend: number;

  // Inventario
  totalEquipment: number;
  equipmentInUse: number;
  lowStockItems: number;
  totalInventoryItems: number;
  totalInventoryStock: number;

  // Almacenamiento
  storageUsed: number;
  storageTotal: number;
  storageFiles: number;

  // Alertas (conteos generales)
  newContactMessages: number;
  pendingSolicitudes: number;
}

export interface PublicRecentActivityItem {
  id: string;
  type: "equipment_usage" | "new_member";
  title: string;
  user: string;
  time: string;
  timeRaw: Date;
  metadata?: {
    equipmentName?: string;
    duration?: string;
    isActive?: boolean;
  };
}

export interface PublicActiveProject {
  id: string;
  title?: string;
  status?: string;
}

export interface PublicSpecialist {
  id: string | number;
  name: string;
  role: string;
  category: string;
  active: boolean;
}

// ============================================================
// FUNCIONES PÚBLICAS (sin requireAdmin)
// ============================================================

async function getSpecialistsMetrics() {
  try {
    const payload = await getPayload({ config });
    const { totalDocs: totalUsers } = await payload.find({
      collection: "users",
      limit: 1,
    });
    const { totalDocs: activeCount } = await payload.find({
      collection: "users",
      where: { showInTeam: { equals: true } },
      limit: 1,
    });
    return { total: totalUsers, active: activeCount };
  } catch (error) {
    console.error("[Panel Público] Error especialistas:", error);
    return { total: 0, active: 0 };
  }
}

async function getProjectsMetrics() {
  try {
    const payload = await getPayload({ config });
    const { totalDocs: activeProjects } = await payload.find({
      collection: "projects",
      where: { status: { equals: "published" } },
      limit: 1,
    });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { totalDocs: newThisMonth } = await payload.find({
      collection: "projects",
      where: { createdAt: { greater_than_equal: startOfMonth } },
      limit: 1,
    });
    return { active: activeProjects, trend: newThisMonth };
  } catch (error) {
    console.error("[Panel Público] Error proyectos:", error);
    return { active: 0, trend: 0 };
  }
}

async function getStorageMetrics() {
  try {
    const payload = await getPayload({ config });
    const { totalDocs: fileCount } = await payload.find({
      collection: "media",
      limit: 0,
      overrideAccess: true,
    });
    const mediaDir = path.join(process.cwd(), "media");
    let totalSize = 0;
    try {
      const files = await getFilesRecursively(mediaDir);
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;
        } catch { /* ignore */ }
      }
    } catch { /* dir doesn't exist */ }
    const storageLimit = parseInt(process.env.STORAGE_LIMIT_MB || "500", 10) * 1024 * 1024;
    return { used: totalSize, total: storageLimit, files: fileCount };
  } catch (error) {
    console.error("[Panel Público] Error almacenamiento:", error);
    return { used: 0, total: 500 * 1024 * 1024, files: 0 };
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
  } catch { /* ignore */ }
  return files;
}

async function getInventoryMetrics() {
  try {
    const payload = await getPayload({ config });
    const [equipResult, invResult] = await Promise.all([
      payload.find({ collection: "equipment", limit: 500, overrideAccess: true }),
      payload.find({ collection: "inventory-items", limit: 500, overrideAccess: true }),
    ]);
    const equipDocs = equipResult.docs as any[];
    const invDocs = invResult.docs as any[];
    const totalStock = invDocs.reduce((sum: number, d: any) => sum + (Number(d.quantity) || 0), 0);
    return {
      total: equipDocs.length,
      inUse: equipDocs.filter((d: any) => d.status === "in-use").length,
      lowStock: invDocs.filter((d: any) => d.status === "low-stock" || d.status === "out-of-stock").length,
      totalInventoryItems: invDocs.length,
      totalInventoryStock: totalStock,
    };
  } catch (error) {
    console.error("[Panel Público] Error inventario:", error);
    return { total: 0, inUse: 0, lowStock: 0, totalInventoryItems: 0, totalInventoryStock: 0 };
  }
}

async function getAlertCounts() {
  try {
    const payload = await getPayload({ config });
    const [contactResult, solicitudesResult] = await Promise.all([
      payload.find({
        collection: "contact-messages",
        where: { estado: { equals: "nuevo" } },
        limit: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: "equipment-requests",
        where: { status: { equals: "pending" } },
        limit: 1,
        overrideAccess: true,
      }),
    ]);
    return {
      newContactMessages: contactResult.totalDocs,
      pendingSolicitudes: solicitudesResult.totalDocs,
    };
  } catch (error) {
    console.error("[Panel Público] Error alertas:", error);
    return { newContactMessages: 0, pendingSolicitudes: 0 };
  }
}

// ============================================================
// MÉTRICAS COMPLETAS — VERSIÓN PÚBLICA (sin requireAdmin)
// ============================================================

export async function getPublicDashboardMetrics(): Promise<PublicDashboardMetrics> {
  const [specialists, projects, storage, inventory, alerts] = await Promise.all([
    getSpecialistsMetrics().catch(() => ({ total: 0, active: 0 })),
    getProjectsMetrics().catch(() => ({ active: 0, trend: 0 })),
    getStorageMetrics().catch(() => ({ used: 0, total: 500 * 1024 * 1024, files: 0 })),
    getInventoryMetrics().catch(() => ({ total: 0, inUse: 0, lowStock: 0, totalInventoryItems: 0, totalInventoryStock: 0 })),
    getAlertCounts().catch(() => ({ newContactMessages: 0, pendingSolicitudes: 0 })),
  ]);

  return {
    totalSpecialists: specialists.total,
    activeSpecialists: specialists.active,
    activeProjects: projects.active,
    projectsTrend: projects.trend,
    totalEquipment: inventory.total,
    equipmentInUse: inventory.inUse,
    lowStockItems: inventory.lowStock,
    totalInventoryItems: inventory.totalInventoryItems,
    totalInventoryStock: inventory.totalInventoryStock,
    storageUsed: storage.used,
    storageTotal: storage.total,
    storageFiles: storage.files,
    newContactMessages: alerts.newContactMessages,
    pendingSolicitudes: alerts.pendingSolicitudes,
  };
}

// ============================================================
// PROYECTOS ACTIVOS — VERSIÓN PÚBLICA
// ============================================================

export async function getPublicActiveProjects(): Promise<PublicActiveProject[]> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "projects",
      where: { status: { equals: "published" } },
      limit: 10,
      depth: 0,
    });
    return docs.map((doc: any) => ({
      id: String(doc.id),
      title: doc.title,
      status: doc.status,
    }));
  } catch {
    return [];
  }
}

// ============================================================
// ESPECIALISTAS ACTIVOS — VERSIÓN PÚBLICA
// ============================================================

export async function getPublicActiveSpecialists(): Promise<PublicSpecialist[]> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "users",
      where: { showInTeam: { equals: true } },
      limit: 100,
      depth: 0,
      sort: "order",
    });
    return docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name || "Sin nombre",
      role: doc.jobTitle || "",
      category: doc.category || "specialist",
      active: true,
    }));
  } catch {
    return [];
  }
}

// ============================================================
// ACTIVIDAD RECIENTE — VERSIÓN PÚBLICA (sin avatars/emails)
// ============================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export async function getPublicRecentActivity(): Promise<PublicRecentActivityItem[]> {
  const activities: PublicRecentActivityItem[] = [];

  try {
    const payload = await getPayload({ config });

    // Usos de equipos recientes
    try {
      const { docs: usages } = await payload.find({
        collection: "equipment-usage",
        sort: "-startTime",
        limit: 20,
        depth: 1,
      });
      for (const usage of usages) {
        const u = usage as any;
        const startTime = new Date(u.startTime);
        const isActive = u.status === "active";
        const userName = u.userName || (typeof u.user === "object" ? u.user?.name : "Usuario");
        activities.push({
          id: `usage-${u.id}`,
          type: "equipment_usage",
          title: isActive
            ? `${userName} está usando ${u.equipmentName}`
            : `${userName} usó ${u.equipmentName}`,
          user: userName,
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
      console.debug("[Panel Público] No se pudo obtener usos de equipos:", err);
    }

    // Nuevos miembros del equipo
    try {
      const { docs: newMembers } = await payload.find({
        collection: "users",
        where: { showInTeam: { equals: true } },
        sort: "-createdAt",
        limit: 10,
        depth: 0,
      });
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      for (const member of newMembers) {
        const m = member as any;
        const createdAt = new Date(m.createdAt);
        if (createdAt > thirtyDaysAgo) {
          activities.push({
            id: `member-${m.id}`,
            type: "new_member",
            title: "¡Nuevo integrante en FabLab!",
            user: m.name || "Nuevo miembro",
            time: formatRelativeTime(createdAt),
            timeRaw: createdAt,
          });
        }
      }
    } catch (err) {
      console.debug("[Panel Público] No se pudo obtener nuevos miembros:", err);
    }

    activities.sort((a, b) => b.timeRaw.getTime() - a.timeRaw.getTime());
    return activities.slice(0, 10);
  } catch {
    return [];
  }
}
