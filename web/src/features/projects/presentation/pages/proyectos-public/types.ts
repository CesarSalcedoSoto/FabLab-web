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

// Soporte para ambos formatos de categoría (mayúscula y minúscula)
export const CATEGORY_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
    // Minúsculas
    hardware: { label: 'Hardware', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    software: { label: 'Software', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    design: { label: 'Diseño', color: 'text-pink-700', bgColor: 'bg-pink-100' },
    iot: { label: 'IoT', color: 'text-green-700', bgColor: 'bg-green-100' },
    // Mayúsculas (desde Payload CMS)
    Hardware: { label: 'Hardware', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    Software: { label: 'Software', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    Diseño: { label: 'Diseño', color: 'text-pink-700', bgColor: 'bg-pink-100' },
    IoT: { label: 'IoT', color: 'text-green-700', bgColor: 'bg-green-100' },
};
