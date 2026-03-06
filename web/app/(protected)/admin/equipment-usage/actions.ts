"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: "available" | "in-use" | "maintenance";
  quantity: number;
  location: string;
  image?: string;
  currentUserId?: string;
  currentUserName?: string;
  estimatedEndTime?: string;
}

interface EquipmentRequest {
  id: string;
  equipmentName: string;
  description: string;
  quantity: number;
  justification: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedByAvatar?: string;
  requestedById?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface EquipmentUsageRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  startTime: string;
  endTime?: string;
  estimatedDuration: string;
  description?: string;
  status: "active" | "completed";
}

/**
 * Obtener el usuario actual
 */
async function getCurrentUser() {
  try {
    const payload = await getPayload({ config });
    const cookieStore = await cookies();
    const token = cookieStore.get("payload-token")?.value || cookieStore.get("fablab_token")?.value;
    
    if (token) {
      const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) });
      if (user) {
        // Mantener el ID en su tipo original (número) para relaciones de Payload
        return {
          id: user.id,
          idString: String(user.id),
          name: (user as any).name || user.email || "Usuario",
          avatar: typeof (user as any).avatar === 'object' ? (user as any).avatar?.url : undefined,
          isAdmin: (user as any).role === 'admin',
        };
      }
    }
  } catch {
    // Ignorar errores de autenticación
  }
  return null;
}

/**
 * Verificar si el usuario actual es administrador
 */
export async function getCurrentUserIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin ?? false;
}

/**
 * Obtener equipos tecnológicos activos del inventario
 * Usa la colección 'equipment' de Payload directamente
 */
export async function getActiveEquipment(): Promise<Equipment[]> {
  const payload = await getPayload({ config });
  
  // 1. Obtener los usos activos
  const usageMap = new Map<string, any>();
  
  try {
    const { docs: allUsages } = await payload.find({
      collection: "equipment-usage",
      where: { status: { equals: "active" } },
      limit: 500,
      depth: 1,
    });

    for (const usage of allUsages) {
      const equipmentId = (usage as any).equipmentId as string;
      usageMap.set(equipmentId, {
        userId: typeof usage.user === 'object' ? String((usage.user as any).id) : String(usage.user),
        userName: (usage as any).userName || (typeof usage.user === 'object' ? (usage.user as any).name : 'Usuario'),
        startTime: (usage as any).startTime,
        estimatedDuration: (usage as any).estimatedDuration,
      });
    }
  } catch (error) {
    console.error("[EquipmentUsage] Error obteniendo usos activos:", error);
  }

  // 2. Obtener equipos de la colección real de Payload
  try {
    const { docs: equipDocs } = await payload.find({
      collection: "equipment",
      where: {
        status: { not_equals: "out-of-service" },
      },
      limit: 200,
      depth: 1,
      overrideAccess: true,
    });

    if (equipDocs.length > 0) {
      return equipDocs.map((doc: any) => {
        const eqId = String(doc.id);
        const activeUsage = usageMap.get(eqId);
        const isInMaintenance = maintenanceStatus.get(eqId) || doc.status === "maintenance";

        const CATEGORY_LABELS: Record<string, string> = {
          '3d-printer': 'Impresión 3D',
          'laser-cutter': 'Corte Láser',
          'cnc': 'CNC',
          'electronics': 'Electrónica',
          'hand-tools': 'Herramientas',
          'power-tools': 'Herramientas',
          '3d-scanner': 'Escáner 3D',
          'other': 'Otros',
        };

        // Resolver imagen
        let imageUrl: string | undefined;
        if (doc.featuredImage) {
          if (typeof doc.featuredImage === 'object' && doc.featuredImage.url) {
            imageUrl = doc.featuredImage.url;
          } else if (typeof doc.featuredImage === 'string') {
            imageUrl = doc.featuredImage;
          }
        }

        return {
          id: eqId,
          name: doc.name || "Sin nombre",
          category: CATEGORY_LABELS[doc.category] || doc.category || "Otros",
          status: isInMaintenance ? "maintenance" as const : activeUsage ? "in-use" as const : "available" as const,
          quantity: 1,
          location: typeof doc.location === 'object' && doc.location ? doc.location.name || "FabLab Principal" : (doc.location || "FabLab Principal"),
          image: imageUrl,
          currentUserId: activeUsage?.userId,
          currentUserName: activeUsage?.userName,
          estimatedEndTime: activeUsage ? calculateEndTime(activeUsage.startTime, activeUsage.estimatedDuration) : undefined,
        };
      });
    }
  } catch (error) {
    console.error("[EquipmentUsage] Error obteniendo equipos:", error);
  }

  // 3. Si no hay equipos en la colección, devolver array vacío
  return [];
}

