/**
 * Technologies Collection - Payload CMS
 * 
 * Catálogo de tecnologías utilizadas en proyectos del FabLab.
 * Se pueden crear inline desde proyectos digitales (solo admin).
 * 
 * @visibility Solo dentro de proyectos (no expuesta en otras secciones)
 */

import type { CollectionConfig } from 'payload';
import { isAdmin, isEditor } from '../access/index';

export const Technologies: CollectionConfig = {
    slug: 'technologies',
    labels: {
        singular: 'Tecnología',
        plural: 'Tecnologías',
    },
    admin: {
        useAsTitle: 'name',
        group: 'Proyectos',
        description: 'Catálogo de tecnologías para asignar a proyectos',
    },
    access: {
        read: isEditor,
        create: isAdmin,  // Solo admin puede crear nuevas tecnologías
        update: isAdmin,
        delete: isAdmin,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
            label: 'Nombre',
            admin: {
                description: 'Ej: Arduino, React, Impresión 3D, Fusion 360',
            },
        },
        {
            name: 'category',
            type: 'select',
            label: 'Categoría',
            options: [
                { label: 'Hardware', value: 'hardware' },
                { label: 'Software', value: 'software' },
                { label: 'Diseño', value: 'design' },
                { label: 'Fabricación', value: 'fabrication' },
                { label: 'Otro', value: 'other' },
            ],
            defaultValue: 'other',
        },
        {
            name: 'icon',
            type: 'text',
            label: 'Ícono (opcional)',
            admin: {
                description: 'Nombre del ícono de Lucide o URL',
            },
        },
    ],
    timestamps: true,
};
