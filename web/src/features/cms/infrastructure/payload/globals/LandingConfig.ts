/**
 * LandingConfig Global - Payload CMS
 * 
 * Configuración de la página principal.
 */

import type { GlobalConfig } from 'payload';
import { isEditor } from '../access/index.ts';

export const LandingConfig: GlobalConfig = {
    slug: 'landing-config',
    label: 'Página Principal',
    admin: {
        group: 'Páginas',
        description: 'Configuración del contenido de la landing page',
    },
    access: {
        read: () => true,
        update: isEditor,
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Hero',
                    fields: [
                        {
                            name: 'heroTitle',
                            type: 'text',
                            label: 'Título Principal',
                            defaultValue: 'FabLab INACAP',
                        },
                        {
                            name: 'heroSubtitle',
                            type: 'textarea',
                            label: 'Subtítulo',
                        },
                        {
                            name: 'heroImage',
                            type: 'upload',
                            relationTo: 'media',
                            label: 'Imagen de Fondo',
                        },
                        {
                            name: 'ctaButtons',
                            type: 'array',
                            label: 'Botones de Acción',
                            maxRows: 3,
                            fields: [
                                {
                                    name: 'text',
                                    type: 'text',
                                    required: true,
                                    label: 'Texto',
                                },
                                {
                                    name: 'url',
                                    type: 'text',
                                    required: true,
                                    label: 'URL',
                                },
                                {
                                    name: 'variant',
                                    type: 'select',
                                    label: 'Estilo',
                                    options: [
                                        { label: 'Primario', value: 'primary' },
                                        { label: 'Secundario', value: 'secondary' },
                                        { label: 'Outline', value: 'outline' },
                                    ],
                                    defaultValue: 'primary',
                                },
                            ],
                        },
                    ],
                },
                {
                    label: 'Secciones',
                    fields: [
                        {
                            name: 'showServices',
                            type: 'checkbox',
                            label: 'Mostrar Servicios',
                            defaultValue: true,
                        },
                        {
                            name: 'featuredServices',
                            type: 'relationship',
                            relationTo: 'services',
                            hasMany: true,
                            label: 'Servicios Destacados',
                            admin: {
                                condition: (data) => data?.showServices,
                            },
                        },
                        {
                            name: 'showProjects',
                            type: 'checkbox',
                            label: 'Mostrar Proyectos',
                            defaultValue: true,
                        },
                        {
                            name: 'projectsCount',
                            type: 'number',
                            label: 'Cantidad de Proyectos',
                            defaultValue: 6,
                            admin: {
                                condition: (data) => data?.showProjects,
                            },
                        },
                        {
                            name: 'showTeam',
                            type: 'checkbox',
                            label: 'Mostrar Equipo',
                            defaultValue: true,
                        },
                        {
                            name: 'showTestimonials',
                            type: 'checkbox',
                            label: 'Mostrar Testimonios',
                            defaultValue: true,
                        },
                        {
                            name: 'showEvents',
                            type: 'checkbox',
                            label: 'Mostrar Eventos',
                            defaultValue: true,
                        },
                        {
                            name: 'upcomingEventsCount',
                            type: 'number',
                            label: 'Cantidad de Eventos',
                            defaultValue: 3,
                            admin: {
                                condition: (data) => data?.showEvents,
                            },
                        },
                    ],
                },
                {
                    label: 'Estadísticas',
                    fields: [
                        {
                            name: 'showStats',
                            type: 'checkbox',
                            label: 'Mostrar Estadísticas',
                            defaultValue: true,
                        },
                        {
                            name: 'stats',
                            type: 'array',
                            label: 'Estadísticas',
                            admin: {
                                condition: (data) => data?.showStats,
                            },
                            fields: [
                                {
                                    name: 'value',
                                    type: 'text',
                                    required: true,
                                    label: 'Valor',
                                    admin: {
                                        description: 'Ej: "500+", "1000", "50"',
                                    },
                                },
                                {
                                    name: 'label',
                                    type: 'text',
                                    required: true,
                                    label: 'Etiqueta',
                                    admin: {
                                        description: 'Ej: "Proyectos", "Usuarios", "Cursos"',
                                    },
                                },
                                {
                                    name: 'icon',
                                    type: 'text',
                                    label: 'Icono (Lucide)',
                                },
                            ],
                        },
                    ],
                },
                {
                    label: 'SEO',
                    fields: [
                        {
                            name: 'metaTitle',
                            type: 'text',
                            label: 'Meta Título',
                        },
                        {
                            name: 'metaDescription',
                            type: 'textarea',
                            label: 'Meta Descripción',
                        },
                        {
                            name: 'ogImage',
                            type: 'upload',
                            relationTo: 'media',
                            label: 'Imagen Open Graph',
                        },
                    ],
                },
            ],
        },
    ],
};
