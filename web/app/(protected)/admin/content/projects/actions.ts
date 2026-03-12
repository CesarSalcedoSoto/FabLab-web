"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ProjectData } from "./data";

type AdminUser = { id: string | number; role?: string } | null;

async function getCurrentUser(): Promise<AdminUser> {
    try {
        const payload = await getPayload({ config });
        const cookieStore = await cookies();
        const token = cookieStore.get("payload-token")?.value || cookieStore.get("fablab_token")?.value;
        if (!token) return null;
        const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) });
        return (user as any) || null;
    } catch {
        return null;
    }
}

function isAdmin(user: AdminUser): boolean {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'super_admin';
}

function canManageProject(user: AdminUser, projectDoc: any): boolean {
    if (!user) return false;
    if (isAdmin(user)) return true;
    const responsible = Array.isArray(projectDoc?.responsibleStaff) ? projectDoc.responsibleStaff : [];
    const userId = String(user.id);

    return responsible.some((member: any) => {
        if (member && typeof member === 'object' && member.id != null) return String(member.id) === userId;
        return String(member) === userId;
    });
}

/** Solo acepta cadenas puramente numéricas como IDs de relación (rechaza MongoDB ObjectIds parciales) */
function toRelationId(raw: string): number | null {
    const s = raw.trim();
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    return isNaN(n) ? null : n;
}

function normalizeCategory(category: string): string {
    const map: Record<string, string> = {
        'Hardware': 'proyectos-fisicos',
        'Software': 'proyectos-digitales',
        'Diseño': 'diseno',
        'IoT': 'animacion',
        'Proyectos físicos': 'proyectos-fisicos',
        'Proyectos digitales': 'proyectos-digitales',
        'Animación': 'animacion',
    };
    return map[category] || category;
}

function validateProjectPayload(params: {
    category: string;
    technologies: number[];
    startDate?: string;
    endDate?: string;
    meetings?: Array<{ date?: string; time?: string; status?: string }>;
}): void {
    const { category, technologies, startDate, endDate, meetings = [] } = params;

    if (startDate && endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) {
        throw new Error('La fecha de cierre no puede ser anterior a la fecha de inicio.');
    }

    if (category === 'proyectos-digitales' && technologies.length === 0) {
        throw new Error('Si el proyecto es digital, debe tener al menos una tecnología.');
    }

    const now = new Date();
    for (const meeting of meetings) {
        if (meeting?.status !== 'programada') continue;
        if (!meeting.date || !meeting.time) continue;

        const [h, m] = String(meeting.time).split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) {
            throw new Error('Hora de reunión inválida. Usa formato HH:mm.');
        }
        // Parse date parts to avoid UTC-vs-local timezone issues
        const dateParts = String(meeting.date).slice(0, 10).split('-').map(Number);
        const meetingDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], h, m, 0, 0);
        if (meetingDateTime.getTime() < now.getTime()) {
            throw new Error('Reunión programada no puede estar en fecha/hora pasada.');
        }
    }
}


