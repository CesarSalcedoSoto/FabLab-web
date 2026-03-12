"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from "payload";
import config from "@payload-config";

// ============================================================
// TIPOS (re-exportados para el widget)
// ============================================================

export type CalendarEventType = "equipment" | "room" | "meeting" | "event";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  icon?: string;
  userName?: string;
  status?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// OBTENER EVENTOS DEL CALENDARIO — VERSIÓN PÚBLICA
// ============================================================

export async function getPublicCalendarEvents(month: number, year: number): Promise<CalendarEvent[]> {
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
        status: d.status,
        description: d.description,
        metadata: { estimatedDuration: d.estimatedDuration, equipmentId: d.equipmentId },
      });
    }
  } catch (e) {
    console.error("[Panel Calendario] Error cargando equipment-usage:", e);
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
        status: "confirmed",
        description: d.purpose,
        metadata: { companions: d.companions, roomId: roomObj?.id },
      });
    }
  } catch (e) {
    console.error("[Panel Calendario] Error cargando room-reservations:", e);
  }

  // 3. Meetings (públicos)
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
        metadata: { projectId: projectObj?.id },
      });
    }
  } catch (e) {
    console.error("[Panel Calendario] Error cargando meetings:", e);
  }

  // 4. Events (públicos)
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
    console.error("[Panel Calendario] Error cargando events:", e);
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
    console.error("[Panel Calendario] Error cargando equipment-reservations:", e);
  }

  return events;
}