/**
 * Obtener solicitudes de equipos del usuario actual
 */
export async function getEquipmentRequests(): Promise<EquipmentRequest[]> {
  try {
    const payload = await getPayload({ config });
    const user = await getCurrentUser();

    const { docs: requests } = await payload.find({
      collection: "equipment-requests",
      where: user ? { requestedBy: { equals: user.id } } : {},
      sort: "-createdAt",
      limit: 50,
      depth: 2,
    });

    return requests.map((req: any) => {
      // Obtener avatar del solicitante
      let requestedByAvatar: string | undefined;
      if (typeof req.requestedBy === 'object' && req.requestedBy?.avatar) {
        const avatar = req.requestedBy.avatar;
        requestedByAvatar = typeof avatar === 'object' ? avatar.url : avatar;
      }

      return {
        id: String(req.id),
        equipmentName: req.equipmentName,
        description: req.description || "",
        quantity: req.quantity || 1,
        justification: req.justification || "",
        status: req.status || "pending",
        requestedBy: typeof req.requestedBy === "object" ? req.requestedBy?.name : req.requestedBy || "Usuario",
        requestedByAvatar,
        requestedById: typeof req.requestedBy === "object" ? String(req.requestedBy?.id) : undefined,
        reviewedBy: typeof req.reviewedBy === "object" ? req.reviewedBy?.name : req.reviewedBy,
        reviewNotes: req.reviewNotes,
        createdAt: req.createdAt,
      };
    });
  } catch (error) {
    console.error("[EquipmentUsage] Error obteniendo solicitudes:", error);
    return [];
  }
}

/**
 * Obtener TODAS las solicitudes de equipos (solo admin)
 */
export async function getAllEquipmentRequests(): Promise<EquipmentRequest[]> {
  try {
    const user = await getCurrentUser();
    
    if (!user?.isAdmin) {
      console.warn("[EquipmentRequests] Usuario no es admin");
      return [];
    }

    const payload = await getPayload({ config });

    const { docs: requests } = await payload.find({
      collection: "equipment-requests",
      sort: "-createdAt",
      limit: 200,
      depth: 2,
    });

    return requests.map((req: any) => {
      // Obtener avatar del solicitante
      let requestedByAvatar: string | undefined;
      if (typeof req.requestedBy === 'object' && req.requestedBy?.avatar) {
        const avatar = req.requestedBy.avatar;
        requestedByAvatar = typeof avatar === 'object' ? avatar.url : avatar;
      }

      return {
        id: String(req.id),
        equipmentName: req.equipmentName,
        description: req.description || "",
        quantity: req.quantity || 1,
        justification: req.justification || "",
        status: req.status || "pending",
        requestedBy: typeof req.requestedBy === "object" ? req.requestedBy?.name || req.requestedBy?.email : "Usuario",
        requestedByAvatar,
        requestedById: typeof req.requestedBy === "object" ? String(req.requestedBy?.id) : undefined,
        reviewedBy: typeof req.reviewedBy === "object" ? req.reviewedBy?.name : req.reviewedBy,
        reviewNotes: req.reviewNotes,
        createdAt: req.createdAt,
      };
    });
  } catch (error) {
    console.error("[EquipmentRequests] Error obteniendo todas las solicitudes:", error);
    return [];
  }
}