export async function getProjects(): Promise<ProjectData[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'projects',
            sort: '-featured,order',
            limit: 100,
            depth: 2,
            overrideAccess: true,
        });

        return result.docs.map((doc: any) => ({
            id: String(doc.id),
            title: doc.title,
            slug: doc.slug,
            category: doc.category,
            startDate: doc.startDate,
            endDate: doc.endDate,
            description: doc.description,
            featuredImage: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : null,
            gallery: doc.gallery?.map((g: any) => ({
                id: typeof g.image === 'object' ? String(g.image.id) : String(g.image),
                url: typeof g.image === 'object' ? g.image?.url : null,
                alt: typeof g.image === 'object' ? g.image?.alt : '',
            })).filter((g: any) => g.url) || [],
            technologies: (doc.technologies || []).map((t: any) => {
                if (typeof t === 'object' && t !== null) {
                    return { id: String(t.id), name: t.name || '', category: t.category || '' };
                }
                return { id: String(t), name: '', category: '' };
            }),
            creators: doc.creators?.map((c: any) => ({
                teamMemberId: c.teamMember?.id ? String(c.teamMember.id) : undefined,
                teamMemberName: c.teamMember?.name,
                externalName: c.externalName,
                role: c.role,
            })) || [],
            responsibleStaff: (doc.responsibleStaff || []).map((staff: any) => String(staff?.id || staff)),
            externalStaff: (doc.externalStaff || []).map((s: any) => ({ name: s.name || '', role: s.role || '' })),
            links: doc.links?.map((l: any) => ({ label: l.label, url: l.url })) || [],
            beneficiaries: doc.beneficiaries || [],
            meetings: [], // Meetings are now a separate collection, loaded separately
            year: doc.year || new Date().getFullYear(),
            featured: doc.featured || false,
            status: doc.status || 'draft',
            practiceHoursEnabled: doc.practiceHoursEnabled || false,
            practiceHours: doc.practiceHours ? {
                beneficiaryType: doc.practiceHours.beneficiaryType || '',
                institutionName: doc.practiceHours.institutionName || '',
                institutionRut: doc.practiceHours.institutionRut || '',
                email: doc.practiceHours.email || '',
                phone: doc.practiceHours.phone || '',
                commune: doc.practiceHours.commune || '',
                referringOrganization: doc.practiceHours.referringOrganization || '',
                specialists: doc.practiceHours.specialists?.map((s: any) => ({
                    firstName: s.firstName || '',
                    paternalLastName: s.paternalLastName || '',
                    maternalLastName: s.maternalLastName || '',
                    rut: s.rut || '',
                })) || [],
                bidireccionEntries: doc.practiceHours.bidireccionEntries?.map((b: any) => ({
                    tipoBeneficiario: b.tipoBeneficiario || '',
                    rut: b.rut || '',
                    firstName: b.firstName || '',
                    paternalLastName: b.paternalLastName || '',
                    maternalLastName: b.maternalLastName || '',
                    rol: b.rol || '',
                    horasDocente: b.horasDocente ?? undefined,
                    horasEstudiante: b.horasEstudiante ?? undefined,
                })) || [],
            } : undefined,
        }));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

