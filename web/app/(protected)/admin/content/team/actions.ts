"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";

export async function getTeamMembers() {
    try {
        const payload = await getPayload({ config });
        const { docs: members } = await payload.find({
            collection: "team-members",
            depth: 1,
            limit: 100,
        });

        // Serialize for client
        return members.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            role: doc.role,
            category: doc.category,
            specialty: doc.specialty,
            bio: doc.bio,
            experience: doc.experience,
            image: typeof doc.image === 'object' ? doc.image?.url : doc.image,
            imageId: typeof doc.image === 'object' ? doc.image?.id : doc.image,
            social: doc.social,
            active: doc.active,
        }));
    } catch (error) {
        console.error("[TeamActions] Error obteniendo miembros del equipo:", error);
        return [];
    }
}

export async function createTeamMember(formData: FormData) {
    try {
        const payload = await getPayload({ config });

        const data: any = {
            name: formData.get('name'),
            role: formData.get('role'),
            category: formData.get('category') || 'collaborator',
            specialty: formData.get('specialty'),
            bio: formData.get('bio'),
            experience: formData.get('experience'),
            social: {
                email: formData.get('email'),
                linkedin: formData.get('linkedin'),
                github: formData.get('github'),
                twitter: formData.get('twitter'),
            },
            order: 0,
            active: true,
        };

        const file = formData.get('image') as File;
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const mediaDoc = await payload.create({
                collection: 'media',
                data: {
                    alt: formData.get('name') || file.name,
                },
                file: {
                    data: buffer,
                    name: file.name,
                    mimetype: file.type,
                    size: file.size,
                }
            });
            data.image = mediaDoc.id;
        }

        await payload.create({
            collection: 'team-members',
            data,
        });

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

        const data: any = {
            name: formData.get('name'),
            role: formData.get('role'),
            category: formData.get('category'),
            specialty: formData.get('specialty'),
            bio: formData.get('bio'),
            experience: formData.get('experience'),
            social: {
                email: formData.get('email'),
                linkedin: formData.get('linkedin'),
                github: formData.get('github'),
                twitter: formData.get('twitter'),
            },
            active: formData.get('active') === 'true',
        };

        const file = formData.get('image') as File;
        if (file && file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const mediaDoc = await payload.create({
                collection: 'media',
                data: {
                    alt: formData.get('name') || file.name,
                },
                file: {
                    data: buffer,
                    name: file.name,
                    mimetype: file.type,
                    size: file.size,
                }
            });
            data.image = mediaDoc.id;
        }

        await payload.update({
            collection: 'team-members',
            id,
            data,
        });

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
        await payload.delete({
            collection: 'team-members',
            id,
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
            collection: 'team-members',
            id,
            data: {
                active,
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
