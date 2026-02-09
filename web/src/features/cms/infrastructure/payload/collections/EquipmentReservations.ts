/**
 * Equipment Reservations Collection - Payload CMS
 * 
 * Reservas de equipos del FabLab con fecha y horario.
 * Evita conflictos: no se puede reservar un equipo en un horario ya ocupado.
 */

import type { CollectionConfig } from 'payload';

export const EquipmentReservations: CollectionConfig = {
    slug: 'equipment-reservations',
    labels: {
        singular: 'Reserva de Equipo',
        plural: 'Reservas de Equipos',
    },
    admin: {
        useAsTitle: 'equipmentName',
        defaultColumns: ['equipmentName', 'user', 'date', 'startTime', 'endTime', 'status'],
        group: 'Equipamiento',
        description: 'Reservas de equipos con fecha y horario',
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: 'equipmentId',
            type: 'text',
            required: true,
            label: 'ID del Equipo',
            index: true,
        },
        {
            name: 'equipmentName',
            type: 'text',
            required: true,
            label: 'Nombre del Equipo',
        },
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            label: 'Usuario',
        },
        {
            name: 'userName',
            type: 'text',
            label: 'Nombre del Usuario',
        },
        {
            name: 'date',
            type: 'date',
            required: true,
            label: 'Fecha de Reserva',
            index: true,
            admin: {
                date: {
                    pickerAppearance: 'dayOnly',
                    displayFormat: 'dd/MM/yyyy',
                },
            },
        },
        {
            name: 'startTime',
            type: 'text',
            required: true,
            label: 'Hora de Inicio',
            admin: {
                description: 'Formato HH:mm (ej: 07:00, 14:30)',
            },
        },
        {
            name: 'endTime',
            type: 'text',
            required: true,
            label: 'Hora de Fin',
            admin: {
                description: 'Formato HH:mm (ej: 08:00, 16:00)',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción / Motivo',
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'confirmed',
            label: 'Estado',
            options: [
                { label: 'Confirmada', value: 'confirmed' },
                { label: 'Cancelada', value: 'cancelled' },
                { label: 'Completada', value: 'completed' },
            ],
            index: true,
        },
    ],
    timestamps: true,
};
