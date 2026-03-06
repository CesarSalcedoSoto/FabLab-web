"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { EquipmentData, InventoryItemData, EquipmentUsageData, RoomOption } from "./data";
import type { CollectionSlug } from "payload";

async function getCurrentUser() {
    try {
        const payload = await getPayload({ config });
        const cookieStore = await cookies();
        const token = cookieStore.get("payload-token")?.value || cookieStore.get("fablab_token")?.value;
        if (token) {
            const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) });
            if (user) {
                return {
                    id: user.id,
                    idString: String(user.id),
                    name: (user as any).name || user.email || "Usuario",
                };
            }
        }
    } catch { /* ignore */ }
    return null;
}

const ROOMS_COLLECTION = "rooms" as CollectionSlug;

// ═══════════════════════════════════════════
// ── SALAS (para selector de ubicación) ────
// ═══════════════════════════════════════════

export async function getRoomsForSelect(): Promise<RoomOption[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: ROOMS_COLLECTION,
            sort: 'name',
            limit: 200,
            overrideAccess: true,
        });
        return result.docs.map((doc: any) => ({
            id: Number(doc.id),
            name: doc.name || '',
            location: doc.location || '',
        }));
    } catch (error) {
        console.error('Error fetching rooms for select:', error);
        return [];
    }
}

// ═══════════════════════════════════════════
// ── EQUIPOS ───────────────────────────────
// ═══════════════════════════════════════════

export async function getEquipment(): Promise<EquipmentData[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'equipment',
            sort: 'order',
            limit: 200,
            depth: 2,
            overrideAccess: true,
        });

        // Get active usage counts
        const usageResult = await payload.find({
            collection: 'equipment-usage',
            where: { status: { equals: 'active' } },
            limit: 500,
            overrideAccess: true,
        });

        const usageCountMap: Record<string, number> = {};
        for (const u of usageResult.docs) {
            const eqId = (u as any).equipmentId;
            usageCountMap[eqId] = (usageCountMap[eqId] || 0) + 1;
        }

        return result.docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            slug: doc.slug,
            equipmentCode: doc.equipmentCode || '',
            category: doc.category,
            ownerArea: doc.ownerArea || '',
            brand: doc.brand || '',
            model: doc.model || '',
            description: doc.description || '',
            featuredImage: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : null,
            gallery: doc.gallery?.map((g: any) => ({
                id: typeof g.image === 'object' ? String(g.image.id) : String(g.image),
                url: typeof g.image === 'object' ? g.image?.url : null,
            })).filter((g: any) => g.url) || [],
            specifications: doc.specifications?.map((s: any) => ({ label: s.label, value: s.value })) || [],
            materials: doc.materials?.map((m: any) => m.material) || [],
            status: doc.status || 'available',
            location: typeof doc.location === 'object' && doc.location ? doc.location.name || '' : '',
            locationId: typeof doc.location === 'object' && doc.location ? Number(doc.location.id) : (typeof doc.location === 'number' ? doc.location : null),
            technicalResponsible: typeof doc.technicalResponsible === 'object' && doc.technicalResponsible ? doc.technicalResponsible.name || '' : '',
            technicalResponsibleId: typeof doc.technicalResponsible === 'object' && doc.technicalResponsible ? Number(doc.technicalResponsible.id) : (typeof doc.technicalResponsible === 'number' ? doc.technicalResponsible : null),
            lastReviewDate: doc.lastReviewDate || null,
            requiresTraining: doc.requiresTraining || false,
            showInTecnologias: doc.showInTecnologias ?? true,
            order: doc.order || 0,
            activeUsages: usageCountMap[String(doc.id)] || 0,
            maintenanceHistory: (doc.maintenanceHistory || []).map((m: any) => ({
                date: m.date,
                maintenanceType: m.maintenanceType,
                description: m.description || '',
                performedBy: m.performedBy || '',
                cost: m.cost ?? null,
                nextMaintenanceDate: m.nextMaintenanceDate || null,
            })),
            failureHistory: (doc.failureHistory || []).map((f: any) => ({
                date: f.date,
                severity: f.severity,
                description: f.description || '',
                reportedBy: f.reportedBy || '',
                resolved: f.resolved || false,
                resolution: f.resolution || '',
                resolvedDate: f.resolvedDate || null,
            })),
        }));
    } catch (error) {
        console.error('Error fetching equipment:', error);
        return [];
    }
}

