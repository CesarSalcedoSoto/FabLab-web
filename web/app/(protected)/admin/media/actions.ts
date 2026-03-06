"use server";

import { getPayload, type BasePayload } from "payload";
import config from "@payload-config";

export interface MediaItem {
    id: number;
    filename: string;
    mimeType: string;
    filesize: number;
    width?: number;
    height?: number;
    alt?: string;
    url: string;
    thumbnailURL?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MediaFilters {
    search?: string;
    type?: "all" | "images" | "documents" | "other";
    sortBy?: "newest" | "oldest" | "name" | "size";
    page?: number;
    limit?: number;
}

export interface MediaResponse {
    items: MediaItem[];
    totalDocs: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export async function getMediaFiles(filters: MediaFilters = {}): Promise<MediaResponse> {
    try {
        const payload = await getPayload({ config });
        const { search, type = "all", sortBy = "newest", page = 1, limit = 24 } = filters;

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conditions: any[] = [];

        if (search) {
            conditions.push({
                or: [
                    { filename: { contains: search } },
                    { alt: { contains: search } },
                ],
            });
        }

        if (type === "images") {
            conditions.push({ mimeType: { contains: "image" } });
        } else if (type === "documents") {
            conditions.push({
                or: [
                    { mimeType: { contains: "pdf" } },
                    { mimeType: { contains: "document" } },
                    { mimeType: { contains: "spreadsheet" } },
                    { mimeType: { contains: "text" } },
                ],
            });
        } else if (type === "other") {
            conditions.push({ mimeType: { not_contains: "image" } });
            conditions.push({ mimeType: { not_contains: "pdf" } });
            conditions.push({ mimeType: { not_contains: "document" } });
        }

        const where: any = conditions.length > 1
            ? { and: conditions }
            : conditions.length === 1
                ? conditions[0]
                : {};

        // Sort mapping
        let sort: string;
        switch (sortBy) {
            case "oldest":
                sort = "createdAt";
                break;
            case "name":
                sort = "filename";
                break;
            case "size":
                sort = "-filesize";
                break;
            default:
                sort = "-createdAt";
        }

        const result = await payload.find({
            collection: "media",
            where,
            sort,
            page,
            limit,
            overrideAccess: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: MediaItem[] = result.docs.map((doc: any) => ({
            id: doc.id,
            filename: doc.filename || "sin-nombre",
            mimeType: doc.mimeType || "application/octet-stream",
            filesize: doc.filesize || 0,
            width: doc.width || undefined,
            height: doc.height || undefined,
            alt: doc.alt || undefined,
            url: doc.url || "",
            thumbnailURL: doc.sizes?.thumbnail?.url || doc.thumbnailURL || undefined,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        }));

        return {
            items,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            page: result.page || 1,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
        };
    } catch (error: unknown) {
        console.error("[getMediaFiles] Error:", error);
        return {
            items: [],
            totalDocs: 0,
            totalPages: 0,
            page: 1,
            hasNextPage: false,
            hasPrevPage: false,
        };
    }
}

export async function deleteMediaFile(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.delete({ collection: "media", id, overrideAccess: true });
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error al eliminar archivo";
        console.error("[deleteMediaFile] Error:", error);
        return { success: false, error: msg };
    }
}

/**
 * Verifica si un archivo de media está referenciado por alguna colección.
 * Retorna el nombre de la colección que lo usa, o null si no tiene referencias.
 */
async function findMediaReference(payload: BasePayload, mediaId: number): Promise<string | null> {
    // Definimos todas las colecciones y campos que referencian media
    const checks: { collection: string; field: string; label: string }[] = [
        { collection: "users", field: "avatar", label: "usuarios" },
        { collection: "team-members", field: "image", label: "equipo" },
        { collection: "gallery", field: "image", label: "galería" },
        { collection: "resources", field: "file", label: "recursos" },
        { collection: "resources", field: "thumbnail", label: "recursos" },
        { collection: "posts", field: "featuredImage", label: "blog" },
        { collection: "projects", field: "featuredImage", label: "proyectos" },
        { collection: "equipment", field: "featuredImage", label: "equipos" },
        { collection: "inventory-items", field: "image", label: "inventario" },
        { collection: "events", field: "featuredImage", label: "eventos" },
        { collection: "services", field: "featuredImage", label: "servicios" },
        { collection: "testimonials", field: "avatar", label: "testimonios" },
    ];

    for (const check of checks) {
        try {
            const result = await payload.find({
                collection: check.collection,
                where: { [check.field]: { equals: mediaId } },
                limit: 1,
                depth: 0,
            });
            if (result.totalDocs > 0) {
                return check.label;
            }
        } catch {
            // Si la colección no existe o hay error, continuar
        }
    }
    return null;
}

export async function deleteMediaFiles(ids: number[]): Promise<{ success: boolean; deleted: number; errors: number; inUseBy?: string[] }> {
    try {
        const payload = await getPayload({ config });
        let deleted = 0;
        let errors = 0;
        const inUseLabels = new Set<string>();

        for (const id of ids) {
            try {
                // Verificar si el archivo está en uso antes de eliminar
                const usedBy = await findMediaReference(payload, id);
                if (usedBy) {
                    errors++;
                    inUseLabels.add(usedBy);
                    continue;
                }
                await payload.delete({ collection: "media", id, overrideAccess: true });
                deleted++;
            } catch {
                errors++;
            }
        }
        return { success: true, deleted, errors, inUseBy: Array.from(inUseLabels) };
    } catch (error: unknown) {
        console.error("[deleteMediaFiles] Error:", error);
        return { success: false, deleted: 0, errors: ids.length };
    }
}

export async function getMediaStats(): Promise<{
    totalFiles: number;
    totalImages: number;
    totalDocuments: number;
    totalSize: number;
}> {
    try {
        const payload = await getPayload({ config });

        const all = await payload.find({
            collection: "media",
            limit: 0,
            overrideAccess: true,
        });

        const images = await payload.find({
            collection: "media",
            where: { mimeType: { contains: "image" } },
            limit: 0,
            overrideAccess: true,
        });

        // Get total size from DB
        const allDocs = await payload.find({
            collection: "media",
            limit: 1000,
            overrideAccess: true,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalSize = allDocs.docs.reduce((acc: number, doc: any) => acc + (doc.filesize || 0), 0);

        return {
            totalFiles: all.totalDocs,
            totalImages: images.totalDocs,
            totalDocuments: all.totalDocs - images.totalDocs,
            totalSize,
        };
    } catch (error) {
        console.error("[getMediaStats] Error:", error);
        return { totalFiles: 0, totalImages: 0, totalDocuments: 0, totalSize: 0 };
    }
}
