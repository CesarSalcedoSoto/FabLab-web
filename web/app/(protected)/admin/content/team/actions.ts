"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";

// ── Tipos ──

export interface TimeRange {
    startTime: string;
    endTime: string;
}

export interface DaySchedule {
    day: string;
    active: boolean;
    timeRanges: TimeRange[];
}

export interface TeamMemberData {
    id: string;
    name: string;
    email: string;
    role: string;
    category: string;
    specialty: string;
    bio: string;
    experience: string;
    educationStatus: string;
    imagePosition: string;
    image: string | null;
    active: boolean;
    userRole: string;
    personalSkills: string[];
    technicalDomain: string[];
    availabilityMode: string;
    weeklySchedule: DaySchedule[];
    docenteResponsable?: { id: string; name: string } | null;
}

export interface SpecialistSearchFilters {
    personalSkills?: string[];
    technicalDomain?: string[];
    availabilityMode?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    query?: string;
}

/**
 * Obtiene TODOS los usuarios para mostrar en la tabla de admin
 * Incluye usuarios con showInTeam = true y false
 */
export async function getAllTeamUsers(): Promise<TeamMemberData[]> {
    try {
        const payload = await getPayload({ config });
        
        const { docs: members } = await payload.find({
            collection: "users",
            depth: 1,
            limit: 100,
            sort: 'name',
        });

        return members.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name || 'Sin nombre',
            email: doc.email,
            role: doc.jobTitle || '',
            category: doc.category || 'specialist',
            specialty: doc.jobTitle || '',
            bio: doc.bio || '',
            experience: doc.experience || '',
            educationStatus: doc.educationStatus || 'graduated',
            imagePosition: doc.imagePosition || '50% 50%',
            image: typeof doc.avatar === 'object' ? doc.avatar?.url : null,
            active: doc.showInTeam === true,
            userRole: doc.role || 'viewer',
            personalSkills: doc.personalSkills?.map((s: any) => s.skill).filter(Boolean) || [],
            technicalDomain: doc.technicalDomain?.map((s: any) => s.skill).filter(Boolean) || [],
            availabilityMode: doc.availabilityMode || '',
            weeklySchedule: doc.weeklySchedule?.map((d: any) => ({
                day: d.day,
                active: d.active ?? true,
                timeRanges: d.timeRanges?.map((r: any) => ({
                    startTime: r.startTime,
                    endTime: r.endTime,
                })) || [],
            })) || [],
            docenteResponsable: doc.docenteResponsable && typeof doc.docenteResponsable === 'object'
                ? { id: String(doc.docenteResponsable.id), name: doc.docenteResponsable.name }
                : null,
        }));
    } catch (error) {
        console.error("[TeamActions] Error obteniendo todos los usuarios:", error);
        return [];
    }
}

/**
 * Obtiene solo los miembros visibles en /equipo (showInTeam = true)
 */
export async function getTeamMembers(): Promise<TeamMemberData[]> {
    try {
        const payload = await getPayload({ config });
        
        const { docs: members } = await payload.find({
            collection: "users",
            depth: 1,
            limit: 100,
            where: {
                showInTeam: { equals: true },
            },
            sort: 'name',
        });

        return members.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            email: doc.email,
            role: doc.jobTitle || '',
            category: doc.category || 'collaborator',
            specialty: doc.jobTitle || '',
            bio: doc.bio || '',
            experience: doc.experience || '',
            educationStatus: doc.educationStatus || 'graduated',
            imagePosition: doc.imagePosition || '50% 50%',
            image: typeof doc.avatar === 'object' ? doc.avatar?.url : doc.avatar,
            active: doc.showInTeam !== false,
            userRole: doc.role,
            personalSkills: doc.personalSkills?.map((s: any) => s.skill).filter(Boolean) || [],
            technicalDomain: doc.technicalDomain?.map((s: any) => s.skill).filter(Boolean) || [],
            availabilityMode: doc.availabilityMode || '',
            weeklySchedule: doc.weeklySchedule?.map((d: any) => ({
                day: d.day,
                active: d.active ?? true,
                timeRanges: d.timeRanges?.map((r: any) => ({
                    startTime: r.startTime,
                    endTime: r.endTime,
                })) || [],
            })) || [],
            docenteResponsable: doc.docenteResponsable && typeof doc.docenteResponsable === 'object'
                ? { id: String(doc.docenteResponsable.id), name: doc.docenteResponsable.name }
                : null,
        }));
    } catch (error) {
        console.error("[TeamActions] Error obteniendo miembros del equipo:", error);
        return [];
    }
}