export async function getTeamMembersForSelect(): Promise<Array<{ id: string; name: string; image?: string; jobTitle?: string }>> {
    try {
        const payload = await getPayload({ config });
        // Usar colección users con showInTeam = true
        const result = await payload.find({
            collection: 'users',
            where: { showInTeam: { equals: true } },
            sort: 'name',
            limit: 100,
            depth: 1,
            overrideAccess: true,
        });
        return result.docs.map((doc: any) => ({ 
            id: String(doc.id), 
            name: doc.name || 'Sin nombre',
            image: typeof doc.avatar === 'object' ? doc.avatar?.url : null,
            jobTitle: doc.jobTitle || '',
        }));
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

export async function createProject(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        if (!isAdmin(currentUser)) {
            return { success: false, error: 'Solo el administrador puede crear proyectos.' };
        }

        // Technologies are now relationship IDs referencing the technologies collection
        const technologiesRaw = (formData.get('technologies') as string || '').split(',').map(t => t.trim()).filter(Boolean);
        const technologyIds = technologiesRaw.map(toRelationId).filter((id): id is number => id !== null);

        let rawCreators: any[] = [];
        let links: any[] = [];
        let responsibleStaffRaw: string[] = [];
        let externalStaffRaw: any[] = [];
        let beneficiaries: any[] = [];
        let meetings: any[] = [];
        try { rawCreators = JSON.parse(formData.get('creators') as string || '[]'); } catch { }
        try { links = JSON.parse(formData.get('links') as string || '[]'); } catch { }
        try { responsibleStaffRaw = JSON.parse(formData.get('responsibleStaff') as string || '[]'); } catch { }
        try { externalStaffRaw = JSON.parse(formData.get('externalStaff') as string || '[]'); } catch { }
        try { beneficiaries = JSON.parse(formData.get('beneficiaries') as string || '[]'); } catch { }
        try { meetings = JSON.parse(formData.get('meetings') as string || '[]'); } catch { }

        // Filtrar links vacíos (label y url son required en la colección)
        links = links.filter((l: any) => l.label?.trim() && l.url?.trim());

        // Filtrar beneficiarios incompletos (tipoBeneficiario, rut, firstName, paternalLastName, rol son required)
        beneficiaries = beneficiaries.filter((b: any) =>
            b.tipoBeneficiario?.trim() && b.rut?.trim() && b.firstName?.trim() && b.paternalLastName?.trim() && b.rol?.trim()
        );

        // Formatear creadores - Payload espera IDs numéricos para relaciones
        const creators = rawCreators.map(c => ({
            ...(c.teamMember ? { teamMember: toRelationId(String(c.teamMember)) } : {}),
            ...(c.externalName ? { externalName: c.externalName } : {}),
            role: c.role || '',
        })).filter(c => c.teamMember || c.externalName);

        // Subir imagen principal
        const imageFile = formData.get('image') as File;
        let featuredImageId: number | undefined;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await payload.create({
                collection: 'media',
                overrideAccess: true,
                data: { alt: formData.get('title') as string },
                file: { data: buffer, mimetype: imageFile.type, name: imageFile.name, size: imageFile.size },
            });
            featuredImageId = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
        }

        // Subir imágenes de galería
        const galleryFiles = formData.getAll('gallery') as File[];
        const existingGalleryIds = formData.get('existingGallery') as string;
        let gallery: { image: number }[] = [];
        
        // Mantener imágenes existentes (convertir a número)
        if (existingGalleryIds) {
            try {
                const ids = JSON.parse(existingGalleryIds);
                gallery = ids.map((id: string) => ({ image: parseInt(id) })).filter((g: any) => !isNaN(g.image));
            } catch { }
        }
        
        // Subir nuevas imágenes
        for (const file of galleryFiles) {
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const uploadResult = await payload.create({
                    collection: 'media',
                    overrideAccess: true,
                    data: { alt: `${formData.get('title')} - galería` },
                    file: { data: buffer, mimetype: file.type, name: file.name, size: file.size },
                });
                const imgId = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
                gallery.push({ image: imgId });
            }
        }

        const title = formData.get('title') as string;
        const category = normalizeCategory((formData.get('category') as string) || 'proyectos-fisicos');
        const startDate = (formData.get('startDate') as string) || undefined;
        const endDate = (formData.get('endDate') as string) || undefined;
        let slug = (formData.get('slug') as string) || title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        validateProjectPayload({ category, technologies: technologyIds, startDate, endDate, meetings });

        const responsibleStaff = responsibleStaffRaw.map((id) => toRelationId(String(id))).filter((id): id is number => id !== null);
        const externalStaff = externalStaffRaw
            .filter((s: any) => s.name?.trim())
            .map((s: any) => ({ name: s.name.trim(), role: s.role?.trim() || '' }));

        // Verificar unicidad del slug y agregar sufijo si ya existe
        const existingSlug = await payload.find({
            collection: 'projects',
            where: { slug: { equals: slug } },
            limit: 1,
            overrideAccess: true,
        });
        if (existingSlug.docs.length > 0) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // Horas de práctica
        const practiceHoursEnabled = formData.get('practiceHoursEnabled') === 'true';
        let practiceHours: any = undefined;
        if (practiceHoursEnabled) {
            try {
                practiceHours = JSON.parse(formData.get('practiceHours') as string || '{}');
            } catch { practiceHours = {}; }
        }

        console.log('[createProject] Creating project with data:', {
            title, slug,
            category,
            status: formData.get('status'),
            technologies: technologyIds.length,
            creators: creators.length,
            links: links.length,
            hasImage: !!featuredImageId,
            galleryCount: gallery.length,
        });

        const projectResult = await payload.create({
            collection: 'projects',
            overrideAccess: true,
            data: {
                title, slug,
                category,
                ...(startDate ? { startDate } : {}),
                ...(endDate ? { endDate } : {}),
                description: formData.get('description') as string,
                year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
                featured: formData.get('featured') === 'true',
                status: formData.get('status') as string || 'draft',
                technologies: technologyIds, 
                creators,
                responsibleStaff,
                externalStaff,
                links,
                beneficiaries,
                practiceHoursEnabled,
                ...(practiceHours && { practiceHours }),
                ...(gallery.length > 0 && { gallery }),
                ...(featuredImageId && { featuredImage: featuredImageId }),
            },
        });

        // Create meetings in separate collection
        const projectId = typeof projectResult.id === 'number' ? projectResult.id : parseInt(String(projectResult.id));
        for (const meeting of meetings) {
            if (!meeting.date) continue;
            await payload.create({
                collection: 'meetings',
                overrideAccess: true,
                data: {
                    project: projectId,
                    date: meeting.date,
                    time: meeting.time || '09:00',
                    description: meeting.description || '',
                    status: meeting.status || 'programada',
                    notes: meeting.notes || '',
                },
            });
        }

        revalidatePath('/admin/content/projects');
        revalidatePath('/proyectos');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating project:', error);
        const errorMessage = error?.data?.errors?.[0]?.message || error.message || 'Error desconocido al crear proyecto';
        return { success: false, error: errorMessage };
    }
}