/**
 * Actualizar el estado de una solicitud (solo admin)
 */
export async function updateRequestStatus(
  requestId: string, 
  status: "pending" | "approved" | "rejected",
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    if (!user.isAdmin) {
      return { success: false, error: "Solo los administradores pueden gestionar solicitudes" };
    }

    const payload = await getPayload({ config });

    await payload.update({
      collection: "equipment-requests",
      id: requestId,
      data: {
        status,
        reviewedBy: user.id,
        reviewNotes: reviewNotes || undefined,
      },
    });

    revalidatePath("/admin/solicitudes");
    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentRequests] Error actualizando solicitud:", error);
    return { success: false, error: "Error al actualizar la solicitud" };
  }
}

/**
 * Obtener historial de usos de equipos
 */
export async function getUsageHistory(): Promise<EquipmentUsageRecord[]> {
  try {
    const payload = await getPayload({ config });

    const { docs: usages } = await payload.find({
      collection: "equipment-usage",
      sort: "-startTime",
      limit: 100,
      depth: 1,
    });

    return usages.map((usage: any) => ({
      id: String(usage.id),
      equipmentId: usage.equipmentId,
      equipmentName: usage.equipmentName,
      userId: typeof usage.user === 'object' ? String(usage.user.id) : String(usage.user),
      userName: usage.userName || (typeof usage.user === 'object' ? (usage.user as any).name : 'Usuario'),
      userAvatar: typeof usage.user === 'object' && (usage.user as any).avatar ? 
        (typeof (usage.user as any).avatar === 'object' ? (usage.user as any).avatar.url : (usage.user as any).avatar) : undefined,
      startTime: usage.startTime,
      endTime: usage.endTime,
      estimatedDuration: usage.estimatedDuration,
      description: usage.description,
      status: usage.status,
    }));
  } catch (error) {
    console.error("[EquipmentUsage] Error obteniendo historial:", error);
    return [];
  }
}

/**
 * Usar un equipo (marcarlo como en uso)
 */
export async function startEquipmentUsage(data: {
  equipmentId: string;
  equipmentName: string;
  estimatedDuration: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config });
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: "Debes iniciar sesión para usar un equipo" };
    }

    // Verificar que el equipo no esté ya en uso
    const { docs: existingUsage } = await payload.find({
      collection: "equipment-usage",
      where: {
        and: [
          { equipmentId: { equals: data.equipmentId } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
    });

    if (existingUsage.length > 0) {
      return { success: false, error: "Este equipo ya está en uso" };
    }

    console.log("[EquipmentUsage] Registrando uso - equipmentId:", data.equipmentId, "equipmentName:", data.equipmentName);

    // Registrar el uso en la base de datos
    await payload.create({
      collection: "equipment-usage",
      data: {
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        user: user.id, // ID numérico para relación de Payload
        userName: user.name,
        startTime: new Date().toISOString(),
        estimatedDuration: data.estimatedDuration,
        description: data.description || "",
        status: "active",
      },
    });

    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentUsage] Error usando equipo:", error);
    return { success: false, error: "Error al registrar el uso del equipo" };
  }
}

/**
 * Liberar un equipo (marcarlo como disponible)
 */
export async function releaseEquipment(equipmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config });
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    // Buscar el uso activo
    const { docs: activeUsages } = await payload.find({
      collection: "equipment-usage",
      where: {
        and: [
          { equipmentId: { equals: equipmentId } },
          { status: { equals: "active" } },
        ],
      },
      limit: 1,
      depth: 1,
    });

    if (activeUsages.length === 0) {
      return { success: false, error: "Este equipo no está en uso" };
    }

    const activeUsage = activeUsages[0];
    const usageUserId = typeof activeUsage.user === 'object' ? String((activeUsage.user as any).id) : String(activeUsage.user);

    // Verificar que el usuario sea quien tiene el equipo
    if (usageUserId !== user.idString) {
      return { success: false, error: "Solo la persona que usa el equipo puede liberarlo" };
    }

    // Actualizar el registro para marcarlo como completado
    await payload.update({
      collection: "equipment-usage",
      id: activeUsage.id,
      data: {
        status: "completed",
        endTime: new Date().toISOString(),
      },
    });

    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentUsage] Error liberando equipo:", error);
    return { success: false, error: "Error al liberar el equipo" };
  }
}