/**
 * Buscador avanzado de especialistas con filtros combinados
 */
export async function searchSpecialists(filters: SpecialistSearchFilters): Promise<TeamMemberData[]> {
    try {
        const allMembers = await getTeamMembers();

        return allMembers.filter(member => {
            // Filtro por texto libre (nombre, rol, bio)
            if (filters.query) {
                const q = filters.query.toLowerCase();
                const matchesText = member.name.toLowerCase().includes(q) ||
                    member.role.toLowerCase().includes(q) ||
                    member.bio.toLowerCase().includes(q) ||
                    member.personalSkills.some(s => s.toLowerCase().includes(q)) ||
                    member.technicalDomain.some(s => s.toLowerCase().includes(q));
                if (!matchesText) return false;
            }

            // Filtro por habilidades personales
            if (filters.personalSkills && filters.personalSkills.length > 0) {
                const hasSkill = filters.personalSkills.some(skill =>
                    member.personalSkills.some(ms => ms.toLowerCase().includes(skill.toLowerCase()))
                );
                if (!hasSkill) return false;
            }

            // Filtro por dominio técnico
            if (filters.technicalDomain && filters.technicalDomain.length > 0) {
                const hasDomain = filters.technicalDomain.some(domain =>
                    member.technicalDomain.some(md => md.toLowerCase().includes(domain.toLowerCase()))
                );
                if (!hasDomain) return false;
            }

            // Filtro por modalidad
            if (filters.availabilityMode) {
                if (member.availabilityMode !== filters.availabilityMode) return false;
            }

            // Filtro por día y rango horario
            if (filters.day) {
                const daySchedule = member.weeklySchedule.find(d => d.day === filters.day && d.active);
                if (!daySchedule) return false;

                // Si además filtran por horario
                if (filters.startTime && filters.endTime) {
                    const hasOverlap = daySchedule.timeRanges.some(range => {
                        return range.startTime <= filters.endTime! && range.endTime >= filters.startTime!;
                    });
                    if (!hasOverlap) return false;
                }
            }

            return true;
        });
    } catch (error) {
        console.error("[TeamActions] Error buscando especialistas:", error);
        return [];
    }
}

/**
 * Obtiene todas las habilidades y dominios únicos para los filtros
 */
export async function getFilterOptions() {
    try {
        const members = await getTeamMembers();
        const personalSkills = new Set<string>();
        const technicalDomains = new Set<string>();

        members.forEach(m => {
            m.personalSkills.forEach(s => personalSkills.add(s));
            m.technicalDomain.forEach(s => technicalDomains.add(s));
        });

        return {
            personalSkills: Array.from(personalSkills).sort(),
            technicalDomains: Array.from(technicalDomains).sort(),
        };
    } catch (error) {
        console.error("[TeamActions] Error obteniendo opciones de filtro:", error);
        return { personalSkills: [], technicalDomains: [] };
    }
}

