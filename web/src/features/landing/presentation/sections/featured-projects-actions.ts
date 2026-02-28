"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export interface ProjectBox {
  id: string;
  titulo: string;
  imagenes: string[];
  descripcion?: string;
}

interface PayloadProject {
  id: string;
  title: string;
  description?: string;
  featuredImage?: { url: string };
  gallery?: Array<{ image?: { url: string } }>;
  status?: string;
}

/**
 * Normaliza URL de media a ruta relativa
 */
function normalizeMediaUrl(url: string): string {
    if (url.startsWith('/')) return url;
    try {
        return new URL(url).pathname;
    } catch {
        const idx = url.indexOf('/api/');
        if (idx !== -1) return url.substring(idx);
        const mIdx = url.indexOf('/media/');
        if (mIdx !== -1) return url.substring(mIdx);
        return url;
    }
}

/**
 * Obtiene proyectos destacados desde Payload CMS
 */
export async function getFeaturedProjects(): Promise<ProjectBox[]> {
  try {
    const payload = await getPayload({ config });

    const { docs: projects } = await payload.find({
      collection: "projects",
      depth: 2,
      limit: 12,
      where: {
        status: {
          equals: "published",
        },
      },
      sort: "-createdAt",
    });

    // Transformar datos de Payload al formato esperado
    return (projects as PayloadProject[]).map((project) => {
      const imagenes: string[] = [];
      
      // Primero la imagen principal/destacada
      if (project.featuredImage?.url) {
        imagenes.push(normalizeMediaUrl(project.featuredImage.url));
      }
      
      // Luego las imágenes de la galería
      if (project.gallery && project.gallery.length > 0) {
        project.gallery.forEach((item) => {
          const normalizedUrl = item.image?.url ? normalizeMediaUrl(item.image.url) : null;
          if (normalizedUrl && !imagenes.includes(normalizedUrl)) {
            imagenes.push(normalizedUrl);
          }
        });
      }
      
      return {
        id: project.id,
        titulo: project.title,
        imagenes,
        descripcion: project.description,
      };
    });
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    return [];
  }
}