/**
 * Obtener ID del usuario actual (como string para comparaciones en UI)
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.idString || null;
}

/**
 * Enviar una solicitud de equipo nuevo
 */
export async function submitEquipmentRequest(data: {
  equipmentName: string;
  description: string;
  quantity: number;
  justification: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config });
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para enviar una solicitud" };
    }

    if (!data.equipmentName || !data.justification) {
      return { success: false, error: "El nombre del equipo y la justificación son obligatorios" };
    }

    await payload.create({
      collection: "equipment-requests",
      data: {
        equipmentName: data.equipmentName,
        description: data.description || "",
        quantity: data.quantity || 1,
        justification: data.justification,
        status: "pending",
        requestedBy: user.id, // ID numérico para relación de Payload
      },
    });

    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentUsage] Error enviando solicitud:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al enviar la solicitud" 
    };
  }
}

/**
 * Cambiar estado de mantenimiento de un equipo (solo admin)
 */
export async function toggleEquipmentMaintenance(equipmentId: string, setMaintenance: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    if (!user.isAdmin) {
      return { success: false, error: "Solo los administradores pueden cambiar el estado de mantenimiento" };
    }

    const payload = await getPayload({ config });

    // Si se está poniendo en mantenimiento, primero verificar que no esté en uso
    if (setMaintenance) {
      const { docs: activeUsages } = await payload.find({
        collection: "equipment-usage",
        where: {
          and: [
            { equipmentId: { equals: equipmentId } },
            { status: { equals: "active" } },
          ],
        },
        limit: 1,
      });

      if (activeUsages.length > 0) {
        return { success: false, error: "No se puede poner en mantenimiento un equipo que está en uso" };
      }
    }

    // Crear o actualizar registro de mantenimiento
    const maintenanceCollectionExists = await checkCollectionExists(payload, "equipment-maintenance");
    
    if (maintenanceCollectionExists) {
      if (setMaintenance) {
        await payload.create({
          collection: "equipment-maintenance",
          data: {
            equipmentId,
            startDate: new Date().toISOString(),
            status: "active",
            notes: "Puesto en mantenimiento por administrador",
          },
        });
      } else {
        // Buscar y cerrar el mantenimiento activo
        const { docs: maintenances } = await payload.find({
          collection: "equipment-maintenance",
          where: {
            and: [
              { equipmentId: { equals: equipmentId } },
              { status: { equals: "active" } },
            ],
          },
          limit: 1,
        });

        if (maintenances.length > 0) {
          await payload.update({
            collection: "equipment-maintenance",
            id: maintenances[0].id,
            data: {
              status: "completed",
              endDate: new Date().toISOString(),
            },
          });
        }
      }
    }

    // Guardar estado en localStorage del servidor usando una colección simple
    // Por ahora usamos el estado en memoria que se sincroniza con getActiveEquipment
    maintenanceStatus.set(equipmentId, setMaintenance);

    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentUsage] Error cambiando mantenimiento:", error);
    return { success: false, error: "Error al cambiar el estado de mantenimiento" };
  }
}

// Mapa en memoria para estados de mantenimiento (para equipos por defecto)
const maintenanceStatus = new Map<string, boolean>();

async function checkCollectionExists(payload: any, collectionSlug: string): Promise<boolean> {
  try {
    await payload.find({ collection: collectionSlug, limit: 1 });
    return true;
  } catch {
    return false;
  }
}

// Helpers
function calculateEndTime(startTime: string, duration: string): string {
  const start = new Date(startTime);
  const durationMap: Record<string, number> = {
    "30min": 30,
    "1h": 60,
    "2h": 120,
    "4h": 240,
    "8h": 480,
    "1d": 1440,
    "2d": 2880,
    "1w": 10080,
  };
  const minutes = durationMap[duration] || 60;
  return new Date(start.getTime() + minutes * 60 * 1000).toISOString();
}

