"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import type { EquipmentData } from "./data";


export async function getEquipment(): Promise<EquipmentData[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'equipment',
            limit: 100,
            sort: 'order',
        });

        return result.docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name || '',
            slug: doc.slug || '',
            category: doc.category || '3d-printer',
            brand: doc.brand,
            model: doc.model,
            description: doc.description || '',
            featuredImage: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : undefined,
            status: doc.status || 'available',
            location: typeof doc.location === 'object' && doc.location ? doc.location.name || '' : '',
            requiresTraining: doc.requiresTraining || false,
            order: doc.order || 0,
        }));
    } catch (error) {
        console.error('Error fetching equipment:', error);
        return [];
    }
}

export async function createEquipment(data: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        await payload.create({
            collection: 'equipment',
            data: {
                name: data.get('name') as string,
                category: data.get('category') as string,
                brand: data.get('brand') as string || undefined,
                model: data.get('model') as string || undefined,
                description: data.get('description') as string,
                status: data.get('status') as string || 'available',
                location: data.get('location') ? parseInt(data.get('location') as string) || undefined : undefined,
                requiresTraining: data.get('requiresTraining') === 'true',
                order: parseInt(data.get('order') as string) || 0,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating equipment:', error);
        return { success: false, error: 'Error al crear el equipo' };
    }
}

export async function updateEquipment(id: string, data: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        await payload.update({
            collection: 'equipment',
            id,
            data: {
                name: data.get('name') as string,
                category: data.get('category') as string,
                brand: data.get('brand') as string || undefined,
                model: data.get('model') as string || undefined,
                description: data.get('description') as string,
                status: data.get('status') as string,
                location: data.get('location') ? parseInt(data.get('location') as string) || null : null,
                requiresTraining: data.get('requiresTraining') === 'true',
                order: parseInt(data.get('order') as string) || 0,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating equipment:', error);
        return { success: false, error: 'Error al actualizar el equipo' };
    }
}

export async function deleteEquipment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.delete({ collection: 'equipment', id });
        return { success: true };
    } catch (error) {
        console.error('Error deleting equipment:', error);
        return { success: false, error: 'Error al eliminar' };
    }
}
