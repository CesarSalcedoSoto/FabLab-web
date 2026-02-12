/**
 * Equipment Collection - Payload CMS
 * 
 * Máquinas y equipamiento disponible en el FabLab.
 * 
 * @status
 * - available: Disponible para uso
 * - maintenance: En mantenimiento
 * - out-of-service: Fuera de servicio
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const Equipment: CollectionConfig = {
    slug: 'equipment',
    labels: {
        singular: 'Equipo',
        plural: 'Equipamiento',
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'category', 'status', 'updatedAt'],
        group: 'Servicios',
        description: 'Gestiona las máquinas y herramientas del FabLab',
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
            label: 'Nombre del Equipo',
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            label: 'URL Slug',
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Categoría',
            options: [
                { label: 'Impresora 3D', value: '3d-printer' },
                { label: 'Cortadora Láser', value: 'laser-cutter' },
                { label: 'CNC', value: 'cnc' },
                { label: 'Electrónica', value: 'electronics' },
                { label: 'Herramientas Manuales', value: 'hand-tools' },
                { label: 'Escáner 3D', value: '3d-scanner' },
                { label: 'Otro', value: 'other' },
            ],
            defaultValue: '3d-printer',
        },
        {
            name: 'brand',
            type: 'text',
            label: 'Marca',
        },
        {
            name: 'model',
            type: 'text',
            label: 'Modelo',
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            label: 'Descripción',
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
            ],
        },
        {
            name: 'specifications',
            type: 'array',
            label: 'Especificaciones Técnicas',
            fields: [
                {
                    name: 'label',
                    type: 'text',
                    required: true,
                    label: 'Especificación',
                },
                {
                    name: 'value',
                    type: 'text',
                    required: true,
                    label: 'Valor',
                },
            ],
        },
        {
            name: 'materials',
            type: 'array',
            label: 'Materiales Compatibles',
            fields: [
                {
                    name: 'material',
                    type: 'text',
                    required: true,
                },
            ],
        },
        {
            name: 'manuals',
            type: 'array',
            label: 'Manuales y Documentación',
            fields: [
                {
                    name: 'title',
                    type: 'text',
                    required: true,
                    label: 'Título',
                },
                {
                    name: 'file',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Archivo',
                },
                {
                    name: 'url',
                    type: 'text',
                    label: 'URL Externa',
                },
            ],
        },
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Disponible', value: 'available' },
                { label: 'En Mantenimiento', value: 'maintenance' },
                { label: 'Fuera de Servicio', value: 'out-of-service' },
            ],
            defaultValue: 'available',
            admin: { position: 'sidebar' },
        },
        {
            name: 'location',
            type: 'text',
            label: 'Ubicación',
            admin: {
                position: 'sidebar',
                description: 'Ej: "Sala 1", "Taller Principal"',
            },
        },
        {
            name: 'requiresTraining',
            type: 'checkbox',
            label: 'Requiere Capacitación',
            defaultValue: false,
            admin: { position: 'sidebar' },
        },
        {
            name: 'showInTecnologias',
            type: 'checkbox',
            label: 'Mostrar en Tecnologías',
            defaultValue: true,
            admin: {
                position: 'sidebar',
                description: 'Si está activado, el equipo será visible en la página /tecnologías',
            },
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden',
            defaultValue: 0,
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
