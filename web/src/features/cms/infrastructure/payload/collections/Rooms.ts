/**
 * Rooms Collection - Payload CMS
 *
 * Salas y espacios reservables del FabLab.
 * Los administradores gestionan las salas; todos los autenticados pueden verlas.
 */

import type { CollectionConfig } from 'payload';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isAuthenticated = ({ req: { user } }: any) => Boolean(user);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEditor = ({ req: { user } }: any) =>
    Boolean(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'super_admin');

export const Rooms: CollectionConfig = {
    slug: 'rooms',
    labels: {
        singular: 'Sala',
        plural: 'Salas',
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'location', 'capacity', 'updatedAt'],
        group: 'Reservas',
        description: 'Salas y espacios reservables del FabLab',
    },
    access: {
        read: isAuthenticated,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            label: 'Nombre de la Sala',
        },
        {
            name: 'location',
            type: 'text',
            label: 'Ubicación',
            admin: { description: 'Ej: "Edificio Principal, Piso 2"' },
        },
        {
            name: 'capacity',
            type: 'number',
            required: true,
            label: 'Capacidad (personas)',
            min: 1,
            defaultValue: 10,
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción',
        },
        {
            name: 'amenities',
            type: 'array',
            label: 'Comodidades',
            fields: [
                {
                    name: 'value',
                    type: 'text',
                    required: true,
                    label: 'Comodidad',
                },
            ],
        },
        {
            name: 'equipment',
            type: 'array',
            label: 'Equipos e Insumos',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    label: 'Nombre',
                },
                {
                    name: 'category',
                    type: 'select',
                    required: true,
                    label: 'Categoría',
                    options: [
                        { label: 'Consumible', value: 'consumable' },
                        { label: 'Material', value: 'material' },
                        { label: 'Componente', value: 'component' },
                        { label: 'Herramienta', value: 'tool' },
                        { label: 'Insumo', value: 'supply' },
                        { label: 'Otro', value: 'other' },
                    ],
                    defaultValue: 'tool',
                },
                {
                    name: 'quantity',
                    type: 'number',
                    required: true,
                    label: 'Cantidad',
                    min: 1,
                    defaultValue: 1,
                },
            ],
        },
    ],
    timestamps: true,
};
