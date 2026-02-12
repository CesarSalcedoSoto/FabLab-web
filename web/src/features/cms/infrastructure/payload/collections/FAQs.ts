/**
 * FAQs Collection - Payload CMS
 * 
 * Preguntas frecuentes organizadas por categoría.
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const FAQs: CollectionConfig = {
    slug: 'faqs',
    labels: {
        singular: 'FAQ',
        plural: 'FAQs',
    },
    admin: {
        useAsTitle: 'question',
        defaultColumns: ['question', 'category', 'published', 'order'],
        group: 'Contenido',
        description: 'Preguntas frecuentes del FabLab',
    },
    access: {
        read: publicRead,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'question',
            type: 'text',
            required: true,
            label: 'Pregunta',
        },
        {
            name: 'answer',
            type: 'richText',
            required: true,
            label: 'Respuesta',
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Categoría',
            options: [
                { label: 'General', value: 'general' },
                { label: 'Membresías', value: 'membership' },
                { label: 'Servicios', value: 'services' },
                { label: 'Equipamiento', value: 'equipment' },
                { label: 'Eventos', value: 'events' },
                { label: 'Horarios', value: 'schedule' },
                { label: 'Pagos', value: 'payments' },
            ],
            defaultValue: 'general',
            admin: { position: 'sidebar' },
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden',
            defaultValue: 0,
            admin: { position: 'sidebar' },
        },
        {
            name: 'published',
            type: 'checkbox',
            label: 'Publicado',
            defaultValue: true,
            admin: { position: 'sidebar' },
        },
    ],
};
