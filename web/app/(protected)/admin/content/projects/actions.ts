"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";
import type { ProjectData } from "./data";


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
            description: doc.description,
            featuredImage: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : null,
            gallery: doc.gallery?.map((g: any) => ({
                id: typeof g.image === 'object' ? String(g.image.id) : String(g.image),
                url: typeof g.image === 'object' ? g.image?.url : null,
                alt: typeof g.image === 'object' ? g.image?.alt : '',
            })).filter((g: any) => g.url) || [],
            technologies: doc.technologies?.map((t: any) => t.name) || [],
            creators: doc.creators?.map((c: any) => ({
                teamMemberId: c.teamMember?.id ? String(c.teamMember.id) : undefined,
                teamMemberName: c.teamMember?.name,
                externalName: c.externalName,
                role: c.role,
            })) || [],
            links: doc.links?.map((l: any) => ({ label: l.label, url: l.url })) || [],
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

        const technologies = (formData.get('technologies') as string || '')
            .split(',').map(t => ({ name: t.trim() })).filter(t => t.name);

        let rawCreators: any[] = [];
        let links: any[] = [];
        try { rawCreators = JSON.parse(formData.get('creators') as string || '[]'); } catch { }
        try { links = JSON.parse(formData.get('links') as string || '[]'); } catch { }

        // Formatear creadores - Payload espera IDs numéricos para relaciones
        const creators = rawCreators.map(c => ({
            ...(c.teamMember ? { teamMember: parseInt(c.teamMember) || null } : {}),
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
        let slug = (formData.get('slug') as string) || title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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
            category: formData.get('category'),
            status: formData.get('status'),
            technologies: technologies.length,
            creators: creators.length,
            links: links.length,
            hasImage: !!featuredImageId,
            galleryCount: gallery.length,
        });

        await payload.create({
            collection: 'projects',
            overrideAccess: true,
            data: {
                title, slug,
                category: formData.get('category') as string || 'Hardware',
                description: formData.get('description') as string,
                year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
                featured: formData.get('featured') === 'true',
                status: formData.get('status') as string || 'draft',
                technologies, 
                creators,
                links,
                practiceHoursEnabled,
                ...(practiceHours && { practiceHours }),
                ...(gallery.length > 0 && { gallery }),
                ...(featuredImageId && { featuredImage: featuredImageId }),
            },
        });

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

        const technologies = (formData.get('technologies') as string || '')
            .split(',').map(t => ({ name: t.trim() })).filter(t => t.name);

        let rawCreators: any[] = [];
        let links: any[] = [];
        try { rawCreators = JSON.parse(formData.get('creators') as string || '[]'); } catch { }
        try { links = JSON.parse(formData.get('links') as string || '[]'); } catch { }

        // Formatear creadores - Payload espera IDs numéricos para relaciones
        const creators = rawCreators.map(c => ({
            ...(c.teamMember ? { teamMember: parseInt(c.teamMember) || null } : {}),
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

        let updateData: any = {
            title: formData.get('title') as string,
            category: formData.get('category') as string,
            description: formData.get('description') as string,
            year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
            featured: formData.get('featured') === 'true',
            status: formData.get('status') as string || 'draft',
            technologies, 
            creators, 
            links,
            gallery,
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
        const project = await payload.findByID({ collection: 'projects', id, overrideAccess: true });
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
