/**
 * Gallery Collection - Payload CMS
 * 
 * Fotos y videos del FabLab organizados en álbumes.
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const Gallery: CollectionConfig = {
    slug: 'gallery',
    labels: {
        singular: 'Imagen de Galería',
        plural: 'Galería',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'album', 'status', 'updatedAt'],
        group: 'Galería',
        description: 'Fotos y videos del FabLab',
    },
    access: {
        read: publicRead,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Título',
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción',
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            required: true,
            label: 'Imagen',
        },
        {
            name: 'album',
            type: 'text',
            label: 'Álbum',
            admin: {
                description: 'Nombre del álbum para agrupar (ej: "Inauguración 2025", "Proyectos Destacados")',
            },
        },
        {
            name: 'tags',
            type: 'array',
            label: 'Etiquetas',
            admin: { position: 'sidebar' },
            fields: [
                { name: 'tag', type: 'text', label: 'Etiqueta' },
            ],
        },
        {
            name: 'date',
            type: 'date',
            label: 'Fecha',
            admin: {
                position: 'sidebar',
                date: { pickerAppearance: 'dayOnly' },
            },
        },
        {
            name: 'featured',
            type: 'checkbox',
            label: 'Destacada',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'draft' },
                { label: 'Publicada', value: 'published' },
            ],
            defaultValue: 'draft',
            admin: { position: 'sidebar' },
        },
    ],
    timestamps: true,
};
