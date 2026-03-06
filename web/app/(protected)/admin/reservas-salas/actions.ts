"use server";

import { getPayload } from "payload";
import type { CollectionSlug } from "payload";
import config from "@payload-config";

const ROOMS_COLLECTION = "rooms" as CollectionSlug;
const RESERVATIONS_COLLECTION = "room-reservations" as CollectionSlug;

// ==================== TYPES ====================

export interface RoomEquipmentDTO {
    id?: string;
    name: string;
    category: "consumable" | "material" | "component" | "tool" | "supply" | "other";
    quantity: number;
}

export interface RoomDTO {
    id: number;
    name: string;
    location: string;
    capacity: number;
    description: string;
    amenities: string[];
    equipment: RoomEquipmentDTO[];
}

export interface ReservationDTO {
    id: number;
    roomId: number;
    roomName: string;
    userId: string;
    userName: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    companions: string[];
    createdAt: string;
}

// ==================== ROOMS ====================

export async function getRooms(): Promise<RoomDTO[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: ROOMS_COLLECTION,
            limit: 100,
            sort: "name",
            overrideAccess: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name || "",
            location: doc.location || "",
            capacity: doc.capacity || 10,
            description: doc.description || "",
            amenities: (doc.amenities || []).map((a: { value: string }) => a.value),
            equipment: (doc.equipment || []).map((e: { id?: string; name: string; category: string; quantity: number }) => ({
                id: e.id || String(Math.random()),
                name: e.name,
                category: e.category,
                quantity: e.quantity,
            })),
        }));
    } catch (error: unknown) {
        console.error("[getRooms] Error:", error);
        return [];
    }
}

export async function createRoom(data: {
    name: string;
    location: string;
    capacity: number;
    description: string;
    amenities: string[];
    equipment: RoomEquipmentDTO[];
}): Promise<{ success: boolean; room?: RoomDTO; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const doc = await payload.create({
            collection: ROOMS_COLLECTION,
            overrideAccess: true,
            data: {
                name: data.name,
                location: data.location,
                capacity: data.capacity,
                description: data.description,
                amenities: data.amenities.map((a) => ({ value: a })),
                equipment: data.equipment.map((e) => ({
                    name: e.name,
                    category: e.category,
                    quantity: e.quantity,
                })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = doc as any;
        return {
            success: true,
            room: {
                id: d.id,
                name: d.name,
                location: d.location || "",
                capacity: d.capacity,
                description: d.description || "",
                amenities: (d.amenities || []).map((a: { value: string }) => a.value),
                equipment: (d.equipment || []).map((e: { id?: string; name: string; category: string; quantity: number }) => ({
                    id: e.id || String(Math.random()),
                    name: e.name,
                    category: e.category,
                    quantity: e.quantity,
                })),
            },
        };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error al crear sala";
        console.error("[createRoom] Error:", error);
        return { success: false, error: msg };
    }
}

export async function updateRoom(
    id: number,
    data: {
        name: string;
        location: string;
        capacity: number;
        description: string;
        amenities: string[];
        equipment: RoomEquipmentDTO[];
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.update({
            collection: ROOMS_COLLECTION,
            id,
            overrideAccess: true,
            data: {
                name: data.name,
                location: data.location,
                capacity: data.capacity,
                description: data.description,
                amenities: data.amenities.map((a) => ({ value: a })),
                equipment: data.equipment.map((e) => ({
                    name: e.name,
                    category: e.category,
                    quantity: e.quantity,
                })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error al actualizar sala";
        console.error("[updateRoom] Error:", error);
        return { success: false, error: msg };
    }
}

export async function deleteRoom(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.delete({ collection: ROOMS_COLLECTION, id, overrideAccess: true });
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error al eliminar sala";
        console.error("[deleteRoom] Error:", error);
        return { success: false, error: msg };
    }
}

// ==================== RESERVATIONS ====================

export async function getReservations(): Promise<ReservationDTO[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: RESERVATIONS_COLLECTION,
            limit: 200,
            sort: "-date",
            overrideAccess: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.docs.map((doc: any) => {
            const roomId = typeof doc.room === "object" ? doc.room?.id : doc.room;
            const userId = typeof doc.user === "object" ? doc.user?.id : doc.user;
            return {
                id: doc.id,
                roomId: roomId || 0,
                roomName: doc.roomName || "",
                userId: String(userId || ""),
                userName: doc.userName || "",
                date: doc.date || "",
                startTime: doc.startTime || "",
                endTime: doc.endTime || "",
                purpose: doc.purpose || "",
                companions: (doc.companions || []).map((c: { name: string }) => c.name),
                createdAt: doc.createdAt || "",
            };
        });
    } catch (error: unknown) {
        console.error("[getReservations] Error:", error);
        return [];
    }
}

export async function createReservation(data: {
    roomId: number;
    roomName: string;
    userId: number;
    userName: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    companions: string[];
}): Promise<{ success: boolean; reservation?: ReservationDTO; error?: string }> {
    try {
        const payload = await getPayload({ config });

        // Validate date is not in the past
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        if (data.date < today) {
            return { success: false, error: "No se puede reservar en una fecha pasada" };
        }

        // If booking for today, ensure start time is not in the past
        // Round down to current half-hour (e.g. 19:31 → 19:30 is still valid)
        if (data.date === today) {
            const hh = String(now.getHours()).padStart(2, "0");
            const mm = now.getMinutes() < 30 ? "00" : "30";
            const currentSlot = `${hh}:${mm}`;
            if (data.startTime < currentSlot) {
                return { success: false, error: `La hora de inicio (${data.startTime}) ya pasó` };
            }
        }

        // Check for conflicts
        const existing = await payload.find({
            collection: RESERVATIONS_COLLECTION,
            overrideAccess: true,
            where: {
                room: { equals: data.roomId },
                date: { equals: data.date },
            },
            limit: 100,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conflict = existing.docs.find((doc: any) => {
            const s = doc.startTime as string;
            const e = doc.endTime as string;
            return data.startTime < e && s < data.endTime;
        });

        if (conflict) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const c = conflict as any;
            return {
                success: false,
                error: `Conflicto de horario: ${c.startTime} - ${c.endTime} (${c.userName})`,
            };
        }

        const doc = await payload.create({
            collection: RESERVATIONS_COLLECTION,
            overrideAccess: true,
            data: {
                room: data.roomId,
                roomName: data.roomName,
                user: data.userId,
                userName: data.userName,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                purpose: data.purpose,
                companions: data.companions.map((name) => ({ name })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = doc as any;
        const roomId = typeof d.room === "object" ? d.room?.id : d.room;
        const userId = typeof d.user === "object" ? d.user?.id : d.user;

        return {
            success: true,
            reservation: {
                id: d.id,
                roomId: roomId || 0,
                roomName: d.roomName || "",
                userId: String(userId || ""),
                userName: d.userName || "",
                date: d.date || "",
                startTime: d.startTime || "",
                endTime: d.endTime || "",
                purpose: d.purpose || "",
                companions: (d.companions || []).map((c: { name: string }) => c.name),
                createdAt: d.createdAt || "",
            },
        };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error al crear reserva";
        console.error("[createReservation] Error:", error);
        return { success: false, error: msg };
    }
}

export async function deleteReservation(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.delete({ collection: RESERVATIONS_COLLECTION, id, overrideAccess: true });
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Error al cancelar reserva";
        console.error("[deleteReservation] Error:", error);
        return { success: false, error: msg };
    }
}