export async function createEquipment(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        const name = formData.get('name') as string;
        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Upload image
        let featuredImageId: number | undefined;
        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await payload.create({
                collection: 'media',
                overrideAccess: true,
                data: { alt: name },
                file: { data: buffer, mimetype: imageFile.type, name: imageFile.name, size: imageFile.size },
            });
            featuredImageId = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
        }

        // Parse arrays
        let specifications: any[] = [];
        let materials: any[] = [];
        try { specifications = JSON.parse(formData.get('specifications') as string || '[]'); } catch { }
        try { materials = JSON.parse(formData.get('materials') as string || '[]'); } catch { }

        await payload.create({
            collection: 'equipment',
            overrideAccess: true,
            data: {
                name,
                slug,
                equipmentCode: formData.get('equipmentCode') as string || '',
                category: formData.get('category') as string || '3d-printer',
                ownerArea: formData.get('ownerArea') as string || '',
                brand: formData.get('brand') as string || '',
                model: formData.get('model') as string || '',
                description: formData.get('description') as string || '',
                status: formData.get('status') as string || 'available',
                location: formData.get('location') ? parseInt(formData.get('location') as string) : undefined,
                requiresTraining: formData.get('requiresTraining') === 'true',
                showInTecnologias: formData.get('showInTecnologias') === 'true',
                specifications,
                materials: materials.map((m: string) => ({ material: m })),
                ...(featuredImageId && { featuredImage: featuredImageId }),
            },
        });

        revalidatePath('/admin/inventory/items');
        revalidatePath('/tecnologias');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating equipment:', error);
        return { success: false, error: error.message };
    }
}

export async function updateEquipment(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        let specifications: any[] = [];
        let materials: any[] = [];
        try { specifications = JSON.parse(formData.get('specifications') as string || '[]'); } catch { }
        try { materials = JSON.parse(formData.get('materials') as string || '[]'); } catch { }

        const updateData: any = {
            name: formData.get('name') as string,
            equipmentCode: formData.get('equipmentCode') as string || '',
            category: formData.get('category') as string,
            ownerArea: formData.get('ownerArea') as string || '',
            brand: formData.get('brand') as string || '',
            model: formData.get('model') as string || '',
            description: formData.get('description') as string || '',
            status: formData.get('status') as string,
            location: formData.get('location') ? parseInt(formData.get('location') as string) : null,
            requiresTraining: formData.get('requiresTraining') === 'true',
            showInTecnologias: formData.get('showInTecnologias') === 'true',
            specifications,
            materials: materials.map((m: string) => ({ material: m })),
        };

        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await payload.create({
                collection: 'media',
                overrideAccess: true,
                data: { alt: formData.get('name') as string },
                file: { data: buffer, mimetype: imageFile.type, name: imageFile.name, size: imageFile.size },
            });
            updateData.featuredImage = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
        }

        await payload.update({ collection: 'equipment', id, data: updateData, overrideAccess: true });
        revalidatePath('/admin/inventory/items');
        revalidatePath('/tecnologias');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating equipment:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteEquipment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.delete({ collection: 'equipment', id, overrideAccess: true });
        revalidatePath('/admin/inventory/items');
        revalidatePath('/tecnologias');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleEquipmentTecnologias(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const doc = await payload.findByID({ collection: 'equipment', id, overrideAccess: true });
        await payload.update({
            collection: 'equipment', id,
            data: { showInTecnologias: !(doc as any).showInTecnologias },
            overrideAccess: true,
        });
        revalidatePath('/admin/inventory/items');
        revalidatePath('/tecnologias');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════
// ── INVENTARIO ────────────────────────────
// ═══════════════════════════════════════════

export async function getInventoryItems(): Promise<InventoryItemData[]> {
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'inventory-items',
            sort: '-updatedAt',
            limit: 500,
            depth: 1,
            overrideAccess: true,
        });

        return result.docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            sku: doc.sku || '',
            category: doc.category,
            description: doc.description || '',
            image: typeof doc.image === 'object' ? doc.image?.url : null,
            quantity: doc.quantity || 0,
            unit: doc.unit || 'unit',
            minimumStock: doc.minimumStock || 0,
            location: typeof doc.location === 'object' && doc.location ? doc.location.name || '' : '',
            locationId: typeof doc.location === 'object' && doc.location ? Number(doc.location.id) : (typeof doc.location === 'number' ? doc.location : null),
            supplier: doc.supplier || '',
            unitCost: doc.unitCost ?? null,
            status: doc.status || 'available',
            notes: doc.notes || '',
            updatedAt: doc.updatedAt || '',
        }));
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return [];
    }
}

