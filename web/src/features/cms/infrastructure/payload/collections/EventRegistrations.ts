/**
 * EventRegistrations Collection - Payload CMS
 * 
 * Inscripciones a eventos del FabLab.
 * Almacena datos de cada inscrito + campos dinámicos definidos por el evento.
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor, isAuthenticated } from '../access/index.ts';

export const EventRegistrations: CollectionConfig = {
    slug: 'event-registrations',
    labels: {
        singular: 'Inscripción',
        plural: 'Inscripciones',
    },
    admin: {
        useAsTitle: 'fullName',
        defaultColumns: ['fullName', 'email', 'event', 'status', 'createdAt'],
        group: 'Eventos',
        description: 'Inscripciones a eventos y talleres',
    },
    access: {
        read: isEditor,
        create: publicRead, // Cualquier persona puede inscribirse
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        // Relación con el evento
        {
            name: 'event',
            type: 'relationship',
            relationTo: 'events',
            required: true,
            label: 'Evento',
            index: true,
        },
        // Datos del inscrito
        {
            name: 'fullName',
            type: 'text',
            required: true,
            label: 'Nombre Completo',
        },
        {
            name: 'lastName',
            type: 'text',
            label: 'Apellidos',
        },
        {
            name: 'email',
            type: 'email',
            required: true,
            label: 'Correo Electrónico',
        },
        {
            name: 'phone',
            type: 'text',
            label: 'Teléfono',
        },
        {
            name: 'institution',
            type: 'text',
            label: 'Institución / Empresa',
        },
        {
            name: 'rut',
            type: 'text',
            label: 'RUT',
        },
        // Campos dinámicos (JSON) - almacena respuestas a campos personalizados del evento
        {
            name: 'customFields',
            type: 'json',
            label: 'Campos Personalizados',
            admin: {
                description: 'Respuestas a los campos dinámicos definidos en el evento',
            },
        },
        // Firma digital (base64)
        {
            name: 'signature',
            type: 'textarea',
            label: 'Firma Digital',
            admin: {
                description: 'Firma del participante (base64)',
            },
        },
        // Estado de la inscripción
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Pendiente', value: 'pending' },
                { label: 'Confirmada', value: 'confirmed' },
                { label: 'Cancelada', value: 'cancelled' },
                { label: 'Lista de espera', value: 'waitlist' },
            ],
            defaultValue: 'confirmed',
            admin: { position: 'sidebar' },
        },
        // Notas del admin
        {
            name: 'notes',
            type: 'textarea',
            label: 'Notas',
            admin: {
                position: 'sidebar',
                description: 'Notas internas del administrador',
            },
        },
    ],
    timestamps: true,
};