export async function updateProject(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();

        const existingProject = await payload.findByID({
            collection: 'projects',
            id,
            depth: 1,
            overrideAccess: true,
        });

        if (!canManageProject(currentUser, existingProject)) {
            return { success: false, error: 'No tienes permisos para editar este proyecto.' };
        }

        // Technologies as relationship IDs
        const technologiesRaw = (formData.get('technologies') as string || '').split(',').map(t => t.trim()).filter(Boolean);
        const technologyIds = technologiesRaw.map(toRelationId).filter((id): id is number => id !== null);

        let rawCreators: any[] = [];
        let links: any[] = [];
        let responsibleStaffRaw: string[] = [];
        let externalStaffRaw: any[] = [];
        let beneficiaries: any[] = [];
        let meetings: any[] = [];
        try { rawCreators = JSON.parse(formData.get('creators') as string || '[]'); } catch { }
        try { links = JSON.parse(formData.get('links') as string || '[]'); } catch { }
        try { responsibleStaffRaw = JSON.parse(formData.get('responsibleStaff') as string || '[]'); } catch { }
        try { externalStaffRaw = JSON.parse(formData.get('externalStaff') as string || '[]'); } catch { }
        try { beneficiaries = JSON.parse(formData.get('beneficiaries') as string || '[]'); } catch { }
        try { meetings = JSON.parse(formData.get('meetings') as string || '[]'); } catch { }

        // Filtrar links vacíos (label y url son required en la colección)
        links = links.filter((l: any) => l.label?.trim() && l.url?.trim());

        // Filtrar beneficiarios incompletos (tipoBeneficiario, rut, firstName, paternalLastName, rol son required)
        beneficiaries = beneficiaries.filter((b: any) =>
            b.tipoBeneficiario?.trim() && b.rut?.trim() && b.firstName?.trim() && b.paternalLastName?.trim() && b.rol?.trim()
        );

        if (!isAdmin(currentUser)) {
            // Non-admin: check they're only using existing technology IDs, not adding new ones
            const existingTechIds = new Set(
                ((existingProject as any)?.technologies || []).map((t: any) =>
                    typeof t === 'object' ? String(t.id) : String(t)
                )
            );
            const isAddingNewTech = technologyIds.some((id) => !existingTechIds.has(String(id)));
            if (isAddingNewTech) {
                return { success: false, error: 'Solo el administrador puede asignar nuevas tecnologías.' };
            }
        }

        // Formatear creadores - Payload espera IDs numéricos para relaciones
        const creators = rawCreators.map(c => ({
            ...(c.teamMember ? { teamMember: toRelationId(String(c.teamMember)) } : {}),
            ...(c.externalName ? { externalName: c.externalName } : {}),
            role: c.role || '',
        })).filter(c => c.teamMember || c.externalName);

        // Manejar galería
        const galleryFiles = formData.getAll('gallery') as File[];
        const existingGalleryIds = formData.get('existingGallery') as string;
        let gallery: { image: number }[] = [];
        
        // Mantener imágenes existentes (convertir a número)
        if (existingGalleryIds) {
            try {
                const ids = JSON.parse(existingGalleryIds);
                gallery = ids.map((id: string) => ({ image: parseInt(id) })).filter((g: any) => !isNaN(g.image));
            } catch { }
        }
        
        // Subir nuevas imágenes
        for (const file of galleryFiles) {
            if (file && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const uploadResult = await payload.create({
                    collection: 'media',
                    overrideAccess: true,
                    data: { alt: `${formData.get('title')} - galería` },
                    file: { data: buffer, mimetype: file.type, name: file.name, size: file.size },
                });
                const imgId = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
                gallery.push({ image: imgId });
            }
        }

        // Horas de práctica
        const practiceHoursEnabled = formData.get('practiceHoursEnabled') === 'true';
        let practiceHours: any = undefined;
        if (practiceHoursEnabled) {
            try {
                practiceHours = JSON.parse(formData.get('practiceHours') as string || '{}');
            } catch { practiceHours = {}; }
        }

        const category = normalizeCategory((formData.get('category') as string) || 'proyectos-fisicos');
        const startDate = (formData.get('startDate') as string) || undefined;
        const endDate = (formData.get('endDate') as string) || undefined;
        validateProjectPayload({ category, technologies: technologyIds, startDate, endDate, meetings });

        const responsibleStaff = responsibleStaffRaw.map((staffId) => toRelationId(String(staffId))).filter((id): id is number => id !== null);
        const externalStaff = externalStaffRaw
            .filter((s: any) => s.name?.trim())
            .map((s: any) => ({ name: s.name.trim(), role: s.role?.trim() || '' }));

        let updateData: any = {
            title: formData.get('title') as string,
            category,
            ...(startDate ? { startDate } : { startDate: null }),
            ...(endDate ? { endDate } : { endDate: null }),
            description: formData.get('description') as string,
            year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
            featured: formData.get('featured') === 'true',
            status: formData.get('status') as string || 'draft',
            technologies: technologyIds, 
            creators, 
            responsibleStaff,
            externalStaff,
            links,
            gallery,
            beneficiaries,
            practiceHoursEnabled,
            ...(practiceHours && { practiceHours }),
        };

        const slug = formData.get('slug') as string;
        if (slug) updateData.slug = slug;

        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await payload.create({
                collection: 'media',
                overrideAccess: true,
                data: { alt: formData.get('title') as string },
                file: { data: buffer, mimetype: imageFile.type, name: imageFile.name, size: imageFile.size },
            });
            const imgId = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
            updateData.featuredImage = imgId;
        }

        await payload.update({ collection: 'projects', id, data: updateData, overrideAccess: true });

        // Sync meetings: delete existing and recreate from form data
        const projectIdNum = parseInt(String(id), 10);
        const existingMeetings = await payload.find({
            collection: 'meetings',
            where: { project: { equals: projectIdNum } },
            limit: 200,
            overrideAccess: true,
        });
        for (const existing of existingMeetings.docs) {
            await payload.delete({ collection: 'meetings', id: existing.id, overrideAccess: true });
        }
        for (const meeting of meetings) {
            if (!meeting.date) continue;
            await payload.create({
                collection: 'meetings',
                overrideAccess: true,
                data: {
                    project: projectIdNum,
                    date: meeting.date,
                    time: meeting.time || '09:00',
                    description: meeting.description || '',
                    status: meeting.status || 'programada',
                    notes: meeting.notes || '',
                },
            });
        }

        revalidatePath('/admin/content/projects');
        revalidatePath('/proyectos');
        return { success: true };
    } catch (error: any) {
        console.error('[updateProject] Error:', error);
        const errorMessage = error?.data?.errors?.[0]?.message || error.message || 'Error desconocido al actualizar proyecto';
        return { success: false, error: errorMessage };
    }
}

