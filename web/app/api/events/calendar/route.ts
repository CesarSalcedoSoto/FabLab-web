import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * GET /api/events/calendar
 * Returns published events with registration counts for the public calendar.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config });

    const { docs } = await payload.find({
      collection: "events",
      where: { status: { equals: "published" } },
      sort: "-startDate",
      limit: 200,
      depth: 1,
    });

    // Get registration counts for all events in bulk
    const eventIds = docs.map(d => String(d.id));
    const regCounts = new Map<string, number>();

    if (eventIds.length > 0) {
      // Count registrations for each event
      for (const eventId of eventIds) {
        const { totalDocs } = await payload.find({
          collection: "event-registrations",
          where: {
            and: [
              { event: { equals: eventId } },
              { status: { not_equals: "cancelled" } },
            ],
          },
          limit: 0,
        });
        regCounts.set(eventId, totalDocs);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = docs.map((doc: any) => ({
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
      registrationCount: regCounts.get(String(doc.id)) || 0,
    }));

    return NextResponse.json({ events });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[API /events/calendar] Error:", error);
    return NextResponse.json({ events: [], error: error?.message }, { status: 500 });
  }
}
