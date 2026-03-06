/**
 * Users Collection - Payload CMS
 * 
 * Gestiona la autenticación y roles de usuarios del CMS.
 * 
 * @roles
 * - admin: Acceso completo al sistema
 * - editor: Puede crear y editar contenido
 * - author: Solo puede crear contenido propio
 * 
 * @specialist_fields (visibles cuando showInTeam=true)
 * - personalSkills: Habilidades personales (etiquetas)
 * - technicalDomain: Dominio técnico (etiquetas)
 * - availabilityMode: Presencial/Remoto/Híbrido
 * - weeklySchedule: Calendario semanal con rangos horarios
 * - docenteResponsable: Referencia al docente responsable
 */

import type { CollectionConfig } from 'payload';
import { isAdmin, isAdminOrSelf } from '../access/index.ts';

const DAYS_OF_WEEK = [
    { label: 'Lunes', value: 'monday' },
    { label: 'Martes', value: 'tuesday' },
    { label: 'Miércoles', value: 'wednesday' },
    { label: 'Jueves', value: 'thursday' },
    { label: 'Viernes', value: 'friday' },
    { label: 'Sábado', value: 'saturday' },
    { label: 'Domingo', value: 'sunday' },
];

export const Users: CollectionConfig = {
    slug: 'users',
    labels: {
        singular: 'Usuario',
        plural: 'Usuarios',
    },
    auth: {
        tokenExpiration: 604800, // 7 días
        cookies: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        }
    },
    admin: {
        useAsTitle: 'email',
        group: 'Configuración',
    },
    access: {
        read: isAdminOrSelf,
        create: isAdmin,
        update: isAdminOrSelf,
        delete: isAdmin,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            label: 'Nombre',
            required: true,
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'media',
            label: 'Avatar',
        },
        {
            name: 'imagePosition',
            type: 'text',
            label: 'Posición de imagen',
            defaultValue: '50% 50%',
            admin: {
                description: 'Posición X Y en porcentaje (ej: "50% 30%")',
            },
        },
        {
            name: 'bio',
            type: 'textarea',
            label: 'Biografía',
        },
        {
            name: 'jobTitle',
            type: 'text',
            label: 'Cargo / Especialidad',
            admin: {
                description: 'Ej: Ingeniero Electrónico, Diseñador 3D',
            },
        },
        // --- Campos para Sección Equipo ---
        {
            name: 'showInTeam',
            type: 'checkbox',
            label: 'Mostrar en Sección Equipo',
            defaultValue: false,
        },
        {
            name: 'category',
            type: 'select',
            label: 'Categoría de Equipo',
            options: [
                { label: 'Equipo Directivo', value: 'leadership' },
                { label: 'Especialista', value: 'specialist' },
                { label: 'Colaborador', value: 'collaborator' },
                { label: 'Docente Responsable', value: 'docente' },
            ],
            defaultValue: 'specialist',
            admin: {
                condition: (data) => Boolean(data?.showInTeam),
            }
        },
        {
            name: 'docenteResponsable',
            type: 'relationship',
            relationTo: 'users',
            label: 'Docente Responsable',
            admin: {
                description: 'Docente que supervisa a este especialista',
                condition: (data) => Boolean(data?.showInTeam) && data?.category !== 'docente',
            },
        },
        {
            name: 'experience',
            type: 'text',
            label: 'Experiencia (ej: "15+ años")',
            admin: {
                condition: (data) => Boolean(data?.showInTeam),
            }
        },
        {
            name: 'educationStatus',
            type: 'select',
            label: 'Estado de Estudios',
            options: [
                { label: 'Egresado', value: 'graduated' },
                { label: 'Cursando', value: 'studying' },
                { label: 'Titulado', value: 'titled' },
                { label: 'Bachiller', value: 'bachelor' },
                { label: 'Maestría', value: 'masters' },
                { label: 'Doctorado', value: 'doctorate' },
            ],
            defaultValue: 'graduated',
            admin: {
                condition: (data) => Boolean(data?.showInTeam),
            }
        },
        // --- Habilidades y Dominio Técnico ---
        {
            name: 'personalSkills',
            type: 'array',
            label: 'Habilidades Personales',
            admin: {
                description: 'Ej: Trabajo en equipo, Liderazgo, Comunicación',
                condition: (data) => Boolean(data?.showInTeam),
            },
            fields: [
                { name: 'skill', type: 'text', required: true, label: 'Habilidad' },
            ],
        },
        {
            name: 'technicalDomain',
            type: 'array',
            label: 'Dominio Técnico',
            admin: {
                description: 'Ej: Impresión 3D, Arduino, Diseño CAD, Animación',
                condition: (data) => Boolean(data?.showInTeam),
            },
            fields: [
                { name: 'skill', type: 'text', required: true, label: 'Tecnología / Dominio' },
            ],
        },
        // --- Disponibilidad ---
        {
            name: 'availabilityMode',
            type: 'select',
            label: 'Modalidad de Disponibilidad',
            options: [
                { label: 'Presencial', value: 'presencial' },
                { label: 'Remoto', value: 'remoto' },
                { label: 'Híbrido', value: 'hibrido' },
            ],
            admin: {
                condition: (data) => Boolean(data?.showInTeam),
            }
        },
        // --- Calendario Semanal ---
        {
            name: 'weeklySchedule',
            type: 'array',
            label: 'Horario Semanal',
            admin: {
                description: 'Define la disponibilidad por día de la semana',
                condition: (data) => Boolean(data?.showInTeam),
            },
            fields: [
                {
                    name: 'day',
                    type: 'select',
                    required: true,
                    label: 'Día',
                    options: DAYS_OF_WEEK,
                },
                {
                    name: 'active',
                    type: 'checkbox',
                    label: 'Disponible este día',
                    defaultValue: true,
                },
                {
                    name: 'timeRanges',
                    type: 'array',
                    label: 'Rangos Horarios',
                    admin: {
                        condition: (_, siblingData) => Boolean(siblingData?.active),
                    },
                    fields: [
                        {
                            name: 'startTime',
                            type: 'text',
                            required: true,
                            label: 'Hora Inicio (HH:MM)',
                            admin: {
                                description: 'Formato 24h. Ej: 09:00',
                            },
                        },
                        {
                            name: 'endTime',
                            type: 'text',
                            required: true,
                            label: 'Hora Fin (HH:MM)',
                            admin: {
                                description: 'Formato 24h. Ej: 17:00',
                            },
                        },
                    ],
                },
            ],
        },
        // --- Fin campos especialista ---
        {
            name: 'achievements',
            type: 'array',
            label: 'Logros Destacados',
            fields: [
                { name: 'achievement', type: 'text' },
            ],
            admin: {
                condition: (data) => Boolean(data?.showInTeam),
            }
        },
        {
            name: 'order',
            type: 'number',
            label: 'Orden de visualización',
            defaultValue: 99,
            min: 0,
        },
        // ----------------------------------
        {
            name: 'linkedin',
            type: 'text',
            label: 'LinkedIn URL',
        },
        {
            name: 'github',
            type: 'text',
            label: 'GitHub URL',
        },
        {
            name: 'role',
            type: 'select',
            label: 'Rol',
            options: [
                { label: 'Administrador', value: 'admin' },
                { label: 'Editor', value: 'editor' },
                { label: 'Autor', value: 'author' },
                { label: 'Visualizador', value: 'viewer' },
            ],
            defaultValue: 'viewer',
            required: true,
            access: {
                update: ({ req: { user } }) => user?.role === 'admin',
            },
        },
    ],
    timestamps: true,
};
