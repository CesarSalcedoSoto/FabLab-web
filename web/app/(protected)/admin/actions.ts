"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { promises as fs } from "fs";
import path from "path";

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

  // Inventario (se obtiene desde Vessel API)
  totalEquipment: number;
  equipmentInUse: number;
  lowStockItems: number;

  // Almacenamiento
  storageUsed: number; // bytes
  storageTotal: number; // bytes
  storageFiles: number; // cantidad de archivos
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

    // Obtener todos los miembros del equipo
    const { docs: members, totalDocs } = await payload.find({
      collection: "team-members",
      limit: 1000,
      depth: 0,
    });

    // Contar activos
    const activeCount = members.filter((m) => (m as { active?: boolean }).active !== false).length;

    // Calcular mejora del equipo (basado en miembros activos vs total)
    // Si hay más del 80% activos, se considera una mejora positiva
    const activeRatio = totalDocs > 0 ? (activeCount / totalDocs) * 100 : 0;
    const improvement = Math.round(activeRatio - 70); // Baseline del 70%

    return {
      total: totalDocs,
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

    const { docs } = await payload.find({
      collection: "team-members",
      where: {
        active: {
          equals: true,
        },
      },
      limit: 100,
      depth: 1,
    });

    return docs.map((doc) => {
      const member = doc as { id: string; name?: string; role?: string; category?: string; specialty?: string; image?: { url?: string } | string; active?: boolean };
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        category: member.category,
        specialty: member.specialty,
        image: typeof member.image === "object" ? member.image?.url : member.image,
        active: member.active,
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

    // El campo status usa 'draft' y 'published', no 'active'
    // Consideramos 'published' como proyectos activos
    const { totalDocs: activeProjects } = await payload.find({
      collection: "projects",
      where: {
        status: {
          equals: "published",
        },
      },
      limit: 1,
    });

    // TODO: Calcular tendencia comparando con mes anterior
    // Por ahora usamos un valor basado en la cantidad de proyectos
    const trend = activeProjects > 10 ? 12 : activeProjects > 5 ? 8 : 5;

    return {
      active: activeProjects,
      trend,
    };
  } catch (error) {
    // Si la colección no existe, devolver 0
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
    // Directorio de medios (donde Payload guarda los archivos)
    const mediaDir = path.join(process.cwd(), "media");

    let totalSize = 0;
    let fileCount = 0;

    // Calcular tamaño total de archivos en el directorio media
    try {
      const files = await getFilesRecursively(mediaDir);
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;
          fileCount++;
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
// INVENTARIO (desde Vessel API)
// ============================================================

export async function getInventoryMetrics() {
  try {
    // Usar variable de entorno del servidor (no NEXT_PUBLIC_*)
    const baseUrl = process.env.VESSEL_API_URL || process.env.NEXT_PUBLIC_VESSEL_API_URL;
    
    // Validar que la URL esté configurada
    if (!baseUrl || baseUrl === 'undefined' || baseUrl === 'null') {
      console.warn("[DashboardMetrics] VESSEL_API_URL no configurada, retornando valores por defecto");
      return {
        total: 0,
        active: 0,
        lowStock: 0,
      };
    }

    // Validar token de acceso
    const accessToken = process.env.VESSEL_ACCESS_PRIVATE;
    if (!accessToken) {
      console.warn("[DashboardMetrics] VESSEL_ACCESS_PRIVATE no configurado");
    }

    // Timeout para evitar bloqueos largos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const itemsResponse = await fetch(`${baseUrl}/api/v1/items/read`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { "VESSEL-ACCESS-PRIVATE": accessToken }),
        },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!itemsResponse.ok) {
        console.warn(`[DashboardMetrics] Vessel API respondió con ${itemsResponse.status}`);
        return {
          total: 0,
          active: 0,
          lowStock: 0,
        };
      }

      const itemsData = await itemsResponse.json();
      const items: { status?: string }[] = Array.isArray(itemsData) ? itemsData : itemsData.data || [];
      
      // Contar items activos y en uso
      const totalEquipment = items.length;
      const activeItems = items.filter((item) => item.status === "active");
      
      // Obtener stock para determinar items bajo stock
      let lowStockItems = 0;
      try {
        const stockController = new AbortController();
        const stockTimeoutId = setTimeout(() => stockController.abort(), 3000);
        
        const stockResponse = await fetch(`${baseUrl}/api/v1/stock/read`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { "VESSEL-ACCESS-PRIVATE": accessToken }),
          },
          cache: "no-store",
          signal: stockController.signal,
        });

        clearTimeout(stockTimeoutId);

        if (stockResponse.ok) {
          const stockData = await stockResponse.json();
          const stocks: { available_quantity?: number; quantity?: number; reserved_quantity?: number }[] = 
            Array.isArray(stockData) ? stockData : stockData.data || [];
          
          // Items con cantidad disponible < 5 se consideran bajo stock
          lowStockItems = stocks.filter((s) => 
            (s.available_quantity ?? (s.quantity || 0) - (s.reserved_quantity || 0)) < 5
          ).length;
        }
      } catch (stockErr) {
        // Ignorar errores de stock silenciosamente
        console.debug("[DashboardMetrics] No se pudo obtener stock:", stockErr);
      }

      return {
        total: totalEquipment,
        active: activeItems.length,
        lowStock: lowStockItems,
      };
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      
      // Manejar timeout y errores de red
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        console.warn("[DashboardMetrics] Timeout al conectar con Vessel API");
      } else {
        console.warn("[DashboardMetrics] Error conectando con Vessel API:", fetchErr);
      }
      
      return {
        total: 0,
        active: 0,
        lowStock: 0,
      };
    }
  } catch (error) {
    console.error("[DashboardMetrics] Error inesperado en inventario:", error);
    return {
      total: 0,
      active: 0,
      lowStock: 0,
    };
  }
}

// ============================================================
// MÉTRICAS COMPLETAS DEL DASHBOARD
// ============================================================

// Valores por defecto para métricas fallidas
const DEFAULT_SPECIALISTS = { total: 0, active: 0, improvement: 0 };
const DEFAULT_PROJECTS = { active: 0, trend: 0 };
const DEFAULT_STORAGE = { used: 0, total: 500 * 1024 * 1024, files: 0, available: 500 * 1024 * 1024, usagePercent: 0 };
const DEFAULT_INVENTORY = { total: 0, active: 0, lowStock: 0 };

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Ejecutar todas las consultas en paralelo, cada una con manejo de errores independiente
  const [specialists, projects, storage, inventory] = await Promise.all([
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
  ]);

  return {
    // Especialistas
    totalSpecialists: specialists.total,
    activeSpecialists: specialists.active,
    teamImprovement: specialists.improvement,

    // Proyectos
    activeProjects: projects.active,
    projectsTrend: projects.trend,

    // Inventario
    totalEquipment: inventory.total,
    equipmentInUse: inventory.active,
    lowStockItems: inventory.lowStock,

    // Almacenamiento
    storageUsed: storage.used,
    storageTotal: storage.total,
    storageFiles: storage.files,
  };
}
