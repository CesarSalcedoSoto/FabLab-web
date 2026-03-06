/**
 * Equipment Collection - Payload CMS
 * 
 * Máquinas y equipamiento disponible en el FabLab.
 * 
 * @status
 * - available: Disponible para uso
 * - in-use: En uso
 * - maintenance: En mantenimiento
 * - out-of-service: Fuera de servicio
 * - inactive: Inactivo
 * - borrowed: Prestado por otra área
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
            name: 'equipmentCode',
            type: 'text',
            unique: true,
            label: 'Código de Equipo',
            admin: {
                description: 'Código único. Ej: FL-IMP3D-01, FL-LASER-02',
            },
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
                { label: 'Herramientas Eléctricas', value: 'power-tools' },
                { label: 'Escáner 3D', value: '3d-scanner' },
                { label: 'Computación', value: 'computing' },
                { label: 'Otro', value: 'other' },
            ],
            defaultValue: '3d-printer',
        },
        {
            name: 'ownerArea',
            type: 'text',
            label: 'Área Propietaria',
            admin: {
                description: 'Área o departamento dueño del equipo. Ej: FabLab, Depto. Ingeniería',
            },
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
                { label: 'Activo', value: 'available' },
                { label: 'En Uso', value: 'in-use' },
                { label: 'En Mantención', value: 'maintenance' },
                { label: 'Inactivo', value: 'inactive' },
                { label: 'Fuera de Servicio', value: 'out-of-service' },
                { label: 'Prestado por otra área', value: 'borrowed' },
            ],
            defaultValue: 'available',
            admin: { position: 'sidebar' },
        },
        {
            name: 'technicalResponsible',
            type: 'relationship',
            relationTo: 'users',
            label: 'Responsable Técnico',
            admin: {
                position: 'sidebar',
                description: 'Usuario responsable del mantenimiento de este equipo',
            },
        },
        {
            name: 'lastReviewDate',
            type: 'date',
            label: 'Fecha Última Revisión',
            admin: {
                position: 'sidebar',
                date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
            },
        },
        {
            name: 'location',
            type: 'relationship',
            relationTo: 'rooms' as any,
            label: 'Ubicación (Sala)',
            admin: {
                position: 'sidebar',
                description: 'Sala o espacio donde se encuentra el equipo',
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
        // ── Historial de Mantenciones ──
        {
            name: 'maintenanceHistory',
            type: 'array',
            label: 'Historial de Mantenciones',
            admin: {
                description: 'Registro de todas las mantenciones realizadas',
            },
            fields: [
                {
                    name: 'date',
                    type: 'date',
                    required: true,
                    label: 'Fecha',
                    admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                },
                {
                    name: 'maintenanceType',
                    type: 'select',
                    required: true,
                    label: 'Tipo',
                    options: [
                        { label: 'Preventiva', value: 'preventive' },
                        { label: 'Correctiva', value: 'corrective' },
                        { label: 'Calibración', value: 'calibration' },
                        { label: 'Limpieza', value: 'cleaning' },
                        { label: 'Actualización', value: 'upgrade' },
                    ],
                },
                {
                    name: 'description',
                    type: 'textarea',
                    required: true,
                    label: 'Descripción del Trabajo',
                },
                {
                    name: 'performedBy',
                    type: 'text',
                    label: 'Realizado por',
                },
                {
                    name: 'cost',
                    type: 'number',
                    label: 'Costo ($)',
                    min: 0,
                },
                {
                    name: 'nextMaintenanceDate',
                    type: 'date',
                    label: 'Próxima Mantención',
                    admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                },
            ],
        },
        // ── Registro de Fallas ──
        {
            name: 'failureHistory',
            type: 'array',
            label: 'Registro de Fallas',
            admin: {
                description: 'Historial de fallas y problemas reportados',
            },
            fields: [
                {
                    name: 'date',
                    type: 'date',
                    required: true,
                    label: 'Fecha de Falla',
                    admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                },
                {
                    name: 'severity',
                    type: 'select',
                    required: true,
                    label: 'Severidad',
                    options: [
                        { label: 'Baja', value: 'low' },
                        { label: 'Media', value: 'medium' },
                        { label: 'Alta', value: 'high' },
                        { label: 'Crítica', value: 'critical' },
                    ],
                },
                {
                    name: 'description',
                    type: 'textarea',
                    required: true,
                    label: 'Descripción de la Falla',
                },
                {
                    name: 'reportedBy',
                    type: 'text',
                    label: 'Reportado por',
                },
                {
                    name: 'resolved',
                    type: 'checkbox',
                    label: 'Resuelta',
                    defaultValue: false,
                },
                {
                    name: 'resolution',
                    type: 'textarea',
                    label: 'Descripción de la Solución',
                    admin: {
                        condition: (_, siblingData) => siblingData?.resolved,
                    },
                },
                {
                    name: 'resolvedDate',
                    type: 'date',
                    label: 'Fecha de Resolución',
                    admin: {
                        condition: (_, siblingData) => siblingData?.resolved,
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
                    },
                },
            ],
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
