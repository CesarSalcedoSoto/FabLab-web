"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image?: { id?: number; url?: string; alt?: string; width?: number; height?: number } | null;
  album?: string;
  date?: string;
  featured?: boolean;
  status: string;
  tags?: { tag: string }[];
  createdAt?: string;
}

export async function getPublishedGallery(): Promise<GalleryItem[]> {
  try {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "gallery",
      where: { status: { equals: "published" } },
      sort: "-date",
      limit: 200,
      depth: 1,
    });
    return docs.map((doc: any) => ({
      id: String(doc.id),
      title: doc.title,
      description: doc.description,
      image: doc.image ? {
        id: doc.image.id,
        url: doc.image.url,
        alt: doc.image.alt,
        width: doc.image.width,
        height: doc.image.height,
      } : null,
      album: doc.album,
      date: doc.date,
      featured: doc.featured,
      status: doc.status,
      tags: doc.tags,
      createdAt: doc.createdAt,
    }));
  } catch (error) {
    console.error("[getPublishedGallery] Error:", error);
    return [];
  }
}

export async function getAllGallery(): Promise<{ items: GalleryItem[]; total: number }> {
  try {
    const payload = await getPayload({ config });
    const { docs, totalDocs } = await payload.find({
      collection: "gallery",
      sort: "-createdAt",
      limit: 200,
      depth: 1,
    });
    return {
      items: docs.map((doc: any) => ({
        id: String(doc.id),
        title: doc.title,
        description: doc.description,
        image: doc.image ? {
          id: doc.image.id,
          url: doc.image.url,
          alt: doc.image.alt,
          width: doc.image.width,
          height: doc.image.height,
        } : null,
        album: doc.album,
        date: doc.date,
        featured: doc.featured,
        status: doc.status,
        tags: doc.tags,
        createdAt: doc.createdAt,
      })),
      total: totalDocs,
    };
  } catch (error) {
    console.error("[getAllGallery] Error:", error);
    return { items: [], total: 0 };
  }
}

export async function createGalleryItem(data: Partial<GalleryItem>) {
  try {
    const payload = await getPayload({ config });
    const result = await payload.create({
      collection: "gallery",
      data: data as any,
    });
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("[createGalleryItem] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateGalleryItem(id: string, data: Partial<GalleryItem>) {
  try {
    const payload = await getPayload({ config });
    await payload.update({
      collection: "gallery",
      id,
      data: data as any,
    });
    return { success: true };
  } catch (error: any) {
    console.error("[updateGalleryItem] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteGalleryItem(id: string) {
  try {
    const payload = await getPayload({ config });
    await payload.delete({ collection: "gallery", id });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteGalleryItem] Error:", error);
    return { success: false, error: error.message };
  }
}
