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
}

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
    return docs.map((doc: any) => ({
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
    }));
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
    return {
      events: docs.map((doc: any) => ({
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
      })),
      total: totalDocs,
    };
  } catch (error) {
    console.error("[getAllEvents] Error:", error);
    return { events: [], total: 0 };
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
