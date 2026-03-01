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
        // Color del evento en el calendario
        {
            name: 'calendarColor',
            type: 'select',
            label: 'Color Calendario',
            options: [
                { label: 'Azul (Taller)', value: 'blue' },
                { label: 'Morado (Curso)', value: 'purple' },
                { label: 'Verde (Charla)', value: 'green' },
                { label: 'Naranja (Hackathon)', value: 'orange' },
                { label: 'Rosa (Open Day)', value: 'pink' },
                { label: 'Teal (Meetup)', value: 'teal' },
                { label: 'Rojo (Urgente)', value: 'red' },
            ],
            defaultValue: 'blue',
            admin: { position: 'sidebar' },
        },
        // Formulario de inscripción personalizado
        {
            name: 'registrationFields',
            type: 'array',
            label: 'Campos del Formulario de Inscripción',
            admin: {
                description: 'Define qué campos adicionales debe llenar el inscrito (nombre, apellido y email son obligatorios siempre)',
            },
            fields: [
                {
                    name: 'fieldName',
                    type: 'text',
                    required: true,
                    label: 'Nombre del Campo',
                    admin: { description: 'Ej: "Carrera", "RUT", "Empresa"' },
                },
                {
                    name: 'fieldType',
                    type: 'select',
                    required: true,
                    label: 'Tipo',
                    options: [
                        { label: 'Texto', value: 'text' },
                        { label: 'Email', value: 'email' },
                        { label: 'Teléfono', value: 'tel' },
                        { label: 'Número', value: 'number' },
                        { label: 'Texto largo', value: 'textarea' },
                        { label: 'Selección', value: 'select' },
                        { label: 'Casilla (Sí/No)', value: 'checkbox' },
                        { label: 'Firma', value: 'signature' },
                    ],
                    defaultValue: 'text',
                },
                {
                    name: 'required',
                    type: 'checkbox',
                    label: 'Obligatorio',
                    defaultValue: false,
                },
                {
                    name: 'options',
                    type: 'textarea',
                    label: 'Opciones (para selección, una por línea)',
                    admin: {
                        condition: (_, siblingData) => siblingData?.fieldType === 'select',
                    },
                },
            ],
        },
        // Habilitar inscripción directa (sin link externo)
        {
            name: 'enableDirectRegistration',
            type: 'checkbox',
            label: 'Inscripción Directa',
            defaultValue: true,
            admin: {
                position: 'sidebar',
                description: 'Permitir inscripción desde la web (si está desactivado, usar URL externa)',
            },
        },
        // Requiere firma
        {
            name: 'requireSignature',
            type: 'checkbox',
            label: 'Requiere Firma',
            defaultValue: false,
            admin: {
                position: 'sidebar',
                description: 'El inscrito debe firmar digitalmente',
            },
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
