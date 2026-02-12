/**
 * TeamMembers Collection - Payload CMS
 * 
 * Miembros del equipo del FabLab.
 * 
 * @categories
 * - leadership: Equipo Directivo
 * - specialist: Especialista técnico
 * - collaborator: Colaborador externo
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isEditor } from '../access/index.ts';

export const TeamMembers: CollectionConfig = {
    slug: 'team-members',
    labels: {
        singular: 'Miembro',
        plural: 'Equipo',
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'role', 'category', 'active', 'updatedAt'],
        group: 'Equipo',
    },
    access: {
        read: publicRead,
        create: isEditor,
        update: isEditor,
        delete: isEditor,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            label: 'Nombre',
        },
        {
            name: 'role',
            type: 'text',
            required: true,
            label: 'Cargo',
        },
        {
            name: 'category',
            type: 'select',
            required: true,
            label: 'Categoría',
            options: [
                { label: 'Equipo Directivo', value: 'leadership' },
                { label: 'Especialista', value: 'specialist' },
                { label: 'Colaborador', value: 'collaborator' },
            ],
            defaultValue: 'specialist',
        },
        {
            name: 'specialty',
            type: 'text',
            label: 'Especialidad',
        },
        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            required: true,
            label: 'Foto de Perfil',
        },
        {
            name: 'bio',
            type: 'textarea',
            label: 'Biografía',
        },
        {
            name: 'experience',
            type: 'text',
            label: 'Experiencia (ej: "15+ años")',
        },
        {
            name: 'achievements',
            type: 'array',
            label: 'Logros Destacados',
            fields: [
                { name: 'achievement', type: 'text' },
            ],
        },
        {
            name: 'social',
            type: 'group',
            label: 'Redes Sociales',
            fields: [
                { name: 'email', type: 'email', label: 'Email Corporativo' },
                { name: 'linkedin', type: 'text', label: 'LinkedIn URL' },
                { name: 'github', type: 'text', label: 'GitHub URL' },
                { name: 'twitter', type: 'text', label: 'Twitter/X URL' },
            ],
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden',
            admin: { position: 'sidebar' },
        },
        {
            name: 'active',
            type: 'checkbox',
            label: 'Activo',
            defaultValue: true,
            admin: { position: 'sidebar' },
        },
    ],
};
