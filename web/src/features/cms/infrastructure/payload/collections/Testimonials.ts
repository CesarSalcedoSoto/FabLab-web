/**
 * Testimonials Collection - Payload CMS
 * 
 * Testimonios y opiniones de usuarios del FabLab.
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const Testimonials: CollectionConfig = {
    slug: 'testimonials',
    labels: {
        singular: 'Testimonio',
        plural: 'Testimonios',
    },
    admin: {
        useAsTitle: 'author',
        defaultColumns: ['author', 'role', 'rating', 'featured', 'published'],
        group: 'Contenido',
        description: 'Testimonios de usuarios del FabLab',
    },
    access: {
        read: ({ req: { user } }) => {
            if (user) return true;
            return { published: { equals: true } };
        },
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'author',
            type: 'text',
            required: true,
            label: 'Nombre del Autor',
        },
        {
            name: 'role',
            type: 'text',
            label: 'Cargo / Institución',
            admin: {
                description: 'Ej: "Estudiante de Ingeniería", "Emprendedor", "Profesor INACAP"',
            },
        },
        {
            name: 'content',
            type: 'textarea',
            required: true,
            label: 'Testimonio',
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'media',
            label: 'Foto del Autor',
        },
        {
            name: 'rating',
            type: 'number',
            label: 'Calificación',
            min: 1,
            max: 5,
            defaultValue: 5,
            admin: {
                position: 'sidebar',
                description: 'Del 1 al 5',
            },
        },
        {
            name: 'projectLink',
            type: 'relationship',
            relationTo: 'projects',
            label: 'Proyecto Relacionado',
            admin: {
                description: 'Opcional: vincular a un proyecto',
            },
        },
        {
            name: 'featured',
            type: 'checkbox',
            label: 'Destacado',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'published',
            type: 'checkbox',
            label: 'Publicado',
            defaultValue: true,
            admin: { position: 'sidebar' },
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden',
            defaultValue: 0,
            admin: { position: 'sidebar' },
        },
    ],
};
