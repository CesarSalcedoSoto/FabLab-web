"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from "payload";
import config from "@payload-config";
import { cookies } from "next/headers";

// ============================================================
// TIPOS
// ============================================================

export type CalendarEventType = "equipment" | "room" | "meeting" | "event";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  date: string;           // YYYY-MM-DD
  startTime?: string;     // HH:MM
  endTime?: string;       // HH:MM
  color: string;
  icon?: string;          // Equipment category for icon mapping
  userName?: string;
  userAvatar?: string;
  status?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface EquipmentDetail {
  id: string;
  equipmentName: string;
  equipmentCategory?: string;
  userName: string;
  userAvatar?: string;
  startTime: string;
  endTime?: string;
  estimatedDuration: string;
  description?: string;
  status: string;
}

export interface MeetingFormData {
  projectId: string;
  date: string;
  time: string;
  description: string;
}

// ============================================================
// OBTENER EVENTOS DEL CALENDARIO
// ============================================================

export async function getCalendarEvents(month: number, year: number): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const payload = await getPayload({ config });

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  const startYMD = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endYMD = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  // 1. Equipment Usage
  try {
    const { docs } = await payload.find({
      collection: "equipment-usage",
      where: {
        startTime: { greater_than_equal: startISO, less_than_equal: endISO },
      },
      limit: 200,
      depth: 1,
      sort: "startTime",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const dt = new Date(d.startTime);
      const dateStr = dt.toISOString().slice(0, 10);
      // Resolve equipment category
      let eqCategory = "other";
      if (d.equipmentId) {
        try {
          const { docs: eqDocs } = await payload.find({
            collection: "equipment",
            where: { id: { equals: d.equipmentId } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          });
          if (eqDocs[0]) eqCategory = (eqDocs[0] as any).category || "other";
        } catch { /* ignore */ }
      }
      const userObj = typeof d.user === "object" ? d.user : null;
      events.push({
        id: `eq-${d.id}`,
        type: "equipment",
        title: d.equipmentName || "Equipo",
        subtitle: d.userName || userObj?.name || "Usuario",
        date: dateStr,
        startTime: dt.toTimeString().slice(0, 5),
        endTime: d.endTime ? new Date(d.endTime).toTimeString().slice(0, 5) : undefined,
        color: "purple",
        icon: eqCategory,
        userName: d.userName || userObj?.name,
        userAvatar: userObj?.avatar?.url,
        status: d.status,
        description: d.description,
        metadata: { estimatedDuration: d.estimatedDuration, equipmentId: d.equipmentId },
      });
    }
  } catch (e) {
    console.error("[Calendario] Error cargando equipment-usage:", e);
  }

  // 2. Room Reservations
  try {
    const { docs } = await payload.find({
      collection: "room-reservations",
      where: {
        date: { greater_than_equal: startYMD, less_than_equal: endYMD },
      },
      limit: 200,
      depth: 1,
      sort: "date",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const roomObj = typeof d.room === "object" ? d.room : null;
      const userObj = typeof d.user === "object" ? d.user : null;
      events.push({
        id: `room-${d.id}`,
        type: "room",
        title: d.roomName || roomObj?.name || "Sala",
        subtitle: d.purpose || "Reserva",
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        color: "teal",
        userName: d.userName || userObj?.name,
        userAvatar: userObj?.avatar?.url,
        status: "confirmed",
        description: d.purpose,
        metadata: { companions: d.companions, roomId: roomObj?.id },
      });
    }
  } catch (e) {
    console.error("[Calendario] Error cargando room-reservations:", e);
  }

  // 3. Meetings
  try {
    const { docs } = await payload.find({
      collection: "meetings",
      where: {
        date: { greater_than_equal: startISO, less_than_equal: endISO },
      },
      limit: 200,
      depth: 1,
      sort: "date",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const dt = new Date(d.date);
      const dateStr = dt.toISOString().slice(0, 10);
      const projectObj = typeof d.project === "object" ? d.project : null;
      events.push({
        id: `meet-${d.id}`,
        type: "meeting",
        title: projectObj?.title ? `Reunión: ${projectObj.title}` : "Reunión",
        subtitle: d.description,
        date: dateStr,
        startTime: d.time,
        color: "blue",
        status: d.status,
        description: d.description,
        metadata: { projectId: projectObj?.id, notes: d.notes },
      });
    }
  } catch (e) {
    console.error("[Calendario] Error cargando meetings:", e);
  }

  // 4. Events
  try {
    const { docs } = await payload.find({
      collection: "events",
      where: {
        startDate: { greater_than_equal: startISO, less_than_equal: endISO },
        status: { not_equals: "draft" },
      },
      limit: 200,
      depth: 0,
      sort: "startDate",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const dt = new Date(d.startDate);
      const dateStr = dt.toISOString().slice(0, 10);
      events.push({
        id: `evt-${d.id}`,
        type: "event",
        title: d.title,
        subtitle: d.type,
        date: dateStr,
        startTime: dt.toTimeString().slice(0, 5),
        endTime: d.endDate ? new Date(d.endDate).toTimeString().slice(0, 5) : undefined,
        color: d.calendarColor || "orange",
        status: d.status,
        description: d.excerpt,
        metadata: { location: d.location, isOnline: d.isOnline, capacity: d.capacity },
      });
    }
  } catch (e) {
    console.error("[Calendario] Error cargando events:", e);
  }

  // 5. Equipment Reservations
  try {
    const { docs } = await payload.find({
      collection: "equipment-reservations",
      where: {
        date: { greater_than_equal: startYMD, less_than_equal: endYMD },
        status: { not_equals: "cancelled" },
      },
      limit: 200,
      depth: 1,
      sort: "date",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const userObj = typeof d.user_id === "object" ? d.user_id : null;
      events.push({
        id: `eqres-${d.id}`,
        type: "equipment",
        title: `Reserva: ${d.equipmentName || "Equipo"}`,
        subtitle: d.userName || userObj?.name || "Reserva",
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        color: "purple",
        status: d.status,
        description: d.description,
        metadata: { equipmentId: d.equipmentId, isReservation: true },
      });
    }
  } catch (e) {
    console.error("[Calendario] Error cargando equipment-reservations:", e);
  }

  return events;
}

// ============================================================
// OBTENER EVENTOS DEL CALENDARIO (VISTA VIEWER)
// Muestra: reuniones solo de proyectos del usuario, reservas de equipos,
// usos de equipos, reservas de salas, y eventos públicos
// ============================================================

async function getCurrentCalendarUser() {
  try {
    const payload = await getPayload({ config });
    const cookieStore = await cookies();
    const token = cookieStore.get("payload-token")?.value || cookieStore.get("fablab_token")?.value;
    if (!token) return null;
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) });
    return (user as any) || null;
  } catch {
    return null;
  }
}

export async function getViewerCalendarEvents(month: number, year: number): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const payload = await getPayload({ config });
  const user = await getCurrentCalendarUser();
  if (!user) return events;

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  const startYMD = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endYMD = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  // 1. Get user's projects (where user is responsible or creator)
  let userProjectIds: string[] = [];
  try {
    const { docs: allProjects } = await payload.find({
      collection: "projects",
      limit: 200,
      depth: 2,
      overrideAccess: true,
    });

    const myProjects = allProjects.filter((doc: any) => {
      const responsible = Array.isArray(doc.responsibleStaff) ? doc.responsibleStaff : [];
      const isResponsible = responsible.some((s: any) => {
        const staffId = typeof s === "object" ? String(s.id) : String(s);
        return staffId === String(user.id);
      });
      const creators = Array.isArray(doc.creators) ? doc.creators : [];
      const isCreator = creators.some((c: any) => {
        const memberId = typeof c.teamMember === "object" ? String(c.teamMember?.id) : String(c.teamMember);
        return memberId === String(user.id);
      });
      return isResponsible || isCreator;
    });

    userProjectIds = myProjects.map((p: any) => String(p.id));
  } catch (e) {
    console.error("[Calendario Viewer] Error obteniendo proyectos:", e);
  }

  // 2. Meetings (only from user's projects)
  if (userProjectIds.length > 0) {
    try {
      const { docs } = await payload.find({
        collection: "meetings",
        where: {
          date: { greater_than_equal: startISO, less_than_equal: endISO },
          project: { in: userProjectIds.map(id => parseInt(id, 10)) },
        },
        limit: 200,
        depth: 1,
        sort: "date",
        overrideAccess: true,
      });
      for (const doc of docs) {
        const d = doc as any;
        const dt = new Date(d.date);
        const dateStr = dt.toISOString().slice(0, 10);
        const projectObj = typeof d.project === "object" ? d.project : null;
        events.push({
          id: `meet-${d.id}`,
          type: "meeting",
          title: projectObj?.title ? `Reunión: ${projectObj.title}` : "Reunión",
          subtitle: d.description,
          date: dateStr,
          startTime: d.time,
          color: "blue",
          status: d.status,
          description: d.description,
          metadata: { projectId: projectObj?.id, notes: d.notes },
        });
      }
    } catch (e) {
      console.error("[Calendario Viewer] Error cargando meetings:", e);
    }
  }

  // 3. Equipment Usage (all - public info)
  try {
    const { docs } = await payload.find({
      collection: "equipment-usage",
      where: {
        startTime: { greater_than_equal: startISO, less_than_equal: endISO },
      },
      limit: 200,
      depth: 1,
      sort: "startTime",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const dt = new Date(d.startTime);
      const dateStr = dt.toISOString().slice(0, 10);
      let eqCategory = "other";
      if (d.equipmentId) {
        try {
          const { docs: eqDocs } = await payload.find({
            collection: "equipment",
            where: { id: { equals: d.equipmentId } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          });
          if (eqDocs[0]) eqCategory = (eqDocs[0] as any).category || "other";
        } catch { /* ignore */ }
      }
      const userObj = typeof d.user === "object" ? d.user : null;
      events.push({
        id: `eq-${d.id}`,
        type: "equipment",
        title: d.equipmentName || "Equipo",
        subtitle: d.userName || userObj?.name || "Usuario",
        date: dateStr,
        startTime: dt.toTimeString().slice(0, 5),
        endTime: d.endTime ? new Date(d.endTime).toTimeString().slice(0, 5) : undefined,
        color: "purple",
        icon: eqCategory,
        userName: d.userName || userObj?.name,
        userAvatar: userObj?.avatar?.url,
        status: d.status,
        description: d.description,
        metadata: { estimatedDuration: d.estimatedDuration, equipmentId: d.equipmentId },
      });
    }
  } catch (e) {
    console.error("[Calendario Viewer] Error cargando equipment-usage:", e);
  }

  // 4. Equipment Reservations (all - public info)
  try {
    const { docs } = await payload.find({
      collection: "equipment-reservations",
      where: {
        date: { greater_than_equal: startYMD, less_than_equal: endYMD },
        status: { not_equals: "cancelled" },
      },
      limit: 200,
      depth: 1,
      sort: "date",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const userObj = typeof d.user_id === "object" ? d.user_id : null;
      const isOwn = String(d.user_id?.id || d.user_id) === String(user.id);
      events.push({
        id: `eqres-${d.id}`,
        type: "equipment",
        title: d.equipmentName || "Reserva Equipo",
        subtitle: isOwn ? "Tu reserva" : (d.userName || userObj?.name || "Reserva"),
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        color: "purple",
        status: d.status,
        description: d.description,
        metadata: { equipmentId: d.equipmentId, isReservation: true },
      });
    }
  } catch (e) {
    console.error("[Calendario Viewer] Error cargando equipment-reservations:", e);
  }

  // 5. Room Reservations (all - public info)
  try {
    const { docs } = await payload.find({
      collection: "room-reservations",
      where: {
        date: { greater_than_equal: startYMD, less_than_equal: endYMD },
      },
      limit: 200,
      depth: 1,
      sort: "date",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const roomObj = typeof d.room === "object" ? d.room : null;
      const userObj = typeof d.user === "object" ? d.user : null;
      events.push({
        id: `room-${d.id}`,
        type: "room",
        title: d.roomName || roomObj?.name || "Sala",
        subtitle: d.purpose || "Reserva",
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        color: "teal",
        userName: d.userName || userObj?.name,
        userAvatar: userObj?.avatar?.url,
        status: "confirmed",
        description: d.purpose,
        metadata: { companions: d.companions, roomId: roomObj?.id },
      });
    }
  } catch (e) {
    console.error("[Calendario Viewer] Error cargando room-reservations:", e);
  }

  // 6. Events (all public events)
  try {
    const { docs } = await payload.find({
      collection: "events",
      where: {
        startDate: { greater_than_equal: startISO, less_than_equal: endISO },
        status: { not_equals: "draft" },
      },
      limit: 200,
      depth: 0,
      sort: "startDate",
      overrideAccess: true,
    });
    for (const doc of docs) {
      const d = doc as any;
      const dt = new Date(d.startDate);
      const dateStr = dt.toISOString().slice(0, 10);
      events.push({
        id: `evt-${d.id}`,
        type: "event",
        title: d.title,
        subtitle: d.type,
        date: dateStr,
        startTime: dt.toTimeString().slice(0, 5),
        endTime: d.endDate ? new Date(d.endDate).toTimeString().slice(0, 5) : undefined,
        color: d.calendarColor || "orange",
        status: d.status,
        description: d.excerpt,
        metadata: { location: d.location, isOnline: d.isOnline, capacity: d.capacity },
      });
    }
  } catch (e) {
    console.error("[Calendario Viewer] Error cargando events:", e);
  }

  return events;
}

// ============================================================
// DETALLE DE USO DE EQUIPO
// ============================================================

export async function getEquipmentUsageDetail(usageId: string): Promise<EquipmentDetail | null> {
  try {
    const payload = await getPayload({ config });
    const numId = parseInt(usageId.replace("eq-", ""), 10);
    const doc = await payload.findByID({
      collection: "equipment-usage",
      id: numId,
      depth: 2,
      overrideAccess: true,
    });
    const d = doc as any;
    const userObj = typeof d.user === "object" ? d.user : null;

    // Get equipment category
    let eqCategory = "other";
    if (d.equipmentId) {
      try {
        const { docs: eqDocs } = await payload.find({
          collection: "equipment",
          where: { id: { equals: d.equipmentId } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        if (eqDocs[0]) eqCategory = (eqDocs[0] as any).category || "other";
      } catch { /* ignore */ }
    }

    return {
      id: String(d.id),
      equipmentName: d.equipmentName,
      equipmentCategory: eqCategory,
      userName: d.userName || userObj?.name || "Usuario",
      userAvatar: userObj?.avatar?.url,
      startTime: d.startTime,
      endTime: d.endTime,
      estimatedDuration: d.estimatedDuration,
      description: d.description,
      status: d.status,
    };
  } catch (e) {
    console.error("[Calendario] Error obteniendo detalle de equipo:", e);
    return null;
  }
}

// ============================================================
// PROYECTOS (para agendar reuniones)
// ============================================================

export async function getProjectsForMeeting(): Promise<{ id: string; title: string }[]> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "projects",
      limit: 100,
      depth: 0,
      sort: "title",
      overrideAccess: true,
    });
    return docs.map((d: any) => ({ id: String(d.id), title: d.title }));
  } catch (e) {
    console.error("[Calendario] Error cargando proyectos para reunión:", e);
    return [];
  }
}

// ============================================================
// CREAR REUNIÓN
// ============================================================

export async function createMeeting(data: MeetingFormData) {
  try {
    const payload = await getPayload({ config });
    await payload.create({
      collection: "meetings",
      data: {
        project: parseInt(data.projectId, 10),
        date: new Date(data.date).toISOString(),
        time: data.time,
        description: data.description,
        status: "programada",
      } as any,
      overrideAccess: true,
    });
    return { success: true };
  } catch (e: any) {
    console.error("[Calendario] Error creando reunión:", e);
    return { success: false, error: e.message };
  }
}