export async function createInventoryItem(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        let imageId: number | undefined;
        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await payload.create({
                collection: 'media',
                overrideAccess: true,
                data: { alt: formData.get('name') as string },
                file: { data: buffer, mimetype: imageFile.type, name: imageFile.name, size: imageFile.size },
            });
            imageId = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
        }

        await payload.create({
            collection: 'inventory-items',
            overrideAccess: true,
            data: {
                name: formData.get('name') as string,
                sku: formData.get('sku') as string || undefined,
                category: formData.get('category') as string || 'consumable',
                description: formData.get('description') as string || '',
                quantity: parseInt(formData.get('quantity') as string) || 0,
                unit: formData.get('unit') as string || 'unit',
                minimumStock: parseInt(formData.get('minimumStock') as string) || 0,
                location: formData.get('location') ? parseInt(formData.get('location') as string) : undefined,
                supplier: formData.get('supplier') as string || '',
                unitCost: formData.get('unitCost') ? parseFloat(formData.get('unitCost') as string) : undefined,
                notes: formData.get('notes') as string || '',
                ...(imageId && { image: imageId }),
            },
        });

        revalidatePath('/admin/inventory/items');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating inventory item:', error);
        return { success: false, error: error.message };
    }
}

export async function updateInventoryItem(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        const updateData: any = {
            name: formData.get('name') as string,
            sku: formData.get('sku') as string || '',
            category: formData.get('category') as string,
            description: formData.get('description') as string || '',
            quantity: parseInt(formData.get('quantity') as string) || 0,
            unit: formData.get('unit') as string || 'unit',
            minimumStock: parseInt(formData.get('minimumStock') as string) || 0,
            location: formData.get('location') ? parseInt(formData.get('location') as string) : null,
            supplier: formData.get('supplier') as string || '',
            unitCost: formData.get('unitCost') ? parseFloat(formData.get('unitCost') as string) : null,
            notes: formData.get('notes') as string || '',
        };

        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const uploadResult = await payload.create({
                collection: 'media',
                overrideAccess: true,
                data: { alt: formData.get('name') as string },
                file: { data: buffer, mimetype: imageFile.type, name: imageFile.name, size: imageFile.size },
            });
            updateData.image = typeof uploadResult.id === 'number' ? uploadResult.id : parseInt(String(uploadResult.id));
        }

        await payload.update({ collection: 'inventory-items', id, data: updateData, overrideAccess: true });
        revalidatePath('/admin/inventory/items');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating inventory item:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteInventoryItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.delete({ collection: 'inventory-items', id, overrideAccess: true });
        revalidatePath('/admin/inventory/items');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════
// ── USOS DE EQUIPOS ──────────────────────
// ═══════════════════════════════════════════

export async function getEquipmentUsages(equipmentId?: string): Promise<EquipmentUsageData[]> {
    try {
        const payload = await getPayload({ config });
        const where: any = {};
        if (equipmentId) {
            where.equipmentId = { equals: equipmentId };
        }
        const result = await payload.find({
            collection: 'equipment-usage',
            where,
            sort: '-createdAt',
            limit: 100,
            depth: 1,
            overrideAccess: true,
        });

        return result.docs.map((doc: any) => ({
            id: String(doc.id),
            equipmentId: doc.equipmentId,
            equipmentName: doc.equipmentName,
            userId: typeof doc.user === 'object' ? String(doc.user.id) : String(doc.user),
            userName: doc.userName || (typeof doc.user === 'object' ? doc.user.name : ''),
            startTime: doc.startTime,
            endTime: doc.endTime || null,
            estimatedDuration: doc.estimatedDuration,
            description: doc.description || '',
            status: doc.status,
        }));
    } catch (error) {
        console.error('Error fetching equipment usages:', error);
        return [];
    }
}

