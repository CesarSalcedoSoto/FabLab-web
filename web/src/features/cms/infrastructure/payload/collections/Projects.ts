/**
 * Projects Collection - Payload CMS
 * 
 * Proyectos realizados en el FabLab.
 * 
 * @categories (fijas - no personalizables)
 * - proyectos-fisicos: Proyectos físicos
 * - proyectos-digitales: Proyectos digitales
 * - diseno: Diseño
 * - animacion: Animación
 * 
 * @responsibleStaff
 * - Solo ellos y admin pueden editar el proyecto y sus reuniones
 * 
 * @technologies
 * - Relación con colección Technologies
 * - Proyectos digitales requieren al menos una tecnología
 * 
 * @beneficiaries
 * - Siempre visibles, no dependen de horas de práctica
 */

import type { CollectionConfig, Access } from 'payload';
import { publicRead } from '../access/index.ts';

/**
 * Access: Admin o responsable del proyecto
 */
const canManageProject: Access = async ({ req: { user, payload }, id }) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    if (id && payload) {
        try {
            const project = await payload.findByID({
                collection: 'projects',
                id,
                depth: 0,
            });
            const responsibleStaff = (project as any)?.responsibleStaff || [];
            return responsibleStaff.some((staffId: any) =>
                String(staffId) === String(user.id) ||
                String(staffId?.id) === String(user.id)
            );
        } catch {
            return false;
        }
    }

    // Para crear: solo admin
    return user.role === 'admin';
};

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
        create: ({ req: { user } }) => user?.role === 'admin',
        update: canManageProject,
        delete: ({ req: { user } }) => user?.role === 'admin',
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
                { label: 'Proyectos Físicos', value: 'proyectos-fisicos' },
                { label: 'Proyectos Digitales', value: 'proyectos-digitales' },
                { label: 'Diseño', value: 'diseno' },
                { label: 'Animación', value: 'animacion' },
            ],
            defaultValue: 'proyectos-fisicos',
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
        // --- Fechas ---
        {
            name: 'startDate',
            type: 'date',
            label: 'Fecha de Inicio',
            admin: {
                date: { pickerAppearance: 'dayOnly' },
            },
        },
        {
            name: 'endDate',
            type: 'date',
            label: 'Fecha de Cierre',
            admin: {
                date: { pickerAppearance: 'dayOnly' },
                description: 'Debe ser posterior a la fecha de inicio',
            },
        },
        // --- Tecnologías (relación con colección Technologies) ---
        {
            name: 'technologies',
            type: 'relationship',
            relationTo: 'technologies',
            hasMany: true,
            label: 'Tecnologías Utilizadas',
            admin: {
                description: 'Selecciona tecnologías del catálogo. Admin puede crear nuevas inline.',
            },
        },
        // --- Personal Responsable ---
        {
            name: 'responsibleStaff',
            type: 'relationship',
            relationTo: 'users',
            hasMany: true,
            label: 'Personal Responsable (Usuarios)',
            admin: {
                description: 'Usuarios registrados que pueden editar este proyecto y sus reuniones',
            },
        },
        {
            name: 'externalStaff',
            type: 'array',
            label: 'Personal Responsable (Externos)',
            admin: {
                description: 'Personas no registradas en el sistema que participan como responsables',
            },
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    label: 'Nombre completo',
                },
                {
                    name: 'role',
                    type: 'text',
                    label: 'Rol / Cargo',
                },
            ],
        },
        // --- Creadores ---
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
        // --- Beneficiarios (siempre visibles, sin depender de practiceHours) ---
        {
            name: 'beneficiaries',
            type: 'array',
            label: 'Beneficiarios',
            admin: {
                description: 'Beneficiarios del proyecto (siempre visible)',
            },
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
    hooks: {
        beforeValidate: [
            ({ data }) => {
                if (!data) return data;

                // Validar fecha cierre >= fecha inicio
                if (data.startDate && data.endDate) {
                    const start = new Date(data.startDate);
                    const end = new Date(data.endDate);
                    if (end < start) {
                        throw new Error('La fecha de cierre no puede ser anterior a la fecha de inicio');
                    }
                }

                // Proyectos digitales requieren al menos una tecnología
                if (data.category === 'proyectos-digitales') {
                    const techs = data.technologies;
                    if (!techs || (Array.isArray(techs) && techs.length === 0)) {
                        throw new Error('Los proyectos digitales deben tener al menos una tecnología');
                    }
                }

                return data;
            },
        ],
    },
};
