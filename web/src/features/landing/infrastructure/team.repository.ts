/**
 * Team Repository - Carga de datos desde CMS
 * 
 * Acceso a miembros del equipo desde Payload CMS.
 * La colección está definida en @/features/cms
 * 
 * @example
 * ```typescript
 * import { teamRepository } from '@/features/landing';
 * 
 * const members = await teamRepository.getAll();
 * const leadership = await teamRepository.getByCategory('leadership');
 * ```
 */

import { getPayload } from 'payload';
import config from '@payload-config';

// Tipos
export interface TeamMember {
    id: string;
    name: string;
    role: string;
    category: 'leadership' | 'specialist' | 'collaborator';
    specialty?: string;
    image?: string;
    bio?: string;
    experience?: string;
    achievements: string[];
    social: {
        email?: string;
        linkedin?: string;
        github?: string;
        twitter?: string;
    };
    order: number;
    active: boolean;
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
 * Transforma datos de Payload a tipo TeamMember
 */
function transformMember(doc: any): TeamMember {
    return {
        id: String(doc.id),
        name: doc.name,
        role: doc.jobTitle || 'Miembro del Equipo', // Map jobTitle to role
        category: doc.category || 'specialist',
        specialty: doc.specialty,
        image: normalizeMediaUrl(typeof doc.avatar === 'object' ? doc.avatar?.url : undefined),
        bio: doc.bio,
        experience: doc.experience,
        achievements: doc.achievements?.map((a: any) => a.achievement) || [],
        social: {
            email: doc.email,
            linkedin: doc.linkedin,
            github: doc.github,
            twitter: doc.twitter, // If added later
        },
        order: doc.order || 99,
        active: true, // If returned, it's active
    };
}

/**
 * Repository para acceder a miembros del equipo
 */
export const teamRepository = {
    /**
     * Obtener todos los miembros activos
     */
    async getAll(): Promise<TeamMember[]> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'users',
            where: { showInTeam: { equals: true } },
            sort: 'name',
            limit: 50,
            depth: 1,
        });
        return result.docs.map(transformMember);
    },

    /**
     * Obtener miembros por categoría
     */
    async getByCategory(category: 'leadership' | 'specialist' | 'collaborator'): Promise<TeamMember[]> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'users',
            where: {
                showInTeam: { equals: true },
                category: { equals: category },
            },
            sort: 'name',
            limit: 50,
            depth: 1,
        });
        return result.docs.map(transformMember);
    },

    /**
     * Obtener miembro por ID
     */
    async getById(id: string): Promise<TeamMember | null> {
        try {
            const payload = await getPayload({ config });
            const doc = await payload.findByID({
                collection: 'users',
                id,
                depth: 1,
            });
            return doc ? transformMember(doc) : null;
        } catch {
            return null;
        }
    },

    /**
     * Obtener estadísticas
     */
    async getStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'users',
            where: { showInTeam: { equals: true } },
            limit: 0,
        });

        const byCategory: Record<string, number> = {};
        result.docs.forEach((doc: any) => {
            byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
        });

        return { total: result.totalDocs, byCategory };
    },
};

/**
 * Obtener configuración de la página de equipo
 */
export async function getEquipoPageConfig() {
    const payload = await getPayload({ config });
    const data = await payload.findGlobal({ slug: 'equipo-page' });
    return {
        heroTitle: data.heroTitle || 'Las personas detrás de FabLab',
        heroDescription: data.heroDescription || '',
        heroStats: data.heroStats?.map((s: any) => ({
            text: s.text,
            icon: s.icon,
        })) || [],
    };
}
