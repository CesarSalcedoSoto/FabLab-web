import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * POST /api/events/register
 * Public endpoint for event registration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, fullName, lastName, email, phone, institution, rut, customFields, signature } = body;

    if (!eventId || !fullName || !email) {
      return NextResponse.json({ success: false, error: "Nombre y correo son obligatorios" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    // Check if already registered
    const existing = await payload.find({
      collection: "event-registrations",
      where: {
        and: [
          { event: { equals: eventId } },
          { email: { equals: email } },
          { status: { not_equals: "cancelled" } },
        ],
      },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      return NextResponse.json({ success: false, error: "Ya estás inscrito en este evento" }, { status: 409 });
    }

    // Check event exists and capacity
    const event = await payload.findByID({ collection: "events", id: eventId });
    if (!event) {
      return NextResponse.json({ success: false, error: "Evento no encontrado" }, { status: 404 });
    }

    if (event.capacity && event.capacity > 0) {
      const { totalDocs: enrolled } = await payload.find({
        collection: "event-registrations",
        where: {
          and: [
            { event: { equals: eventId } },
            { status: { not_equals: "cancelled" } },
          ],
        },
        limit: 0,
      });

      if (enrolled >= event.capacity) {
        return NextResponse.json({ success: false, error: "El evento está lleno. No hay cupos disponibles." }, { status: 409 });
      }
    }

    // Create registration — event relationship needs numeric ID for PostgreSQL
    const numericEventId = typeof eventId === "string" ? parseInt(eventId, 10) : eventId;
    const result = await payload.create({
      collection: "event-registrations",
      data: {
        event: numericEventId,
        fullName,
        lastName: lastName || "",
        email,
        phone: phone || "",
        institution: institution || "",
        rut: rut || "",
        customFields: customFields || {},
        signature: signature || "",
        status: "confirmed",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    return NextResponse.json({ success: true, id: result.id });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[API /events/register] Error:", error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