// ==================== RESERVAS DE EQUIPOS ====================

export interface EquipmentReservation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: string;
}

/**
 * Obtener reservas de equipos
 */
export async function getEquipmentReservations(): Promise<EquipmentReservation[]> {
  try {
    const payload = await getPayload({ config });

    const { docs: reservations } = await payload.find({
      collection: "equipment-reservations",
      sort: "-createdAt",
      limit: 200,
      depth: 1,
      overrideAccess: true,
    });

    return reservations.map((res: any) => ({
      id: String(res.id),
      equipmentId: res.equipmentId || "",
      equipmentName: res.equipmentName || "",
      userId: typeof res.user === "object" ? String(res.user?.id) : String(res.user),
      userName: res.userName || (typeof res.user === "object" ? res.user?.name : "Usuario"),
      date: res.date || "",
      startTime: res.startTime || "",
      endTime: res.endTime || "",
      description: res.description || "",
      status: res.status || "pending",
      createdAt: res.createdAt,
    }));
  } catch (error) {
    console.error("[EquipmentReservations] Error obteniendo reservas:", error);
    return [];
  }
}

/**
 * Crear una reserva de equipo (descripción obligatoria)
 */
export async function createEquipmentReservation(data: {
  equipmentId: string;
  equipmentName: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config });
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para reservar un equipo" };
    }

    if (!data.description || !data.description.trim()) {
      return { success: false, error: "La descripción es obligatoria" };
    }

    if (!data.date || !data.startTime || !data.endTime) {
      return { success: false, error: "Fecha, hora de inicio y hora de fin son obligatorias" };
    }

    if (data.startTime >= data.endTime) {
      return { success: false, error: "La hora de fin debe ser posterior a la hora de inicio" };
    }

    // Verificar que la reserva sea con al menos 1 hora de anticipación
    const now = new Date();
    const reservationStart = new Date(`${data.date}T${data.startTime}:00`);
    const diffMs = reservationStart.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 60) {
      return { success: false, error: "Debes reservar con al menos 1 hora de anticipación" };
    }

    // Verificar que no exista otra reserva del mismo equipo en la misma fecha/hora
    const { docs: existingReservations } = await payload.find({
      collection: "equipment-reservations",
      where: {
        and: [
          { equipmentId: { equals: data.equipmentId } },
          { date: { equals: data.date } },
          { status: { in: ["pending", "active"] } },
        ],
      },
      limit: 100,
      overrideAccess: true,
    });

    const hasConflict = existingReservations.some((res: any) => {
      return res.startTime < data.endTime && data.startTime < res.endTime;
    });

    if (hasConflict) {
      return { success: false, error: "Ya existe una reserva para este equipo en ese horario" };
    }

    await payload.create({
      collection: "equipment-reservations",
      data: {
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        user: user.id,
        userName: user.name,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description.trim(),
        status: "pending",
      },
    });

    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentReservations] Error creando reserva:", error);
    return { success: false, error: "Error al crear la reserva" };
  }
}

/**
 * Cancelar una reserva del usuario actual
 */
export async function cancelEquipmentReservation(reservationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config });
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    const reservation = await payload.findByID({
      collection: "equipment-reservations",
      id: reservationId,
      depth: 1,
    });

    if (!reservation) {
      return { success: false, error: "Reserva no encontrada" };
    }

    const resUserId = typeof (reservation as any).user === "object"
      ? String((reservation as any).user?.id)
      : String((reservation as any).user);

    if (resUserId !== user.idString && !user.isAdmin) {
      return { success: false, error: "Solo puedes cancelar tus propias reservas" };
    }

    await payload.update({
      collection: "equipment-reservations",
      id: reservationId,
      data: { status: "cancelled" },
    });

    revalidatePath("/admin/equipment-usage");
    return { success: true };
  } catch (error) {
    console.error("[EquipmentReservations] Error cancelando reserva:", error);
    return { success: false, error: "Error al cancelar la reserva" };
  }
}

