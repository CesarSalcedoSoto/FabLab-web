/**
 * Room Reservations Collection - Payload CMS
 *
 * Reservas de salas del FabLab.
 * Cualquier usuario autenticado puede crear y ver reservas.
 * Admins pueden ver/gestionar todas.
 */

import type { CollectionConfig } from 'payload';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAuthenticated = ({ req: { user } }: any) => Boolean(user);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEditor = ({ req: { user } }: any) =>
    Boolean(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'super_admin');

export const RoomReservations: CollectionConfig = {
    slug: 'room-reservations',
    labels: {
        singular: 'Reserva de Sala',
        plural: 'Reservas de Salas',
    },
    admin: {
        useAsTitle: 'purpose',
        defaultColumns: ['room', 'user', 'date', 'startTime', 'endTime', 'createdAt'],
        group: 'Reservas',
        description: 'Reservas de salas y espacios del FabLab',
    },
    access: {
        read: isAuthenticated,
        create: isAuthenticated,
        update: isEditor,
        delete: isAuthenticated,
    },
    fields: [
        {
            name: 'room',
            type: 'relationship',
            relationTo: 'rooms',
            required: true,
            label: 'Sala',
            index: true,
        },
        {
            name: 'roomName',
            type: 'text',
            label: 'Nombre de Sala',
            admin: { description: 'Nombre de la sala al momento de reservar (para historial)' },
        },
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            label: 'Usuario',
            index: true,
        },
        {
            name: 'userName',
            type: 'text',
            label: 'Nombre del Usuario',
            admin: { description: 'Nombre del usuario al momento de reservar (para historial)' },
        },
        {
            name: 'date',
            type: 'text',
            required: true,
            label: 'Fecha (YYYY-MM-DD)',
            index: true,
            admin: { description: 'Formato: 2026-03-10' },
        },
        {
            name: 'startTime',
            type: 'text',
            required: true,
            label: 'Hora Inicio (HH:MM)',
            admin: { description: 'Formato 24h: 09:00' },
        },
        {
            name: 'endTime',
            type: 'text',
            required: true,
            label: 'Hora Fin (HH:MM)',
            admin: { description: 'Formato 24h: 11:00' },
        },
        {
            name: 'purpose',
            type: 'textarea',
            required: true,
            label: 'Motivo de la Reserva',
        },
        {
            name: 'companions',
            type: 'array',
            label: 'Acompañantes',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    label: 'Nombre',
                },
            ],
        },
    ],
    timestamps: true,
};