export async function registerEquipmentUsage(data: {
    equipmentId: string;
    equipmentName: string;
    userId?: string;
    userName?: string;
    estimatedDuration: string;
    description?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });

        // Auto-detect user if not provided
        let userId = data.userId;
        let userName = data.userName;
        if (!userId) {
            const user = await getCurrentUser();
            if (!user) return { success: false, error: "Debes iniciar sesión para usar un equipo" };
            userId = user.idString;
            userName = user.name;
        }

        // Check equipment is not already in active use
        const { docs: existing } = await payload.find({
            collection: 'equipment-usage',
            where: { and: [{ equipmentId: { equals: data.equipmentId } }, { status: { equals: 'active' } }] },
            limit: 1,
        });
        if (existing.length > 0) {
            return { success: false, error: "Este equipo ya está en uso" };
        }

        await payload.create({
            collection: 'equipment-usage',
            overrideAccess: true,
            data: {
                equipmentId: data.equipmentId,
                equipmentName: data.equipmentName,
                user: parseInt(userId),
                userName: userName || "Usuario",
                startTime: new Date().toISOString(),
                estimatedDuration: data.estimatedDuration,
                description: data.description || '',
                status: 'active',
            },
        });
        revalidatePath('/admin/inventory/items');
        revalidatePath('/admin/equipment-usage');
        return { success: true };
    } catch (error: any) {
        console.error('Error registering usage:', error);
        return { success: false, error: error.message };
    }
}

