/**
 * Events Collection - Payload CMS
 * 
 * Talleres, cursos, charlas y eventos del FabLab.
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const Events: CollectionConfig = {
    slug: 'events',
    labels: {
        singular: 'Evento',
        plural: 'Eventos',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'type', 'startDate', 'status', 'updatedAt'],
        group: 'Eventos',
        description: 'Gestiona talleres, cursos y eventos del FabLab',
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
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            label: 'URL Slug',
        },
        {
            name: 'type',
            type: 'select',
            required: true,
            label: 'Tipo de Evento',
            options: [
                { label: 'Taller', value: 'workshop' },
                { label: 'Curso', value: 'course' },
                { label: 'Charla', value: 'talk' },
                { label: 'Hackathon', value: 'hackathon' },
                { label: 'Open Day', value: 'open-day' },
                { label: 'Meetup', value: 'meetup' },
            ],
            defaultValue: 'workshop',
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            label: 'Descripción Corta',
        },
        {
            name: 'content',
            type: 'richText',
            label: 'Contenido Detallado',
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Imagen Principal',
        },
        {
            name: 'startDate',
            type: 'date',
            required: true,
            label: 'Fecha de Inicio',
            admin: {
                date: { pickerAppearance: 'dayAndTime' },
            },
        },
        {
            name: 'endDate',
            type: 'date',
            label: 'Fecha de Fin',
            admin: {
                date: { pickerAppearance: 'dayAndTime' },
            },
        },
        {
            name: 'location',
            type: 'text',
            label: 'Ubicación',
            admin: {
                description: 'Ej: "FabLab INACAP Sede Los Ángeles" o "Online"',
            },
        },
        {
            name: 'isOnline',
            type: 'checkbox',
            label: 'Evento Online',
            defaultValue: false,
        },
        {
            name: 'instructor',
            type: 'relationship',
            relationTo: 'users',
            label: 'Instructor',
            hasMany: false,
        },
        {
            name: 'externalInstructor',
            type: 'text',
            label: 'Instructor Externo',
            admin: {
                description: 'Usar si el instructor no es miembro del equipo',
            },
        },
        {
            name: 'capacity',
            type: 'number',
            label: 'Capacidad',
            admin: {
                description: 'Número máximo de participantes (0 = ilimitado)',
            },
        },
        {
            name: 'registrationUrl',
            type: 'text',
            label: 'URL de Inscripción',
            admin: {
                description: 'Link a Google Forms, Eventbrite, etc.',
            },
        },
        {
            name: 'price',
            type: 'text',
            label: 'Precio',
            admin: {
                description: 'Ej: "Gratis", "$10.000", "Gratis para miembros"',
            },
        },
        {
            name: 'requirements',
            type: 'array',
            label: 'Requisitos',
            fields: [
                {
                    name: 'requirement',
                    type: 'text',
                    required: true,
                },
            ],
        },
        {
            name: 'materials',
            type: 'array',
            label: 'Materiales Incluidos',
            fields: [
                {
                    name: 'material',
                    type: 'text',
                    required: true,
                },
            ],
        },
        {
            name: 'tags',
            type: 'array',
            label: 'Etiquetas',
            admin: { position: 'sidebar' },
            fields: [
                { name: 'tag', type: 'text' },
            ],
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
                { label: 'Cancelado', value: 'cancelled' },
                { label: 'Completado', value: 'completed' },
            ],
            defaultValue: 'draft',
            admin: { position: 'sidebar' },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                if (data.title && !data.slug) {
                    const date = new Date(data.startDate || new Date());
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const baseSlug = data.title
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                    data.slug = `${year}/${month}/${baseSlug}`;
                }
                return data;
            },
        ],
    },
};
