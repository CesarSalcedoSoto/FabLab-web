"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export interface ResourceItem {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  type: string;
  file?: { url?: string; filename?: string; mimeType?: string; filesize?: number } | null;
  externalUrl?: string;
  thumbnail?: { url?: string } | null;
  folder?: string;
  visibility: string;
  downloads: number;
  status: string;
  tags?: { tag: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export async function getPublishedResources(userRole?: string): Promise<ResourceItem[]> {
  try {
    const payload = await getPayload({ config });

    // Filtrar por visibilidad según rol
    let visibilityFilter: any;
    if (userRole === 'admin') {
      visibilityFilter = { status: { equals: 'published' } };
    } else if (userRole) {
      visibilityFilter = {
        and: [
          { status: { equals: 'published' } },
          { visibility: { in: ['public', 'authenticated'] } },
        ]
      };
    } else {
      visibilityFilter = {
        and: [
          { status: { equals: 'published' } },
          { visibility: { equals: 'public' } },
        ]
      };
    }

    const { docs } = await payload.find({
      collection: "resources",
      where: visibilityFilter,
      sort: "-createdAt",
      limit: 200,
      depth: 1,
    });

    return docs.map((doc: any) => ({
      id: String(doc.id),
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      type: doc.type,
      file: doc.file ? {
        url: doc.file.url,
        filename: doc.file.filename,
        mimeType: doc.file.mimeType,
        filesize: doc.file.filesize,
      } : null,
      externalUrl: doc.externalUrl,
      thumbnail: doc.thumbnail ? { url: doc.thumbnail.url } : null,
      folder: doc.folder,
      visibility: doc.visibility,
      downloads: doc.downloads || 0,
      status: doc.status,
      tags: doc.tags,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  } catch (error) {
    console.error("[getPublishedResources] Error:", error);
    return [];
  }
}

export async function getAllResources(): Promise<{ resources: ResourceItem[]; total: number }> {
  try {
    const payload = await getPayload({ config });
    const { docs, totalDocs } = await payload.find({
      collection: "resources",
      sort: "-createdAt",
      limit: 200,
      depth: 1,
    });
    return {
      resources: docs.map((doc: any) => ({
        id: String(doc.id),
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        type: doc.type,
        file: doc.file ? {
          url: doc.file.url,
          filename: doc.file.filename,
          mimeType: doc.file.mimeType,
          filesize: doc.file.filesize,
        } : null,
        externalUrl: doc.externalUrl,
        thumbnail: doc.thumbnail ? { url: doc.thumbnail.url } : null,
        folder: doc.folder,
        visibility: doc.visibility,
        downloads: doc.downloads || 0,
        status: doc.status,
        tags: doc.tags,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
      total: totalDocs,
    };
  } catch (error) {
    console.error("[getAllResources] Error:", error);
    return { resources: [], total: 0 };
  }
}

export async function createResource(data: Partial<ResourceItem>) {
  try {
    const payload = await getPayload({ config });
    const result = await payload.create({
      collection: "resources",
      data: data as any,
    });
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("[createResource] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateResource(id: string, data: Partial<ResourceItem>) {
  try {
    const payload = await getPayload({ config });
    await payload.update({
      collection: "resources",
      id,
      data: data as any,
    });
    return { success: true };
  } catch (error: any) {
    console.error("[updateResource] Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteResource(id: string) {
  try {
    const payload = await getPayload({ config });
    await payload.delete({ collection: "resources", id });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteResource] Error:", error);
    return { success: false, error: error.message };
  }
}
