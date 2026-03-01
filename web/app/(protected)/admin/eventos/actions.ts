"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  featuredImage?: { url?: string; alt?: string } | null;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  capacity?: number;
  registrationUrl?: string;
  price?: string;
  status: string;
  featured?: boolean;
  tags?: { tag: string }[];
  calendarColor?: string;
  enableDirectRegistration?: boolean;
  requireSignature?: boolean;
  registrationFields?: RegistrationFieldDef[];
}

export interface RegistrationFieldDef {
  fieldName: string;
  fieldType: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'signature';
  required?: boolean;
  options?: string;
  id?: string;
}

export interface RegistrationItem {
  id: string;
  event: string | { id: string; title: string };
  fullName: string;
  lastName?: string;
  email: string;
  phone?: string;
  institution?: string;
  rut?: string;
  customFields?: Record<string, any>;
  signature?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceItem {
  id: string;
  event: string;
  registration: string | RegistrationItem;
  attended: boolean;
  checkInTime?: string;
  notes?: string;
}

/** PostgreSQL usa IDs numéricos — convertir strings a number */
function toNumericId(id: string | number): number {
  return typeof id === 'string' ? parseInt(id, 10) : id;
}

function mapEventDoc(doc: any): EventItem {
  return {
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    type: doc.type,
    description: doc.description,
    featuredImage: doc.featuredImage ? { url: doc.featuredImage.url, alt: doc.featuredImage.alt } : null,
    startDate: doc.startDate,
    endDate: doc.endDate,
    location: doc.location,
    isOnline: doc.isOnline,
    capacity: doc.capacity,
    registrationUrl: doc.registrationUrl,
    price: doc.price,
    status: doc.status,
    featured: doc.featured,
    tags: doc.tags,
    calendarColor: doc.calendarColor,
    enableDirectRegistration: doc.enableDirectRegistration,
    requireSignature: doc.requireSignature,
    registrationFields: doc.registrationFields,
  };
}

// ============================================================================
// EVENTS CRUD
// ============================================================================

export async function getPublishedEvents(): Promise<EventItem[]> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "events",
      where: { status: { equals: "published" } },
      sort: "-startDate",
      limit: 100,
      depth: 1,
    });
    return docs.map(mapEventDoc);
  } catch (error) {
    console.error("[getPublishedEvents] Error:", error);
    return [];
  }
}

export async function getAllEvents(): Promise<{ events: EventItem[]; total: number }> {
  try {
    const payload = await getPayload({ config });
    const { docs, totalDocs } = await payload.find({
      collection: "events",
      sort: "-startDate",
      limit: 200,
      depth: 1,
    });
    return { events: docs.map(mapEventDoc), total: totalDocs };
  } catch (error) {
    console.error("[getAllEvents] Error:", error);
    return { events: [], total: 0 };
  }
}

export async function getEventById(id: string): Promise<EventItem | null> {
  try {
    const payload = await getPayload({ config });
    const doc = await payload.findByID({ collection: "events", id, depth: 1 });
    return mapEventDoc(doc);
  } catch (error) {
    console.error("[getEventById] Error:", error);
    return null;
  }
}

