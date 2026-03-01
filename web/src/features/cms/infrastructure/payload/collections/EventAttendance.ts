/**
 * EventAttendance Collection - Payload CMS
 * 
 * Registro de asistencia a eventos del FabLab.
 * Vincula inscripciones con su estado de asistencia real.
 */

import type { CollectionConfig } from 'payload';
import { isEditor } from '../access/index.ts';

export const EventAttendance: CollectionConfig = {
    slug: 'event-attendance',
    labels: {
        singular: 'Asistencia',
        plural: 'Asistencias',
    },
    admin: {
        useAsTitle: 'id',
        defaultColumns: ['registration', 'event', 'attended', 'checkInTime'],
        group: 'Eventos',
        description: 'Registro de asistencia a eventos',
    },
    access: {
        read: isEditor,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'event',
            type: 'relationship',
            relationTo: 'events',
            required: true,
            label: 'Evento',
            index: true,
        },
        {
            name: 'registration',
            type: 'relationship',
            relationTo: 'event-registrations',
            required: true,
            label: 'Inscripción',
        },
        {
            name: 'attended',
            type: 'checkbox',
            label: 'Asistió',
            defaultValue: false,
        },
        {
            name: 'checkInTime',
            type: 'date',
            label: 'Hora de Llegada',
            admin: {
                date: { pickerAppearance: 'dayAndTime' },
            },
        },
        {
            name: 'notes',
            type: 'textarea',
            label: 'Observaciones',
        },
    ],
    timestamps: true,
};
