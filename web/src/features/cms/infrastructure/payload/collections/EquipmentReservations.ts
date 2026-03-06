/**
 * Equipment Reservations Collection - Payload CMS
 *
 * Reservas de equipos del FabLab.
 * Cualquier usuario autenticado puede reservar un equipo disponible.
 * La descripción/motivo de la reserva es obligatoria.
 *
 * @status
 * - pending: Pendiente (esperando fecha)
 * - active: Activa (en uso por reserva)
 * - completed: Completada
 * - cancelled: Cancelada por el usuario
 */

import type { CollectionConfig } from 'payload';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAuthenticated = ({ req: { user } }: any) => Boolean(user);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEditor = ({ req: { user } }: any) =>
    Boolean(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'super_admin');

export const EquipmentReservations: CollectionConfig = {
    slug: 'equipment-reservations',
    labels: {
        singular: 'Reserva de Equipo',
        plural: 'Reservas de Equipos',
    },
    admin: {
        useAsTitle: 'equipmentName',
        defaultColumns: ['equipmentName', 'user', 'date', 'startTime', 'endTime', 'status', 'createdAt'],
        group: 'Equipamiento',
        description: 'Reservas de equipos del FabLab',
    },
    access: {
        read: isAuthenticated,
        create: isAuthenticated,
        update: isEditor,
        delete: isAuthenticated,
    },
    fields: [
        {
            name: 'equipmentId',
            type: 'text',
            required: true,
            label: 'ID del Equipo',
            index: true,
            admin: { description: 'ID del equipo en la colección equipment' },
        },
        {
            name: 'equipmentName',
            type: 'text',
            required: true,
            label: 'Nombre del Equipo',
            admin: { description: 'Nombre del equipo al momento de reservar (para historial)' },
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
            name: 'description',
            type: 'textarea',
            required: true,
            label: 'Descripción / Motivo',
            admin: { description: 'Descripción obligatoria del uso planificado del equipo' },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'pending',
            label: 'Estado',
            options: [
                { label: 'Pendiente', value: 'pending' },
                { label: 'Activa', value: 'active' },
                { label: 'Completada', value: 'completed' },
                { label: 'Cancelada', value: 'cancelled' },
            ],
            index: true,
        },
    ],
    timestamps: true,
};