export async function createTeamMember(formData: FormData) {
    try {
        const payload = await getPayload({ config });

        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        // Verificar si ya existe un usuario con ese email
        const existing = await payload.find({
            collection: 'users',
            where: {
                email: { equals: email },
            },
            limit: 1,
        });

        if (existing.docs.length > 0) {
            return { success: false, error: 'Ya existe un usuario con ese correo electrónico' };
        }

        // Preparar datos del usuario
        const categoryMap: Record<string, string> = {
            'leadership': 'leadership',
            'leader': 'leadership',
            'specialist': 'specialist',
            'collaborator': 'collaborator',
            'intern': 'collaborator',
            'docente': 'docente',
        };

        const isAdmin = formData.get('isAdmin') === 'true';
        const systemRole = isAdmin ? 'admin' : 'viewer';

        // Parse new array fields from JSON
        const personalSkillsRaw = formData.get('personalSkills') as string;
        const technicalDomainRaw = formData.get('technicalDomain') as string;
        const weeklyScheduleRaw = formData.get('weeklySchedule') as string;

        const personalSkills = personalSkillsRaw
            ? JSON.parse(personalSkillsRaw).map((s: string) => ({ skill: s }))
            : [];
        const technicalDomain = technicalDomainRaw
            ? JSON.parse(technicalDomainRaw).map((s: string) => ({ skill: s }))
            : [];
        const weeklySchedule = weeklyScheduleRaw
            ? JSON.parse(weeklyScheduleRaw)
            : [];

        // Validar horarios: al menos un horario activo y sin superposiciones
        if (weeklySchedule.length > 0) {
            const activeDays = weeklySchedule.filter((d: any) => d.active);
            if (activeDays.length === 0) {
                return { success: false, error: 'El especialista debe tener al menos un día con horario activo' };
            }
            for (const day of activeDays) {
                const ranges = day.timeRanges || [];
                for (const range of ranges) {
                    if (range.endTime <= range.startTime) {
                        return { success: false, error: `Hora fin debe ser mayor que hora inicio en ${day.day}` };
                    }
                }
                // Verificar superposiciones
                for (let i = 0; i < ranges.length; i++) {
                    for (let j = i + 1; j < ranges.length; j++) {
                        if (ranges[i].startTime < ranges[j].endTime && ranges[i].endTime > ranges[j].startTime) {
                            return { success: false, error: `Horarios superpuestos en ${day.day}` };
                        }
                    }
                }
            }
        }

        const data: any = {
            name,
            email,
            password: password || `Fablab${Date.now()}!`,
            jobTitle: formData.get('role') || formData.get('specialty'),
            bio: formData.get('bio'),
            experience: formData.get('experience'),
            category: categoryMap[formData.get('category') as string] || 'specialist',
            educationStatus: formData.get('educationStatus') || 'graduated',
            imagePosition: formData.get('imagePosition') || '50% 50%',
            showInTeam: true,
            order: 0,
            role: systemRole,
            linkedin: formData.get('linkedin'),
            github: formData.get('github'),
            personalSkills,
            technicalDomain,
            availabilityMode: formData.get('availabilityMode') || undefined,
            weeklySchedule,
        };

        // Docente responsable — validar que sea un entero válido (PostgreSQL)
        const docenteId = formData.get('docenteResponsable') as string;
        if (docenteId && /^\d+$/.test(docenteId.trim())) {
            data.docenteResponsable = Number(docenteId.trim());
        }

        // Manejar imagen/avatar
        const file = formData.get('image') as File;
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const mediaDoc = await payload.create({
                collection: 'media',
                data: { alt: name || file.name },
                file: {
                    data: buffer,
                    name: file.name,
                    mimetype: file.type,
                    size: file.size,
                }
            });
            data.avatar = mediaDoc.id;
        }

        await payload.create({ collection: 'users', data });

        revalidatePath('/admin/content/team');
        revalidatePath('/equipo');
        return { success: true };
    } catch (error) {
        console.error("[TeamActions] Error creando miembro del equipo:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function updateTeamMember(id: string, formData: FormData) {
    try {
        const payload = await getPayload({ config });

        const categoryMap: Record<string, string> = {
            'leadership': 'leadership',
            'leader': 'leadership',
            'specialist': 'specialist',
            'collaborator': 'collaborator',
            'intern': 'collaborator',
            'docente': 'docente',
        };

        const isAdmin = formData.get('isAdmin') === 'true';
        const systemRole = isAdmin ? 'admin' : 'viewer';

        // Parse new array fields
        const personalSkillsRaw = formData.get('personalSkills') as string;
        const technicalDomainRaw = formData.get('technicalDomain') as string;
        const weeklyScheduleRaw = formData.get('weeklySchedule') as string;

        const personalSkills = personalSkillsRaw
            ? JSON.parse(personalSkillsRaw).map((s: string) => ({ skill: s }))
            : undefined;
        const technicalDomain = technicalDomainRaw
            ? JSON.parse(technicalDomainRaw).map((s: string) => ({ skill: s }))
            : undefined;
        const weeklySchedule = weeklyScheduleRaw
            ? JSON.parse(weeklyScheduleRaw)
            : undefined;

        // Validar horarios si se proporcionan
        if (weeklySchedule && weeklySchedule.length > 0) {
            for (const day of weeklySchedule.filter((d: any) => d.active)) {
                const ranges = day.timeRanges || [];
                for (const range of ranges) {
                    if (range.endTime <= range.startTime) {
                        return { success: false, error: `Hora fin debe ser mayor que hora inicio en ${day.day}` };
                    }
                }
                for (let i = 0; i < ranges.length; i++) {
                    for (let j = i + 1; j < ranges.length; j++) {
                        if (ranges[i].startTime < ranges[j].endTime && ranges[i].endTime > ranges[j].startTime) {
                            return { success: false, error: `Horarios superpuestos en ${day.day}` };
                        }
                    }
                }
            }
        }

        const data: any = {
            name: formData.get('name'),
            jobTitle: formData.get('role') || formData.get('specialty'),
            bio: formData.get('bio'),
            experience: formData.get('experience'),
            category: categoryMap[formData.get('category') as string] || 'specialist',
            educationStatus: formData.get('educationStatus') || 'graduated',
            imagePosition: formData.get('imagePosition') || '50% 50%',
            showInTeam: formData.get('active') !== 'false',
            role: systemRole,
            linkedin: formData.get('linkedin'),
            github: formData.get('github'),
            availabilityMode: formData.get('availabilityMode') || undefined,
        };

        if (personalSkills) data.personalSkills = personalSkills;
        if (technicalDomain) data.technicalDomain = technicalDomain;
        if (weeklySchedule) data.weeklySchedule = weeklySchedule;

        // Docente responsable — validar que sea un entero válido (PostgreSQL)
        const docenteId = formData.get('docenteResponsable') as string;
        if (docenteId && /^\d+$/.test(docenteId.trim())) {
            data.docenteResponsable = Number(docenteId.trim());
        } else if (formData.has('docenteResponsable') && !docenteId) {
            data.docenteResponsable = null;
        }

        const email = formData.get('email') as string;
        if (email) data.email = email;

        const file = formData.get('image') as File;
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const mediaDoc = await payload.create({
                collection: 'media',
                data: { alt: formData.get('name') || file.name },
                file: {
                    data: buffer,
                    name: file.name,
                    mimetype: file.type,
                    size: file.size,
                }
            });
            data.avatar = mediaDoc.id;
        }

        await payload.update({ collection: 'users', id, data });

        revalidatePath('/admin/content/team');
        revalidatePath('/equipo');
        return { success: true };
    } catch (error) {
        console.error("[TeamActions] Error actualizando miembro del equipo:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function deleteTeamMember(id: string) {
    try {
        const payload = await getPayload({ config });
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            return { success: false, error: `ID inválido: ${id}` };
        }
        
        await payload.delete({
            collection: 'users',
            id: numericId,
        });
        
        revalidatePath('/admin/content/team');
        revalidatePath('/equipo');
        return { success: true };
    } catch (error) {
        console.error("[TeamActions] Error eliminando miembro del equipo:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function toggleTeamMemberStatus(id: string, active: boolean) {
    try {
        const payload = await getPayload({ config });

        await payload.update({
            collection: 'users',
            id,
            data: {
                showInTeam: active,
            },
        });

        revalidatePath('/admin/content/team');
        revalidatePath('/equipo');
        return { success: true };
    } catch (error) {
        console.error("[TeamActions] Error cambiando estado del miembro:", error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}