export async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        const project = await payload.findByID({ collection: 'projects', id, depth: 1, overrideAccess: true });
        if (!canManageProject(currentUser, project)) {
            return { success: false, error: 'No tienes permisos para eliminar este proyecto.' };
        }
        await payload.delete({ collection: 'projects', id, overrideAccess: true });
        revalidatePath('/admin/content/projects');
        revalidatePath('/proyectos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleProjectFeatured(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        const project = await payload.findByID({ collection: 'projects', id, overrideAccess: true });
        if (!canManageProject(currentUser, project)) {
            return { success: false, error: 'No tienes permisos para editar este proyecto.' };
        }
        await payload.update({ collection: 'projects', id, data: { featured: !project.featured }, overrideAccess: true });
        revalidatePath('/admin/content/projects');
        revalidatePath('/proyectos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateProjectStatus(id: string, status: 'draft' | 'published'): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('[updateProjectStatus] Updating project', id, 'to status', status);
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        const project = await payload.findByID({ collection: 'projects', id, depth: 1, overrideAccess: true });
        if (!canManageProject(currentUser, project)) {
            return { success: false, error: 'No tienes permisos para editar este proyecto.' };
        }
        await payload.update({ collection: 'projects', id, data: { status }, overrideAccess: true });
        console.log('[updateProjectStatus] Update successful');
        revalidatePath('/admin/content/projects');
        revalidatePath('/proyectos');
        return { success: true };
    } catch (error: any) {
        console.error('[updateProjectStatus] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function exportProjectsToExcel(projectIds: string[], template: 'contribucion' | 'bidireccion' = 'contribucion'): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FabLab Admin';
        workbook.created = new Date();

        const isContribucion = template === 'contribucion';
        const sheetName = isContribucion ? 'Plantilla de Contribución' : 'Plantilla de Bidirección';
        const sheet = workbook.addWorksheet(sheetName);

        if (isContribucion) {
            // ── Plantilla de Contribución (la original) ──
            sheet.columns = [
                { header: 'Proyecto', key: 'proyecto', width: 30 },
                { header: 'Categoría', key: 'categoria', width: 15 },
                { header: 'Año', key: 'ano', width: 8 },
                { header: 'Estado', key: 'estado', width: 12 },
                { header: 'Tipo de Beneficiario Externo', key: 'tipoBeneficiario', width: 28 },
                { header: 'Nombre de Institución o Empresa', key: 'institucion', width: 32 },
                { header: 'RUT de Institución o Empresa', key: 'rutInstitucion', width: 25 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Comuna', key: 'comuna', width: 18 },
                { header: 'Institución que Deriva', key: 'organizacionDeriva', width: 30 },
                { header: 'Nombres del Especialista', key: 'nombresEspecialista', width: 25 },
                { header: 'Apellido Paterno', key: 'apellidoPaterno', width: 20 },
                { header: 'Apellido Materno', key: 'apellidoMaterno', width: 20 },
                { header: 'RUT del Especialista', key: 'rutEspecialista', width: 18 },
            ];
        } else {
            // ── Plantilla de Bidirección ──
            sheet.columns = [
                { header: 'Proyecto', key: 'proyecto', width: 30 },
                { header: 'Tipo de Beneficiario', key: 'tipoBeneficiario', width: 25 },
                { header: 'RUT', key: 'rut', width: 18 },
                { header: 'Nombres', key: 'nombres', width: 25 },
                { header: 'Apellido Paterno', key: 'apellidoPaterno', width: 20 },
                { header: 'Apellido Materno', key: 'apellidoMaterno', width: 20 },
                { header: 'Rol', key: 'rol', width: 25 },
                { header: 'N° Horas Docente', key: 'horasDocente', width: 18 },
                { header: 'N° Horas Estudiante', key: 'horasEstudiante', width: 18 },
            ];
        }

        // Estilos del encabezado
        const headerColor = isContribucion ? 'FFEA580C' : 'FF2563EB'; // naranja / azul
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        sheet.getRow(1).height = 30;

        for (const projectId of projectIds) {
            try {
                const doc = await payload.findByID({
                    collection: 'projects',
                    id: projectId,
                    depth: 2,
                    overrideAccess: true,
                });

                const ph = (doc as any).practiceHours;
                const phEnabled = (doc as any).practiceHoursEnabled;
                const specialists = ph?.specialists || [];

                if (isContribucion) {
                    if (specialists.length > 0) {
                        for (const specialist of specialists) {
                            sheet.addRow({
                                proyecto: doc.title,
                                categoria: doc.category,
                                ano: doc.year,
                                estado: doc.status === 'published' ? 'Publicado' : 'Borrador',
                                tipoBeneficiario: ph?.beneficiaryType || '',
                                institucion: ph?.institutionName || '',
                                rutInstitucion: ph?.institutionRut || '',
                                email: ph?.email || '',
                                telefono: ph?.phone || '',
                                comuna: ph?.commune || '',
                                organizacionDeriva: ph?.referringOrganization || '',
                                nombresEspecialista: specialist.firstName || '',
                                apellidoPaterno: specialist.paternalLastName || '',
                                apellidoMaterno: specialist.maternalLastName || '',
                                rutEspecialista: specialist.rut || '',
                            });
                        }
                    } else {
                        sheet.addRow({
                            proyecto: doc.title,
                            categoria: doc.category,
                            ano: doc.year,
                            estado: doc.status === 'published' ? 'Publicado' : 'Borrador',
                            tipoBeneficiario: phEnabled ? (ph?.beneficiaryType || '') : 'N/A',
                            institucion: phEnabled ? (ph?.institutionName || '') : 'N/A',
                            rutInstitucion: phEnabled ? (ph?.institutionRut || '') : '',
                            email: phEnabled ? (ph?.email || '') : '',
                            telefono: phEnabled ? (ph?.phone || '') : '',
                            comuna: phEnabled ? (ph?.commune || '') : '',
                            organizacionDeriva: phEnabled ? (ph?.referringOrganization || '') : '',
                            nombresEspecialista: '',
                            apellidoPaterno: '',
                            apellidoMaterno: '',
                            rutEspecialista: '',
                        });
                    }
                } else {
                    // Bidirección
                    const bidireccionEntries = ph?.bidireccionEntries || [];
                    if (bidireccionEntries.length > 0) {
                        for (const entry of bidireccionEntries) {
                            sheet.addRow({
                                proyecto: doc.title,
                                tipoBeneficiario: entry.tipoBeneficiario || '',
                                rut: entry.rut || '',
                                nombres: entry.firstName || '',
                                apellidoPaterno: entry.paternalLastName || '',
                                apellidoMaterno: entry.maternalLastName || '',
                                rol: entry.rol || '',
                                horasDocente: entry.horasDocente ?? '',
                                horasEstudiante: entry.horasEstudiante ?? '',
                            });
                        }
                    } else {
                        sheet.addRow({
                            proyecto: doc.title,
                            tipoBeneficiario: '',
                            rut: '',
                            nombres: '',
                            apellidoPaterno: '',
                            apellidoMaterno: '',
                            rol: '',
                            horasDocente: '',
                            horasEstudiante: '',
                        });
                    }
                }
            } catch (err) {
                console.error(`Error fetching project ${projectId}:`, err);
            }
        }

        // Aplicar bordes y alineación a todas las filas de datos
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.alignment = { vertical: 'middle', wrapText: true };
            }
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const prefix = isContribucion ? 'contribucion' : 'bidireccion';
        const filename = `${prefix}_${new Date().toISOString().split('T')[0]}.xlsx`;

        return { success: true, data: base64, filename };
    } catch (error: any) {
        console.error('Error exporting to Excel:', error);
        return { success: false, error: error.message };
    }
}

// ── Technologies helpers ──

export async function getTechnologies(): Promise<Array<{ id: string; name: string; category: string }>> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'technologies',
            sort: 'name',
            limit: 200,
            overrideAccess: true,
        });
        return result.docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            category: doc.category || 'other',
        }));
    } catch (error) {
        console.error('Error fetching technologies:', error);
        return [];
    }
}