/**
 * Obtener los slots ocupados para un equipo en una fecha específica.
 * Incluye reservas existentes Y uso activo del equipo.
 * Retorna un array de { startTime, endTime, type, userName }.
 */
export async function getEquipmentBusySlots(
  equipmentId: string,
  date: string
): Promise<{ startTime: string; endTime: string; type: "reservation" | "in-use"; userName: string }[]> {
  try {
    const payload = await getPayload({ config });
    const busy: { startTime: string; endTime: string; type: "reservation" | "in-use"; userName: string }[] = [];

    // 1. Reservas activas/pendientes para este equipo en esta fecha
    const { docs: reservations } = await payload.find({
      collection: "equipment-reservations",
      where: {
        and: [
          { equipmentId: { equals: equipmentId } },
          { date: { equals: date } },
          { status: { in: ["pending", "active"] } },
        ],
      },
      limit: 100,
      depth: 1,
      overrideAccess: true,
    });

    for (const res of reservations) {
      busy.push({
        startTime: (res as any).startTime || "",
        endTime: (res as any).endTime || "",
        type: "reservation",
        userName: (res as any).userName || "Usuario",
      });
    }

    // 2. Si la fecha es hoy, verificar si el equipo está actualmente en uso
    const today = new Date().toISOString().slice(0, 10);
    if (date === today) {
      const { docs: activeUsages } = await payload.find({
        collection: "equipment-usage",
        where: {
          and: [
            { equipmentId: { equals: equipmentId } },
            { status: { equals: "active" } },
          ],
        },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      });

      if (activeUsages.length > 0) {
        const usage = activeUsages[0] as any;
        const startTime = usage.startTime ? new Date(usage.startTime).toTimeString().slice(0, 5) : "00:00";
        const endTimeStr = usage.estimatedDuration
          ? new Date(new Date(usage.startTime).getTime() + parseDurationToMs(usage.estimatedDuration)).toTimeString().slice(0, 5)
          : "23:59";
        busy.push({
          startTime,
          endTime: endTimeStr,
          type: "in-use",
          userName: usage.userName || "Usuario",
        });
      }
    }

    return busy;
  } catch (error) {
    console.error("[EquipmentReservations] Error obteniendo slots ocupados:", error);
    return [];
  }
}

function parseDurationToMs(duration: string): number {
  const map: Record<string, number> = {
    "30min": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "8h": 8 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "2d": 48 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
  };
  return map[duration] || 60 * 60 * 1000;
}

/**
 * Obtener los minutos disponibles hasta la próxima reserva de un equipo (hoy).
 * Retorna null si no hay reservas próximas hoy.
 */
export async function getMaxUsageMinutes(equipmentId: string): Promise<number | null> {
  try {
    const payload = await getPayload({ config });
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const nowTime = now.toTimeString().slice(0, 5);

    const { docs: reservations } = await payload.find({
      collection: "equipment-reservations",
      where: {
        and: [
          { equipmentId: { equals: equipmentId } },
          { date: { equals: todayStr } },
          { status: { in: ["pending", "active"] } },
        ],
      },
      limit: 100,
      overrideAccess: true,
    });

    // Find the earliest reservation that starts after now
    let earliestStart: string | null = null;
    for (const res of reservations) {
      const startTime = (res as any).startTime as string;
      if (startTime > nowTime) {
        if (!earliestStart || startTime < earliestStart) {
          earliestStart = startTime;
        }
      }
    }

    if (!earliestStart) return null;

    // Calculate minutes from now to that reservation
    const [nowH, nowM] = nowTime.split(":").map(Number);
    const [resH, resM] = earliestStart.split(":").map(Number);
    const diffMinutes = (resH * 60 + resM) - (nowH * 60 + nowM);
    return diffMinutes > 0 ? diffMinutes : null;
  } catch (error) {
    console.error("[EquipmentReservations] Error obteniendo máximo de uso:", error);
    return null;
  }
}
