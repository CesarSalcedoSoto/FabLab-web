/**
 * Project Documents Collection - Payload CMS
 * 
 * Documentos técnicos asociados a proyectos: manuales, informes, actas,
 * evaluaciones TRL, etc. Con historial versionado.
 */

import type { CollectionConfig } from 'payload';

const isAuthenticated = ({ req: { user } }: any) => Boolean(user);
const isEditor = ({ req: { user } }: any) =>
    Boolean(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'super_admin');

export const ProjectDocuments: CollectionConfig = {
    slug: 'project-documents',
    labels: {
        singular: 'Documento de Proyecto',
        plural: 'Documentos de Proyecto',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'project', 'documentType', 'version', 'updatedAt'],
        group: 'Proyectos',
        description: 'Documentos técnicos, manuales, informes, actas y evaluaciones TRL',
    },
    access: {
        read: isAuthenticated,
        create: isAuthenticated,
        update: isAuthenticated,
        delete: isEditor,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Título del Documento',
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
            label: 'Proyecto',
            admin: {
                description: 'Proyecto al que pertenece este documento',
            },
        },
        {
            name: 'documentType',
            type: 'select',
            required: true,
            label: 'Tipo de Documento',
            options: [
                { label: 'Documento Técnico', value: 'technical' },
                { label: 'Manual', value: 'manual' },
                { label: 'Informe', value: 'report' },
                { label: 'Acta', value: 'minutes' },
                { label: 'Evaluación TRL', value: 'trl-evaluation' },
                { label: 'Otro', value: 'other' },
            ],
            defaultValue: 'technical',
        },
        {
            name: 'description',
            type: 'textarea',
            label: 'Descripción',
        },
        {
            name: 'file',
            type: 'upload',
            relationTo: 'media',
            required: true,
            label: 'Archivo',
        },
        {
            name: 'version',
            type: 'text',
            label: 'Versión',
            defaultValue: '1.0',
            admin: {
                description: 'Ej: 1.0, 1.1, 2.0',
            },
        },
        {
            name: 'versionNotes',
            type: 'textarea',
            label: 'Notas de Versión',
            admin: {
                description: 'Detalle los cambios en esta versión',
            },
        },
        {
            name: 'previousVersion',
            type: 'relationship',
            relationTo: 'project-documents',
            label: 'Versión Anterior',
            admin: {
                description: 'Enlace al documento previo para mantener historial',
            },
        },
        {
            name: 'uploadedBy',
            type: 'relationship',
            relationTo: 'users',
            label: 'Subido por',
            admin: { position: 'sidebar' },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data, req }) => {
                // Auto-assign current user as uploader
                if (req.user && !data?.uploadedBy) {
                    data = data || {};
                    data.uploadedBy = req.user.id;
                }
                return data;
            },
        ],
    },
    timestamps: true,
};
