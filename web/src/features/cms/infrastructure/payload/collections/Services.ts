/**
 * Services Collection - Payload CMS
 * 
 * Servicios que ofrece el FabLab.
 * 
 * @categories
 * - Impresión 3D
 * - Corte Láser
 * - CNC
 * - Electrónica
 * - Diseño y Prototipado
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const Services: CollectionConfig = {
    slug: 'services',
    labels: {
        singular: 'Servicio',
        plural: 'Servicios',
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'category', 'status', 'order', 'updatedAt'],
        group: 'Servicios',
        description: 'Gestiona los servicios que ofrece el FabLab',
    },
    access: {
        read: publicRead,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            label: 'Nombre del Servicio',
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            label: 'URL Slug',
            admin: {
                description: 'Se genera automáticamente del nombre',
            },
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Categoría',
            options: [
                { label: 'Impresión 3D', value: '3d-printing' },
                { label: 'Corte Láser', value: 'laser-cutting' },
                { label: 'CNC', value: 'cnc' },
                { label: 'Electrónica', value: 'electronics' },
                { label: 'Diseño y Prototipado', value: 'design' },
                { label: 'Capacitación', value: 'training' },
            ],
            defaultValue: '3d-printing',
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            label: 'Descripción Corta',
            admin: {
                description: 'Resumen breve para tarjetas y listados',
            },
        },
        {
            name: 'content',
            type: 'richText',
            label: 'Contenido Detallado',
        },
        {
            name: 'icon',
            type: 'text',
            label: 'Icono',
            admin: {
                description: 'Nombre del icono de Lucide (ej: "Printer", "Cpu", "Scissors")',
            },
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Imagen Principal',
        },
        {
            name: 'gallery',
            type: 'array',
            label: 'Galería',
            fields: [
                {
                    name: 'image',
                    type: 'upload',
                    relationTo: 'media',
                    required: true,
                },
                {
                    name: 'caption',
                    type: 'text',
                    label: 'Descripción',
                },
            ],
        },
        {
            name: 'pricing',
            type: 'array',
            label: 'Precios',
            admin: {
                description: 'Tabla de precios del servicio',
            },
            fields: [
                {
                    name: 'item',
                    type: 'text',
                    required: true,
                    label: 'Concepto',
                },
                {
                    name: 'price',
                    type: 'text',
                    required: true,
                    label: 'Precio',
                    admin: {
                        description: 'Ej: "$5.000/hora", "Consultar", "Gratis para miembros"',
                    },
                },
                {
                    name: 'notes',
                    type: 'text',
                    label: 'Notas',
                },
            ],
        },
        {
            name: 'features',
            type: 'array',
            label: 'Características',
            fields: [
                {
                    name: 'feature',
                    type: 'text',
                    required: true,
                },
            ],
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden',
            defaultValue: 0,
            admin: { position: 'sidebar' },
        },
        {
            name: 'featured',
            type: 'checkbox',
            label: 'Destacado',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'draft' },
                { label: 'Publicado', value: 'published' },
            ],
            defaultValue: 'draft',
            admin: { position: 'sidebar' },
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
};
