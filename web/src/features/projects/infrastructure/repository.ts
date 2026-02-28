/**
 * Projects Repository - Carga de datos desde CMS
 * 
 * Este módulo maneja la carga de proyectos desde Payload CMS.
 * La colección está definida en @/features/cms
 * 
 * @example
 * ```typescript
 * import { projectsRepository } from '@/features/projects';
 * 
 * const projects = await projectsRepository.getAll();
 * const featured = await projectsRepository.getFeatured();
 * ```
 */

import { getPayload } from 'payload';
import config from '@payload-config';

// Tipos
export interface ProjectCreator {
    id?: string;
    name: string;
    image?: string;
    role?: string;
    isTeamMember: boolean;
}

export interface ProjectLink {
    label: string;
    url: string;
}

export interface Project {
    id: string;
    title: string;
    slug: string;
    category: 'Hardware' | 'Software' | 'Diseño' | 'IoT';
    description: string;
    content?: any;
    featuredImage?: string;
    gallery: string[];
    technologies: string[];
    creators: ProjectCreator[];
    links: ProjectLink[];
    year: number;
    featured: boolean;
    status: 'draft' | 'published';
    order: number;
}

/**
 * Normaliza URL de media a ruta relativa
 */
function normalizeMediaUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;
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
 * Transforma datos de Payload a tipo Project
 */
function transformProject(doc: any): Project {
    return {
        id: String(doc.id),
        title: doc.title,
        slug: doc.slug,
        category: doc.category,
        description: doc.description,
        content: doc.content,
        featuredImage: normalizeMediaUrl(typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : undefined),
        gallery: doc.gallery?.map((g: any) =>
            normalizeMediaUrl(typeof g.image === 'object' ? g.image?.url : undefined)
        ).filter(Boolean) || [],
        technologies: doc.technologies?.map((t: any) => t.name) || [],
        creators: doc.creators?.map((c: any) => ({
            id: c.teamMember?.id ? String(c.teamMember.id) : undefined,
            name: c.teamMember?.name || c.externalName || '',
            image: normalizeMediaUrl(typeof c.teamMember?.image === 'object' ? c.teamMember.image?.url : undefined),
            role: c.role,
            isTeamMember: Boolean(c.teamMember),
        })) || [],
        links: doc.links?.map((l: any) => ({ label: l.label, url: l.url })) || [],
        year: doc.year || new Date().getFullYear(),
        featured: doc.featured || false,
        status: doc.status || 'draft',
        order: doc.order || 0,
    };
}

/**
 * Repository para acceder a proyectos
 */
export const projectsRepository = {
    /**
     * Obtener todos los proyectos publicados
     */
    async getAll(): Promise<Project[]> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'projects',
            where: { status: { equals: 'published' } },
            sort: '-featured,order',
            limit: 100,
            depth: 2,
        });
        return result.docs.map(transformProject);
    },

    /**
     * Obtener proyectos destacados
     */
    async getFeatured(): Promise<Project[]> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'projects',
            where: {
                status: { equals: 'published' },
                featured: { equals: true },
            },
            sort: 'order',
            limit: 6,
            depth: 2,
        });
        return result.docs.map(transformProject);
    },

    /**
     * Obtener proyecto por slug
     */
    async getBySlug(slug: string): Promise<Project | null> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'projects',
            where: { slug: { equals: slug } },
            limit: 1,
            depth: 2,
        });
        return result.docs[0] ? transformProject(result.docs[0]) : null;
    },

    /**
     * Obtener proyectos por categoría
     */
    async getByCategory(category: string): Promise<Project[]> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'projects',
            where: {
                status: { equals: 'published' },
                category: { equals: category },
            },
            sort: '-featured,order',
            limit: 50,
            depth: 2,
        });
        return result.docs.map(transformProject);
    },

    /**
     * Obtener estadísticas
     */
    async getStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'projects',
            where: { status: { equals: 'published' } },
            limit: 0,
        });

        const byCategory: Record<string, number> = {};
        result.docs.forEach((doc: any) => {
            byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
        });

        return { total: result.totalDocs, byCategory };
    },
};
