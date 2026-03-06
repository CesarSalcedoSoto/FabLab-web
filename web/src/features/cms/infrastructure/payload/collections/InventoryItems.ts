/**
 * Inventory Items Collection - Payload CMS
 * 
 * Artículos de inventario interno del FabLab (consumibles, materiales, componentes).
 * Solo visible para administradores y usuarios autenticados.
 * 
 * @category
 * - consumable: Consumibles (filamento, resina, etc.)
 * - material: Materiales (madera, acrílico, etc.)
 * - component: Componentes electrónicos
 * - tool: Herramientas menores
 * - supply: Insumos generales
 * - other: Otros
 */

import type { CollectionConfig } from 'payload';

const isAuthenticated = ({ req: { user } }: any) => Boolean(user);
const isEditor = ({ req: { user } }: any) => Boolean(user?.role === 'admin' || user?.role === 'editor');

export const InventoryItems: CollectionConfig = {
    slug: 'inventory-items',
    labels: {
        singular: 'Artículo de Inventario',
        plural: 'Artículos de Inventario',
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'category', 'quantity', 'unit', 'status', 'updatedAt'],
        group: 'Inventario',
        description: 'Gestiona el inventario interno (consumibles, materiales, componentes)',
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
            label: 'Nombre del Artículo',
        },
        {
            name: 'sku',
            type: 'text',
            label: 'Código / SKU',
            unique: true,
            admin: {
                description: 'Código interno del artículo',
            },
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Categoría',
            options: [
                { label: 'Consumible', value: 'consumable' },
                { label: 'Material', value: 'material' },
                { label: 'Componente Electrónico', value: 'component' },
                { label: 'Herramienta', value: 'tool' },
                { label: 'Insumo General', value: 'supply' },
                { label: 'Otro', value: 'other' },
            ],
            defaultValue: 'consumable',
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción',
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            label: 'Imagen',
        },
        {
            name: 'quantity',
            type: 'number',
            required: true,
            label: 'Cantidad en Stock',
            defaultValue: 0,
            min: 0,
        },
        {
            name: 'unit',
            type: 'select',
            label: 'Unidad de Medida',
            options: [
                { label: 'Unidad(es)', value: 'unit' },
                { label: 'Kilogramos', value: 'kg' },
                { label: 'Gramos', value: 'g' },
                { label: 'Metros', value: 'm' },
                { label: 'Centímetros', value: 'cm' },
                { label: 'Litros', value: 'l' },
                { label: 'Mililitros', value: 'ml' },
                { label: 'Rollos', value: 'roll' },
                { label: 'Hojas', value: 'sheet' },
                { label: 'Paquetes', value: 'pack' },
            ],
            defaultValue: 'unit',
        },
        {
            name: 'minimumStock',
            type: 'number',
            label: 'Stock Mínimo',
            defaultValue: 0,
            min: 0,
            admin: {
                description: 'Cantidad mínima antes de alertar',
            },
        },
        {
            name: 'location',
            type: 'relationship',
            relationTo: 'rooms' as any,
            label: 'Ubicación (Sala)',
            admin: {
                description: 'Sala o espacio donde se encuentra este artículo',
            },
        },
        {
            name: 'supplier',
            type: 'text',
            label: 'Proveedor',
        },
        {
            name: 'unitCost',
            type: 'number',
            label: 'Costo Unitario ($)',
            min: 0,
        },
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Disponible', value: 'available' },
                { label: 'Stock Bajo', value: 'low-stock' },
                { label: 'Agotado', value: 'out-of-stock' },
            ],
            defaultValue: 'available',
            admin: { position: 'sidebar' },
        },
        {
            name: 'notes',
            type: 'textarea',
            label: 'Notas',
            admin: {
                description: 'Notas internas sobre este artículo',
            },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                // Auto-update status based on quantity
                if (data && typeof data.quantity === 'number' && typeof data.minimumStock === 'number') {
                    if (data.quantity === 0) {
                        data.status = 'out-of-stock';
                    } else if (data.quantity <= data.minimumStock) {
                        data.status = 'low-stock';
                    } else {
                        data.status = 'available';
                    }
                }
                return data;
            },
        ],
    },
    timestamps: true,
};
