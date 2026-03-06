/**
 * Meetings Collection - Payload CMS
 * 
 * Reuniones asociadas a proyectos del FabLab.
 * Solo visibles en panel de administración.
 * Solo pueden editar: Admin o Personal Responsable del proyecto.
 * 
 * @states
 * - programada: Reunión futura
 * - cancelada: Reunión cancelada
 * - realizada: Reunión completada
 * 
 * @rules
 * - No permitir crear reuniones en estado "programada" con fecha pasada
 * - Solo admin o responsable del proyecto asociado puede editar
 */

import type { CollectionConfig, Access } from 'payload';

/**
 * Access: Admin o responsable del proyecto asociado
 */
const canManageMeeting: Access = async ({ req: { user, payload }, id }) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // Si hay un ID, verificar si el usuario es responsable del proyecto
    if (id && payload) {
        try {
            const meeting = await payload.findByID({
                collection: 'meetings',
                id,
                depth: 0,
            });
            if (meeting?.project) {
                const project = await payload.findByID({
                    collection: 'projects',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    id: typeof meeting.project === 'object' ? (meeting.project as any).id : meeting.project,
                    depth: 0,
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const responsibleStaff = (project as any)?.responsibleStaff || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return (responsibleStaff as Array<any>).some((staffId: any) => 
                    String(staffId) === String(user.id) || 
                    String(staffId?.id) === String(user.id)
                );
            }
        } catch {
            return false;
        }
    }

    // Para crear, verificar en el hook rather than access
    return user.role === 'editor';
};

export const Meetings: CollectionConfig = {
    slug: 'meetings',
    labels: {
        singular: 'Reunión',
        plural: 'Reuniones',
    },
    admin: {
        useAsTitle: 'description',
        defaultColumns: ['project', 'date', 'time', 'status', 'updatedAt'],
        group: 'Proyectos',
        description: 'Reuniones asociadas a proyectos',
    },
    access: {
        read: ({ req: { user } }) => {
            if (!user) return false;
            return user.role === 'admin' || user.role === 'editor';
        },
        create: ({ req: { user } }) => {
            if (!user) return false;
            return user.role === 'admin' || user.role === 'editor';
        },
        update: canManageMeeting,
        delete: canManageMeeting,
    },
    fields: [
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
            label: 'Proyecto',
            index: true,
        },
        {
            name: 'date',
            type: 'date',
            required: true,
            label: 'Fecha',
            admin: {
                date: { pickerAppearance: 'dayOnly' },
            },
        },
        {
            name: 'time',
            type: 'text',
            required: true,
            label: 'Hora (HH:MM)',
            admin: {
                description: 'Formato 24h. Ej: 14:30',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            required: true,
            label: 'Descripción',
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            label: 'Estado',
            options: [
                { label: 'Programada', value: 'programada' },
                { label: 'Cancelada', value: 'cancelada' },
                { label: 'Realizada', value: 'realizada' },
            ],
            defaultValue: 'programada',
        },
        {
            name: 'notes',
            type: 'textarea',
            label: 'Notas adicionales',
        },
    ],
    hooks: {
        beforeValidate: [
            ({ data, operation }) => {
                if (!data) return data;

                // Validar que reuniones programadas no sean en fecha pasada
                if (data.status === 'programada' && data.date) {
                    // Parse date parts manually to avoid UTC-vs-local timezone issues
                    const parts = String(data.date).slice(0, 10).split('-').map(Number);
                    const meetingDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (operation === 'create' && meetingDate < today) {
                        throw new Error('No se puede crear una reunión programada en una fecha pasada');
                    }
                }

                // Validar formato hora
                if (data.time && !/^\d{2}:\d{2}$/.test(data.time)) {
                    throw new Error('La hora debe estar en formato HH:MM (ej: 14:30)');
                }

                return data;
            },
        ],
    },
    timestamps: true,
};
