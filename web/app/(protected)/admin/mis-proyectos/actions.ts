"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from "payload";
import config from "@payload-config";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getCurrentUser() {
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

// ── Types ──

export interface MyProjectData {
    id: string;
    title: string;
    slug: string;
    category: string;
    description: string;
    status: string;
    featuredImage: string | null;
    startDate?: string;
    endDate?: string;
    year: number;
    technologies: string[];
    creators: { name: string; role: string }[];
    links: { label: string; url: string }[];
    meetings: { id: string; date: string; time: string; description: string; status: string }[];
    documents: ProjectDocumentData[];
}

export interface ProjectDocumentData {
    id: string;
    title: string;
    documentType: string;
    description: string;
    version: string;
    versionNotes: string;
    fileUrl: string | null;
    fileName: string | null;
    uploadedBy: string;
    previousVersionId: string | null;
    createdAt: string;
    updatedAt: string;
}

// DOCUMENT_TYPES moved to page.tsx ("use server" files can only export async functions)

export async function getDocumentTypes(): Promise<Record<string, string>> {
    return {
        technical: "Documento Técnico",
        manual: "Manual",
        report: "Informe",
        minutes: "Acta",
        "trl-evaluation": "Evaluación TRL",
        other: "Otro",
    };
}

// ── Get My Projects ──

export async function getMyProjects(): Promise<MyProjectData[]> {
    try {
        const user = await getCurrentUser();
        if (!user) return [];
        const payload = await getPayload({ config });

        const isAdmin = user.role === 'admin' || user.role === 'super_admin';

        let projectDocs: any[];

        if (isAdmin) {
            // Admins see all projects
            const result = await payload.find({
                collection: 'projects',
                sort: '-createdAt',
                limit: 200,
                depth: 2,
                overrideAccess: true,
            });
            projectDocs = result.docs;
        } else {
            // Non-admins see only projects where they are responsible staff or creator
            const result = await payload.find({
                collection: 'projects',
                sort: '-createdAt',
                limit: 200,
                depth: 2,
                overrideAccess: true,
            });

            projectDocs = result.docs.filter((doc: any) => {
                // Check if user is in responsibleStaff
                const responsible = Array.isArray(doc.responsibleStaff) ? doc.responsibleStaff : [];
                const isResponsible = responsible.some((s: any) => {
                    const staffId = typeof s === 'object' ? String(s.id) : String(s);
                    return staffId === String(user.id);
                });

                // Check if user is a creator (teamMember)
                const creators = Array.isArray(doc.creators) ? doc.creators : [];
                const isCreator = creators.some((c: any) => {
                    const memberId = typeof c.teamMember === 'object' ? String(c.teamMember?.id) : String(c.teamMember);
                    return memberId === String(user.id);
                });

                return isResponsible || isCreator;
            });
        }

        // Get all documents for these projects
        const projectIds = projectDocs.map((d: any) => d.id);
        const documentsMap: Record<string, ProjectDocumentData[]> = {};

        if (projectIds.length > 0) {
            const docsResult = await payload.find({
                collection: 'project-documents',
                where: { project: { in: projectIds } },
                sort: '-createdAt',
                limit: 500,
                depth: 1,
                overrideAccess: true,
            });

            for (const doc of docsResult.docs) {
                const projId = typeof (doc as any).project === 'object' ? String((doc as any).project.id) : String((doc as any).project);
                if (!documentsMap[projId]) documentsMap[projId] = [];
                documentsMap[projId].push({
                    id: String(doc.id),
                    title: (doc as any).title,
                    documentType: (doc as any).documentType || 'other',
                    description: (doc as any).description || '',
                    version: (doc as any).version || '1.0',
                    versionNotes: (doc as any).versionNotes || '',
                    fileUrl: typeof (doc as any).file === 'object' ? (doc as any).file?.url : null,
                    fileName: typeof (doc as any).file === 'object' ? (doc as any).file?.filename : null,
                    uploadedBy: typeof (doc as any).uploadedBy === 'object' ? (doc as any).uploadedBy?.name || 'Desconocido' : 'Desconocido',
                    previousVersionId: typeof (doc as any).previousVersion === 'object' ? String((doc as any).previousVersion?.id) : (doc as any).previousVersion ? String((doc as any).previousVersion) : null,
                    createdAt: (doc as any).createdAt,
                    updatedAt: (doc as any).updatedAt,
                });
            }
        }

        // Get meetings
        const meetingsMap: Record<string, { id: string; date: string; time: string; description: string; status: string }[]> = {};
        if (projectIds.length > 0) {
            const meetingsResult = await payload.find({
                collection: 'meetings',
                where: { project: { in: projectIds } },
                sort: '-date',
                limit: 500,
                overrideAccess: true,
            });
            for (const m of meetingsResult.docs) {
                const projId = typeof (m as any).project === 'object' ? String((m as any).project.id) : String((m as any).project);
                if (!meetingsMap[projId]) meetingsMap[projId] = [];
                meetingsMap[projId].push({
                    id: String(m.id),
                    date: (m as any).date,
                    time: (m as any).time || '',
                    description: (m as any).description || '',
                    status: (m as any).status || 'programada',
                });
            }
        }

        return projectDocs.map((doc: any) => ({
            id: String(doc.id),
            title: doc.title,
            slug: doc.slug,
            category: doc.category,
            description: doc.description || '',
            status: doc.status || 'draft',
            featuredImage: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : null,
            startDate: doc.startDate,
            endDate: doc.endDate,
            year: doc.year || new Date().getFullYear(),
            technologies: (doc.technologies || []).map((t: any) => typeof t === 'object' ? t.name : '').filter(Boolean),
            creators: (doc.creators || []).map((c: any) => {
                const member = c.teamMember;
                if (member && typeof member === 'object') {
                    return { name: member.name || 'Sin nombre', role: c.role || '' };
                }
                return { name: c.externalName || '', role: c.role || '' };
            }),
            links: (doc.links || []).map((l: any) => ({ label: l.label || '', url: l.url || '' })),
            meetings: meetingsMap[String(doc.id)] || [],
            documents: documentsMap[String(doc.id)] || [],
        }));
    } catch (error) {
        console.error('Error fetching my projects:', error);
        return [];
    }
}

// ── Upload Document ──

export async function uploadProjectDocument(
    projectId: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'No autenticado' };

        const payload = await getPayload({ config });

        // Check user has access to this project
        const project = await payload.findByID({ collection: 'projects', id: projectId, depth: 1, overrideAccess: true });
        const responsible = Array.isArray((project as any).responsibleStaff) ? (project as any).responsibleStaff : [];
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';
        const isResponsible = responsible.some((s: any) => {
            const staffId = typeof s === 'object' ? String(s.id) : String(s);
            return staffId === String(user.id);
        });
        const creators = Array.isArray((project as any).creators) ? (project as any).creators : [];
        const isCreator = creators.some((c: any) => {
            const memberId = typeof c.teamMember === 'object' ? String(c.teamMember?.id) : String(c.teamMember);
            return memberId === String(user.id);
        });

        if (!isAdmin && !isResponsible && !isCreator) {
            return { success: false, error: 'No tienes permisos para subir documentos a este proyecto.' };
        }

        const file = formData.get('file') as File;
        if (!file || file.size === 0) return { success: false, error: 'No se proporcionó un archivo' };

        const title = (formData.get('title') as string) || file.name;
        const documentType = ((formData.get('documentType') as string) || 'technical') as 'technical' | 'manual' | 'report' | 'minutes' | 'trl-evaluation' | 'other';
        const description = (formData.get('description') as string) || '';
        const version = (formData.get('version') as string) || '1.0';
        const versionNotes = (formData.get('versionNotes') as string) || '';
        const previousVersionId = (formData.get('previousVersion') as string) || undefined;

        // Upload file to media
        const buffer = Buffer.from(await file.arrayBuffer());
        const mediaResult = await payload.create({
            collection: 'media',
            overrideAccess: true,
            data: { alt: title },
            file: { data: buffer, mimetype: file.type, name: file.name, size: file.size },
        });

        // Create document record
        await payload.create({
            collection: 'project-documents',
            overrideAccess: true,
            data: {
                title,
                project: parseInt(projectId, 10),
                documentType,
                description,
                file: typeof mediaResult.id === 'number' ? mediaResult.id : parseInt(String(mediaResult.id)),
                version,
                versionNotes,
                uploadedBy: typeof user.id === 'number' ? user.id : parseInt(String(user.id)),
                ...(previousVersionId ? { previousVersion: parseInt(previousVersionId, 10) } : {}),
            },
        });

        revalidatePath('/admin/mis-proyectos');
        return { success: true };
    } catch (error: any) {
        console.error('Error uploading document:', error);
        return { success: false, error: error.message || 'Error al subir documento' };
    }
}

// ── Delete Document ──

export async function deleteProjectDocument(
    documentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'No autenticado' };

        const payload = await getPayload({ config });
        const isAdmin = user.role === 'admin' || user.role === 'super_admin';

        if (!isAdmin) {
            // Check if user uploaded this document
            const doc = await payload.findByID({ collection: 'project-documents', id: documentId, depth: 0, overrideAccess: true });
            if (String((doc as any).uploadedBy) !== String(user.id)) {
                return { success: false, error: 'Solo puedes eliminar documentos que hayas subido.' };
            }
        }

        await payload.delete({ collection: 'project-documents', id: documentId, overrideAccess: true });
        revalidatePath('/admin/mis-proyectos');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error al eliminar documento' };
    }
}
