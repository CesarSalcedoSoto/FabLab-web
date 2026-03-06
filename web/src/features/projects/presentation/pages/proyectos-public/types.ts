/**
 * Types - Public Proyectos Page
 */

export interface ProjectLink {
    label: string;
    url: string;
}

export interface ProjectPublic {
    id: string;
    title: string;
    slug: string;
    category: string;
    description: string;
    featuredImage: string | null;
    gallery: string[];
    technologies: string[];
    creators: Array<{ name: string; role?: string; avatar?: string }>;
    year: number;
    featured: boolean;
    objective?: string;
    problemSolved?: string;
    links: ProjectLink[];
}

export const CATEGORY_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
    'proyectos-fisicos': { label: 'Proyectos Físicos', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    'proyectos-digitales': { label: 'Proyectos Digitales', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    'diseno': { label: 'Diseño', color: 'text-pink-700', bgColor: 'bg-pink-100' },
    'animacion': { label: 'Animación', color: 'text-green-700', bgColor: 'bg-green-100' },
};