export async function createTechnology(name: string, category: string = 'other'): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        if (!isAdmin(currentUser)) {
            return { success: false, error: 'Solo el administrador puede crear tecnologías.' };
        }
        const doc = await payload.create({
            collection: 'technologies',
            overrideAccess: true,
            data: { name, category },
        });
        return { success: true, id: String(doc.id) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ── Meetings CRUD ──

export async function getProjectMeetings(projectId: string): Promise<Array<{ id: string; date: string; time: string; description: string; status: string; notes: string }>> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'meetings',
            where: { project: { equals: parseInt(projectId, 10) } },
            sort: '-date',
            limit: 100,
            overrideAccess: true,
        });
        return result.docs.map((doc: any) => ({
            id: String(doc.id),
            date: doc.date,
            time: doc.time || '',
            description: doc.description || '',
            status: doc.status || 'programada',
            notes: doc.notes || '',
        }));
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return [];
    }
}

export async function createMeeting(projectId: string, data: {
    date: string;
    time: string;
    description: string;
    status?: string;
    notes?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 1, overrideAccess: true });
        if (!canManageProject(currentUser, project)) {
            return { success: false, error: 'No tienes permisos para crear reuniones en este proyecto.' };
        }

        await payload.create({
            collection: 'meetings',
            overrideAccess: true,
            data: {
                project: parseInt(projectId, 10),
                date: data.date,
                time: data.time,
                description: data.description,
                status: data.status || 'programada',
                notes: data.notes || '',
            },
        });

        revalidatePath('/admin/content/projects');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateMeeting(meetingId: string, data: {
    date?: string;
    time?: string;
    description?: string;
    status?: string;
    notes?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        const meeting = await payload.findByID({ collection: 'meetings', id: meetingId, depth: 1, overrideAccess: true });
        const projectId = typeof (meeting as any).project === 'object' ? (meeting as any).project.id : (meeting as any).project;
        const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 1, overrideAccess: true });
        if (!canManageProject(currentUser, project)) {
            return { success: false, error: 'No tienes permisos para editar esta reunión.' };
        }

        await payload.update({ collection: 'meetings', id: meetingId, data, overrideAccess: true });
        revalidatePath('/admin/content/projects');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteMeeting(meetingId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const currentUser = await getCurrentUser();
        const meeting = await payload.findByID({ collection: 'meetings', id: meetingId, depth: 1, overrideAccess: true });
        const projectId = typeof (meeting as any).project === 'object' ? (meeting as any).project.id : (meeting as any).project;
        const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 1, overrideAccess: true });
        if (!canManageProject(currentUser, project)) {
            return { success: false, error: 'No tienes permisos para eliminar esta reunión.' };
        }

        await payload.delete({ collection: 'meetings', id: meetingId, overrideAccess: true });
        revalidatePath('/admin/content/projects');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