export async function createEvent(data: Partial<EventItem>) {
  try {
    const payload = await getPayload({ config });
    const result = await payload.create({
      collection: "events",
      data: data as any,
    });
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("[createEvent] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateEvent(id: string, data: Partial<EventItem>) {
  try {
    const payload = await getPayload({ config });
    await payload.update({
      collection: "events",
      id,
      data: data as any,
    });
    return { success: true };
  } catch (error: any) {
    console.error("[updateEvent] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteEvent(id: string) {
  try {
    const payload = await getPayload({ config });
    await payload.delete({ collection: "events", id });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteEvent] Error:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REGISTRATIONS
// ============================================================================

export async function getEventRegistrations(eventId: string): Promise<{ registrations: RegistrationItem[]; total: number }> {
  try {
    const payload = await getPayload({ config });
    const { docs, totalDocs } = await payload.find({
      collection: "event-registrations",
      where: { event: { equals: eventId } },
      sort: "-createdAt",
      limit: 500,
      depth: 1,
    });
    return {
      registrations: docs.map((doc: any) => ({
        id: String(doc.id),
        event: doc.event?.id ? { id: String(doc.event.id), title: doc.event.title } : String(doc.event),
        fullName: doc.fullName,
        lastName: doc.lastName,
        email: doc.email,
        phone: doc.phone,
        institution: doc.institution,
        rut: doc.rut,
        customFields: doc.customFields,
        signature: doc.signature,
        status: doc.status,
        notes: doc.notes,
        createdAt: doc.createdAt,
      })),
      total: totalDocs,
    };
  } catch (error) {
    console.error("[getEventRegistrations] Error:", error);
    return { registrations: [], total: 0 };
  }
}

export async function registerToEvent(data: {
  eventId: string;
  fullName: string;
  lastName?: string;
  email: string;
  phone?: string;
  institution?: string;
  rut?: string;
  customFields?: Record<string, any>;
  signature?: string;
}) {
  try {
    const payload = await getPayload({ config });

    // Check if already registered
    const existing = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { event: { equals: data.eventId } },
          { email: { equals: data.email } },
          { status: { not_equals: 'cancelled' } },
        ],
      },
      limit: 1,
    });
    if (existing.totalDocs > 0) {
      return { success: false, error: "Ya estás inscrito en este evento" };
    }

    // Check capacity
    const event = await payload.findByID({ collection: "events", id: data.eventId });
    if (event.capacity && event.capacity > 0) {
      const { totalDocs: enrolled } = await payload.find({
        collection: "event-registrations",
        where: {
          and: [
            { event: { equals: data.eventId } },
            { status: { not_equals: 'cancelled' } },
          ],
        },
        limit: 0,
      });
      if (enrolled >= event.capacity) {
        return { success: false, error: "El evento está lleno", waitlist: true };
      }
    }

    const result = await payload.create({
      collection: "event-registrations",
      data: {
        event: toNumericId(data.eventId),
        fullName: data.fullName,
        lastName: data.lastName || "",
        email: data.email,
        phone: data.phone || "",
        institution: data.institution || "",
        rut: data.rut || "",
        customFields: data.customFields || {},
        signature: data.signature || "",
        status: "confirmed",
      } as any,
    });
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("[registerToEvent] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateRegistration(id: string, data: Partial<RegistrationItem>) {
  try {
    const payload = await getPayload({ config });
    await payload.update({
      collection: "event-registrations",
      id,
      data: data as any,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRegistration(id: string) {
  try {
    const payload = await getPayload({ config });
    await payload.delete({ collection: "event-registrations", id });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRegistrationCount(eventId: string): Promise<number> {
  try {
    const payload = await getPayload({ config });
    const { totalDocs } = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { event: { equals: eventId } },
          { status: { not_equals: 'cancelled' } },
        ],
      },
      limit: 0,
    });
    return totalDocs;
  } catch {
    return 0;
  }
}

// ============================================================================
// ATTENDANCE
// ============================================================================

export async function getEventAttendance(eventId: string): Promise<AttendanceItem[]> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "event-attendance",
      where: { event: { equals: eventId } },
      limit: 500,
      depth: 2,
    });
    return docs.map((doc: any) => ({
      id: String(doc.id),
      event: String(doc.event?.id || doc.event),
      registration: doc.registration?.id ? {
        id: String(doc.registration.id),
        event: String(doc.registration.event),
        fullName: doc.registration.fullName,
        lastName: doc.registration.lastName,
        email: doc.registration.email,
        phone: doc.registration.phone,
        institution: doc.registration.institution,
        rut: doc.registration.rut,
        customFields: doc.registration.customFields,
        signature: doc.registration.signature,
        status: doc.registration.status,
        notes: doc.registration.notes,
        createdAt: doc.registration.createdAt,
      } : String(doc.registration),
      attended: doc.attended,
      checkInTime: doc.checkInTime,
      notes: doc.notes,
    }));
  } catch (error) {
    console.error("[getEventAttendance] Error:", error);
    return [];
  }
}

export async function initializeAttendance(eventId: string) {
  try {
    const payload = await getPayload({ config });
    
    // Get all confirmed registrations
    const { docs: registrations } = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { event: { equals: eventId } },
          { status: { equals: 'confirmed' } },
        ],
      },
      limit: 500,
    });

    // Get existing attendance records
    const { docs: existingAttendance } = await payload.find({
      collection: "event-attendance",
      where: { event: { equals: eventId } },
      limit: 500,
    });

    const existingRegIds = new Set(existingAttendance.map((a: any) => 
      String(a.registration?.id || a.registration)
    ));

    // Create attendance records for new registrations
    let created = 0;
    for (const reg of registrations) {
      if (!existingRegIds.has(String(reg.id))) {
        await payload.create({
          collection: "event-attendance",
          data: {
            event: toNumericId(eventId),
            registration: toNumericId(reg.id),
            attended: false,
          } as any,
        });
        created++;
      }
    }

    return { success: true, created, total: registrations.length };
  } catch (error: any) {
    console.error("[initializeAttendance] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleAttendance(attendanceId: string, attended: boolean) {
  try {
    const payload = await getPayload({ config });
    await payload.update({
      collection: "event-attendance",
      id: attendanceId,
      data: {
        attended,
        checkInTime: attended ? new Date().toISOString() : null,
      } as any,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EXPORT (CSV for Excel compatibility)
// ============================================================================

export async function exportEventData(eventId: string): Promise<{ csv: string; filename: string }> {
  try {
    const payload = await getPayload({ config });
    
    const event = await payload.findByID({ collection: "events", id: eventId });
    const { docs: registrations } = await payload.find({
      collection: "event-registrations",
      where: { event: { equals: eventId } },
      sort: "createdAt",
      limit: 1000,
      depth: 0,
    });

    const { docs: attendanceRecords } = await payload.find({
      collection: "event-attendance",
      where: { event: { equals: eventId } },
      limit: 1000,
      depth: 1,
    });

    // Build attendance lookup
    const attendanceMap = new Map<string, boolean>();
    for (const a of attendanceRecords as any[]) {
      const regId = String(a.registration?.id || a.registration);
      attendanceMap.set(regId, a.attended);
    }

    // Get custom field headers
    const customFieldNames: string[] = (event.registrationFields as any[] || []).map(
      (f: any) => f.fieldName
    );

    // CSV header
    const headers = [
      "Nombre", "Apellidos", "Email", "Teléfono", "Institución", "RUT",
      ...customFieldNames,
      "Estado Inscripción", "Firmó", "Asistió", "Fecha Inscripción"
    ];

    // CSV rows
    const rows = registrations.map((reg: any) => {
      const customValues = customFieldNames.map(name => {
        const val = reg.customFields?.[name];
        return val !== undefined && val !== null ? String(val) : "";
      });

      const attended = attendanceMap.has(String(reg.id)) 
        ? (attendanceMap.get(String(reg.id)) ? "Sí" : "No") 
        : "Sin registro";

      const signed = reg.signature ? "Sí" : "No";

      return [
        reg.fullName || "",
        reg.lastName || "",
        reg.email || "",
        reg.phone || "",
        reg.institution || "",
        reg.rut || "",
        ...customValues,
        reg.status === 'confirmed' ? 'Confirmada' : reg.status === 'cancelled' ? 'Cancelada' : reg.status === 'pending' ? 'Pendiente' : reg.status,
        signed,
        attended,
        reg.createdAt ? new Date(reg.createdAt).toLocaleDateString("es-CL") : "",
      ];
    });

    // Build CSV with BOM for Excel UTF-8
    const bom = "\uFEFF";
    const csvContent = bom + [
      headers.map(h => `"${h}"`).join(";"),
      ...rows.map(row => row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const filename = `asistencia-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;

    return { csv: csvContent, filename };
  } catch (error: any) {
    console.error("[exportEventData] Error:", error);
    return { csv: "", filename: "error.csv" };
  }
}
