/**
 * Resources Collection - Payload CMS
 * 
 * Documentos, guías, archivos y recursos descargables del FabLab.
 * Soporta visibilidad: público, solo usuarios autenticados, o solo admin.
 */

import type { CollectionConfig, Access } from 'payload';
import { isEditor } from '../access/index.ts';

/**
 * Lectura condicional según visibilidad del recurso:
 * - public: cualquiera
 * - authenticated: solo usuarios logueados
 * - admin: solo admins
 */
const resourceRead: Access = ({ req: { user } }) => {
    if (!user) {
        // Visitantes solo ven recursos públicos
        return { visibility: { equals: 'public' } };
    }
    if ((user as any).role === 'admin') {
        // Admin ve todo
        return true;
    }
    // Usuarios autenticados ven public + authenticated
    return {
        visibility: { in: ['public', 'authenticated'] },
    };
};

export const Resources: CollectionConfig = {
    slug: 'resources',
    labels: {
        singular: 'Recurso',
        plural: 'Recursos',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'type', 'visibility', 'folder', 'updatedAt'],
        group: 'Recursos',
        description: 'Documentos, guías y archivos descargables',
    },
    access: {
        read: resourceRead,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    hooks: {
        beforeChange: [
            ({ data }) => {
                if (data.title && !data.slug) {
                    data.slug = data.title
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
                return data;
            },
        ],
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
            unique: true,
            label: 'Slug',
            admin: {
                position: 'sidebar',
                description: 'URL amigable (se genera automáticamente)',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción',
        },
        {
            name: 'type',
            type: 'select',
            required: true,
            label: 'Tipo',
            options: [
                { label: 'Documento', value: 'document' },
                { label: 'Guía', value: 'guide' },
                { label: 'Tutorial', value: 'tutorial' },
                { label: 'Plantilla', value: 'template' },
                { label: 'Software', value: 'software' },
                { label: 'Otro', value: 'other' },
            ],
            defaultValue: 'document',
        },
        {
            name: 'file',
            type: 'upload',
            relationTo: 'media',
            label: 'Archivo',
            admin: {
                description: 'PDF, ZIP, STL, o cualquier archivo descargable',
            },
        },
        {
            name: 'externalUrl',
            type: 'text',
            label: 'URL Externa',
            admin: {
                description: 'Si el recurso está alojado externamente (Google Drive, etc.)',
            },
        },
        {
            name: 'thumbnail',
            type: 'upload',
            relationTo: 'media',
            label: 'Miniatura',
            admin: { position: 'sidebar' },
        },
        {
            name: 'folder',
            type: 'text',
            label: 'Carpeta',
            admin: {
                description: 'Nombre de carpeta para organizar (ej: "Manuales", "Diseños 3D")',
            },
        },
        {
            name: 'tags',
            type: 'array',
            label: 'Etiquetas',
            admin: { position: 'sidebar' },
            fields: [
                { name: 'tag', type: 'text', label: 'Etiqueta' },
            ],
        },
        {
            name: 'visibility',
            type: 'select',
            required: true,
            label: 'Visibilidad',
            options: [
                { label: 'Público - Visible para todos', value: 'public' },
                { label: 'Usuarios - Solo usuarios registrados', value: 'authenticated' },
                { label: 'Admin - Solo administradores', value: 'admin' },
            ],
            defaultValue: 'public',
            admin: { position: 'sidebar' },
        },
        {
            name: 'downloads',
            type: 'number',
            label: 'Descargas',
            defaultValue: 0,
            admin: { position: 'sidebar', readOnly: true },
        },
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'draft' },
                { label: 'Publicado', value: 'published' },
                { label: 'Archivado', value: 'archived' },
            ],
            defaultValue: 'draft',
            admin: { position: 'sidebar' },
        },
    ],
    timestamps: true,
};