export async function completeEquipmentUsage(usageId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayload({ config });
        await payload.update({
            collection: 'equipment-usage',
            id: usageId,
            data: { status: 'completed', endTime: new Date().toISOString() },
            overrideAccess: true,
        });
        revalidatePath('/admin/inventory/items');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════
// ── EXCEL INVENTARIO ──────────────────────
// ═══════════════════════════════════════════

const EXCEL_COLUMNS = [
    { header: 'Nombre', key: 'name', width: 30 },
    { header: 'SKU / Código', key: 'sku', width: 18 },
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Descripción', key: 'description', width: 35 },
    { header: 'Cantidad', key: 'quantity', width: 12 },
    { header: 'Unidad', key: 'unit', width: 14 },
    { header: 'Stock Mínimo', key: 'minimumStock', width: 14 },
    { header: 'Ubicación', key: 'location', width: 22 },
    { header: 'Proveedor', key: 'supplier', width: 22 },
    { header: 'Costo Unitario', key: 'unitCost', width: 15 },
    { header: 'Notas', key: 'notes', width: 30 },
];

const VALID_CATEGORIES = ['consumable', 'material', 'component', 'tool', 'supply', 'furniture', 'room', 'other'];
const VALID_UNITS = ['unit', 'kg', 'g', 'm', 'cm', 'l', 'ml', 'roll', 'sheet', 'pack'];

const CATEGORY_LABELS: Record<string, string> = {
    consumable: 'Consumible', material: 'Material', component: 'Componente Electrónico',
    tool: 'Herramienta', supply: 'Insumo General', furniture: 'Mueble', room: 'Sala / Espacio', other: 'Otro',
};
const UNIT_LABELS: Record<string, string> = {
    unit: 'Unidad(es)', kg: 'Kilogramos', g: 'Gramos', m: 'Metros', cm: 'Centímetros',
    l: 'Litros', ml: 'Mililitros', roll: 'Rollos', sheet: 'Hojas', pack: 'Paquetes',
};

function resolveCategory(raw: string): string {
    if (!raw) return 'other';
    const lower = raw.trim().toLowerCase();
    if (VALID_CATEGORIES.includes(lower)) return lower;
    const entry = Object.entries(CATEGORY_LABELS).find(([, label]) => label.toLowerCase() === lower);
    return entry ? entry[0] : 'other';
}

function resolveUnit(raw: string): string {
    if (!raw) return 'unit';
    const lower = raw.trim().toLowerCase();
    if (VALID_UNITS.includes(lower)) return lower;
    const entry = Object.entries(UNIT_LABELS).find(([, label]) => label.toLowerCase() === lower);
    return entry ? entry[0] : 'unit';
}

/**
 * Genera una plantilla Excel de ejemplo con datos de muestra
 */
export async function getInventoryExcelTemplate(): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
    try {
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FabLab Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Inventario');
        sheet.columns = EXCEL_COLUMNS;

        // Header style
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        sheet.getRow(1).height = 30;

        // Ejemplo rows
        const examples = [
            { name: 'Filamento PLA 1kg Negro', sku: 'FIL-PLA-001', category: 'Consumible', description: 'Filamento PLA 1.75mm negro para impresoras 3D', quantity: 12, unit: 'Unidad(es)', minimumStock: 3, location: 'Estante A1', supplier: '3D Market Chile', unitCost: 12500, notes: 'Temperatura: 190-220°C' },
            { name: 'Resistencia 220Ω', sku: 'COMP-R220', category: 'Componente Electrónico', description: 'Resistencia 1/4W 220 ohm', quantity: 500, unit: 'Unidad(es)', minimumStock: 100, location: 'Cajón de componentes', supplier: 'Electrostore', unitCost: 15, notes: '' },
            { name: 'MDF 3mm 60x40cm', sku: 'MAT-MDF-001', category: 'Material', description: 'Plancha MDF 3mm cortada para láser', quantity: 25, unit: 'Unidad(es)', minimumStock: 5, location: 'Área de corte', supplier: 'Maderera Central', unitCost: 1200, notes: 'Apto para corte láser' },
            { name: 'Resina UV 500ml', sku: 'CON-RES-001', category: 'Consumible', description: 'Resina estándar gris para impresora SLA', quantity: 4, unit: 'Unidad(es)', minimumStock: 2, location: 'Estante A2', supplier: 'Elegoo Chile', unitCost: 18000, notes: 'Almacenar en lugar oscuro' },
            { name: 'Mesa de trabajo grande', sku: 'MUE-MESA-01', category: 'Mueble', description: 'Mesa 2x1m con superficie protegida', quantity: 1, unit: 'Unidad(es)', minimumStock: 0, location: 'Sala principal', supplier: '', unitCost: 0, notes: '' },
        ];

        for (const row of examples) sheet.addRow(row);

        // Instrucciones sheet
        const instrSheet = workbook.addWorksheet('Instrucciones');
        instrSheet.getColumn(1).width = 25;
        instrSheet.getColumn(2).width = 55;

        instrSheet.getRow(1).font = { bold: true, size: 14 };
        instrSheet.getCell('A1').value = 'Instrucciones de uso';
        instrSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
        instrSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        instrSheet.mergeCells('A1:B1');

        const instructions = [
            ['', ''],
            ['Hoja "Inventario"', 'Completa los datos de los items que deseas importar.'],
            ['Nombre *', 'Nombre del item (obligatorio).'],
            ['SKU / Código', 'Código identificador único. Puede dejarse vacío.'],
            ['Categoría', `Valores válidos: ${Object.values(CATEGORY_LABELS).join(', ')}`],
            ['Descripción', 'Descripción breve del item.'],
            ['Cantidad', 'Número entero con la cantidad disponible.'],
            ['Unidad', `Valores válidos: ${Object.values(UNIT_LABELS).join(', ')}`],
            ['Stock Mínimo', 'Cantidad mínima antes de alerta de stock bajo.'],
            ['Ubicación', 'Dónde se encuentra el item en el FabLab.'],
            ['Proveedor', 'Nombre del proveedor.'],
            ['Costo Unitario', 'Costo por unidad en pesos (solo número).'],
            ['Notas', 'Notas adicionales.'],
            ['', ''],
            ['⚠ IMPORTANTE', 'La primera fila (encabezados) no se importa. Puedes borrar los ejemplos y completar con tus datos.'],
        ];

        for (const [a, b] of instructions) {
            const r = instrSheet.addRow([a, b]);
            if (a.startsWith('⚠')) {
                r.font = { bold: true, color: { argb: 'FFDC2626' } };
            } else if (a && !b.startsWith('Completa')) {
                r.getCell(1).font = { bold: true };
            }
        }

        // Borders on data sheet
        sheet.eachRow((row) => {
            row.alignment = { vertical: 'middle', wrapText: true };
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { success: true, data: base64, filename: 'plantilla_inventario.xlsx' };
    } catch (error: any) {
        console.error('Error generating template:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Exporta el inventario actual a Excel
 */
export async function exportInventoryToExcel(): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FabLab Admin';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Inventario');
        sheet.columns = EXCEL_COLUMNS;

        // Header style
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
        sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        sheet.getRow(1).height = 30;

        const result = await payload.find({
            collection: 'inventory-items',
            sort: 'name',
            limit: 1000,
            overrideAccess: true,
        });

        for (const doc of result.docs as any[]) {
            sheet.addRow({
                name: doc.name || '',
                sku: doc.sku || '',
                category: CATEGORY_LABELS[doc.category] || doc.category || '',
                description: doc.description || '',
                quantity: doc.quantity ?? 0,
                unit: UNIT_LABELS[doc.unit] || doc.unit || '',
                minimumStock: doc.minimumStock ?? 0,
                location: typeof doc.location === 'object' ? doc.location?.name || '' : '',
                supplier: doc.supplier || '',
                unitCost: doc.unitCost ?? '',
                notes: doc.notes || '',
            });
        }

        // Borders
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) row.alignment = { vertical: 'middle', wrapText: true };
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const filename = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;

        return { success: true, data: base64, filename };
    } catch (error: any) {
        console.error('Error exporting inventory to Excel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Importa items de inventario desde un Excel (base64)
 */
export async function importInventoryFromExcel(base64Data: string): Promise<{ success: boolean; imported?: number; errors?: string[]; error?: string }> {
    try {
        const payload = await getPayload({ config });
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();

        const buffer = Buffer.from(base64Data, 'base64');
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet('Inventario') || workbook.getWorksheet(1);
        if (!sheet) return { success: false, error: 'No se encontró la hoja "Inventario" en el archivo' };

        const errors: string[] = [];
        let imported = 0;

        // Read header to determine column mapping
        const headerRow = sheet.getRow(1);
        const colMap: Record<string, number> = {};
        headerRow.eachCell((cell, colNumber) => {
            const val = String(cell.value || '').trim().toLowerCase();
            if (val.includes('nombre')) colMap['name'] = colNumber;
            else if (val.includes('sku') || val.includes('código') || val.includes('codigo')) colMap['sku'] = colNumber;
            else if (val.includes('categoría') || val.includes('categoria')) colMap['category'] = colNumber;
            else if (val.includes('descripción') || val.includes('descripcion')) colMap['description'] = colNumber;
            else if (val.includes('cantidad')) colMap['quantity'] = colNumber;
            else if (val.includes('unidad')) colMap['unit'] = colNumber;
            else if (val.includes('mínimo') || val.includes('minimo') || val.includes('stock m')) colMap['minimumStock'] = colNumber;
            else if (val.includes('ubicación') || val.includes('ubicacion')) colMap['location'] = colNumber;
            else if (val.includes('proveedor')) colMap['supplier'] = colNumber;
            else if (val.includes('costo') || val.includes('precio')) colMap['unitCost'] = colNumber;
            else if (val.includes('nota')) colMap['notes'] = colNumber;
        });

        if (!colMap['name']) {
            return { success: false, error: 'No se encontró la columna "Nombre" en el Excel. Usa la plantilla de ejemplo.' };
        }

        // Pre-fetch rooms for location matching
        const roomsResult = await payload.find({
            collection: ROOMS_COLLECTION,
            limit: 200,
            overrideAccess: true,
        });
        const roomNameMap: Record<string, number> = {};
        for (const room of roomsResult.docs as any[]) {
            roomNameMap[String(room.name).toLowerCase().trim()] = Number(room.id);
        }

        const getCellValue = (row: any, key: string): string => {
            const col = colMap[key];
            if (!col) return '';
            const cell = row.getCell(col);
            return String(cell.value ?? '').trim();
        };

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header

            const name = getCellValue(row, 'name');
            if (!name) return; // skip empty rows

            const rawQty = getCellValue(row, 'quantity');
            const rawMinStock = getCellValue(row, 'minimumStock');
            const rawCost = getCellValue(row, 'unitCost');

            const locationText = getCellValue(row, 'location');
            const locationRoomId = locationText ? roomNameMap[locationText.toLowerCase().trim()] : undefined;

            const itemData = {
                name,
                sku: getCellValue(row, 'sku') || undefined,
                category: resolveCategory(getCellValue(row, 'category')),
                description: getCellValue(row, 'description'),
                quantity: rawQty ? parseInt(rawQty) || 0 : 0,
                unit: resolveUnit(getCellValue(row, 'unit')),
                minimumStock: rawMinStock ? parseInt(rawMinStock) || 0 : 0,
                location: locationRoomId || undefined,
                supplier: getCellValue(row, 'supplier'),
                unitCost: rawCost ? parseFloat(rawCost) || undefined : undefined,
                notes: getCellValue(row, 'notes'),
            };

            // Queue for creation (collected then processed)
            (sheet as any).__pendingRows = (sheet as any).__pendingRows || [];
            (sheet as any).__pendingRows.push({ rowNumber, data: itemData });
        });

        const pendingRows: { rowNumber: number; data: any }[] = (sheet as any).__pendingRows || [];

        for (const { rowNumber, data } of pendingRows) {
            try {
                await payload.create({
                    collection: 'inventory-items',
                    overrideAccess: true,
                    data,
                });
                imported++;
            } catch (err: any) {
                errors.push(`Fila ${rowNumber}: ${err.message || 'Error desconocido'}`);
            }
        }

        revalidatePath('/admin/inventory/items');
        return { success: true, imported, errors: errors.length > 0 ? errors : undefined };
    } catch (error: any) {
        console.error('Error importing inventory from Excel:', error);
        return { success: false, error: error.message };
    }
}
