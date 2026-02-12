/**
 * Projects Collection - Payload CMS
 * 
 * Proyectos realizados en el FabLab.
 * 
 * @categories (fijas según definición del proyecto)
 * - Hardware: Proyectos de electrónica y mecánica
 * - Software: Proyectos de programación
 * - Diseño: Proyectos de diseño 3D, CAD, gráfico
 * - IoT: Proyectos de Internet de las Cosas
 * 
 * @creators
 * - Pueden ser miembros del equipo (relación) o externos (nombre libre)
 * 
 * @links
 * - Array genérico, el usuario define nombre y URL
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const Projects: CollectionConfig = {
    slug: 'projects',
    labels: {
        singular: 'Proyecto',
        plural: 'Proyectos',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'category', 'status', 'featured', 'updatedAt'],
        group: 'Proyectos',
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
            name: 'category',
            type: 'select',
            required: true,
            label: 'Categoría',
            options: [
                { label: 'Hardware', value: 'Hardware' },
                { label: 'Software', value: 'Software' },
                { label: 'Diseño', value: 'Diseño' },
                { label: 'IoT', value: 'IoT' },
            ],
            defaultValue: 'Hardware',
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            label: 'Descripción',
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
            name: 'gallery',
            type: 'array',
            label: 'Galería',
            fields: [
                {
                    name: 'image',
                    type: 'upload',
                    relationTo: 'media',
                    required: true,
                },
            ],
        },
        {
            name: 'technologies',
            type: 'array',
            label: 'Tecnologías',
            admin: { description: 'Herramientas, lenguajes, materiales utilizados' },
            fields: [
                { name: 'name', type: 'text', required: true },
            ],
        },
        {
            name: 'creators',
            type: 'array',
            label: 'Creadores',
            admin: { description: 'Miembros del equipo o colaboradores externos' },
            fields: [
                {
                    name: 'teamMember',
                    type: 'relationship',
                    relationTo: 'users',
                    label: 'Miembro (Usuario)',
                    admin: { description: 'Selecciona un usuario registrado' },
                },
                {
                    name: 'externalName',
                    type: 'text',
                    label: 'Nombre (si es externo)',
                },
                {
                    name: 'role',
                    type: 'text',
                    label: 'Rol en el proyecto',
                },
            ],
        },
        {
            name: 'links',
            type: 'array',
            label: 'Enlaces',
            admin: { description: 'Repositorio, video, documentación, etc.' },
            fields: [
                { name: 'label', type: 'text', required: true, label: 'Nombre' },
                { name: 'url', type: 'text', required: true, label: 'URL' },
            ],
        },
        // ── Horas de Práctica (datos privados, solo admin) ──
        {
            name: 'practiceHoursEnabled',
            type: 'checkbox',
            label: 'Horas de Práctica Habilitadas',
            defaultValue: false,
            access: {
                read: ({ req: { user } }) => Boolean(user?.role === 'admin' || user?.role === 'editor'),
            },
            admin: { position: 'sidebar', description: 'Activar datos de horas de práctica' },
        },
        {
            name: 'practiceHours',
            type: 'group',
            label: 'Datos de Horas de Práctica',
            access: {
                read: ({ req: { user } }) => Boolean(user?.role === 'admin' || user?.role === 'editor'),
            },
            admin: {
                description: 'Información confidencial de horas de práctica (no visible al público)',
                condition: (data) => Boolean(data?.practiceHoursEnabled),
            },
            fields: [
                {
                    name: 'beneficiaryType',
                    type: 'text',
                    label: 'Tipo de Beneficiario Externo',
                },
                {
                    name: 'institutionName',
                    type: 'text',
                    label: 'Nombre de Institución o Empresa',
                },
                {
                    name: 'institutionRut',
                    type: 'text',
                    label: 'RUT de Institución o Empresa',
                },
                {
                    name: 'email',
                    type: 'email',
                    label: 'Email',
                },
                {
                    name: 'phone',
                    type: 'text',
                    label: 'Teléfono',
                },
                {
                    name: 'commune',
                    type: 'text',
                    label: 'Comuna',
                },
                {
                    name: 'referringOrganization',
                    type: 'text',
                    label: 'Institución / Organización que Deriva al Beneficiario',
                },
                {
                    name: 'specialists',
                    type: 'array',
                    label: 'Especialistas',
                    admin: { description: 'Datos de cada especialista asociado' },
                    fields: [
                        { name: 'firstName', type: 'text', required: true, label: 'Nombres' },
                        { name: 'paternalLastName', type: 'text', required: true, label: 'Apellido Paterno' },
                        { name: 'maternalLastName', type: 'text', label: 'Apellido Materno' },
                        { name: 'rut', type: 'text', required: true, label: 'RUT' },
                    ],
                },
                {
                    name: 'bidireccionEntries',
                    type: 'array',
                    label: 'Beneficiarios Bidirección',
                    admin: { description: 'Datos de beneficiarios para plantilla de bidirección' },
                    fields: [
                        { name: 'tipoBeneficiario', type: 'text', required: true, label: 'Tipo de Beneficiario' },
                        { name: 'rut', type: 'text', required: true, label: 'RUT' },
                        { name: 'firstName', type: 'text', required: true, label: 'Nombres' },
                        { name: 'paternalLastName', type: 'text', required: true, label: 'Apellido Paterno' },
                        { name: 'maternalLastName', type: 'text', label: 'Apellido Materno' },
                        { name: 'rol', type: 'text', required: true, label: 'Rol' },
                        { name: 'horasDocente', type: 'number', label: 'N° Horas Docente' },
                        { name: 'horasEstudiante', type: 'number', label: 'N° Horas Estudiante' },
                    ],
                },
            ],
        },
        {
            name: 'year',
            type: 'number',
            label: 'Año',
            defaultValue: new Date().getFullYear(),
            admin: { position: 'sidebar' },
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
            ],
            defaultValue: 'draft',
            admin: { position: 'sidebar' },
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden',
            defaultValue: 0,
            admin: { position: 'sidebar' },
        },
    ],
};
