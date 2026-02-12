/**
 * Categories Collection - Payload CMS
 * 
 * Taxonomía jerárquica para organizar posts del blog.
 * Soporta categorías anidadas (parent).
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor, isAdmin } from '../access/index.ts';

export const Categories: CollectionConfig = {
    slug: 'categories',
    labels: {
        singular: 'Categoría',
        plural: 'Categorías',
    },
    admin: {
        useAsTitle: 'name',
        group: 'Blog',
    },
    access: {
        read: publicRead,
        create: isEditor,
        update: isEditor,
        delete: isAdmin,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            label: 'Nombre',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            label: 'Slug',
            unique: true,
            index: true,
            admin: {
                description: 'URL amigable (se genera automáticamente)',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción',
        },
        {
            name: 'parent',
            type: 'relationship',
            relationTo: 'categories',
            label: 'Categoría Padre',
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'icon',
            type: 'text',
            label: 'Icono',
            admin: {
                description: 'Nombre del icono de Lucide (ej: "Cpu", "Printer")',
            },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                if (data.name && !data.slug) {
                    data.slug = data.name
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
                return data;
            },
        ],
    },
    timestamps: true,
};
