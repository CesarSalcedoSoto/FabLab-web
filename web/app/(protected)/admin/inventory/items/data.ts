// Tipos para la gestión de Equipos e Inventario

// ── Equipos (público en /tecnologías) ──

export interface EquipmentSpecification {
    label: string;
    value: string;
}

export interface MaintenanceEntry {
    date: string;
    maintenanceType: 'preventive' | 'corrective' | 'calibration' | 'cleaning' | 'upgrade';
    description: string;
    performedBy: string;
    cost: number | null;
    nextMaintenanceDate: string | null;
}

export interface FailureEntry {
    date: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    reportedBy: string;
    resolved: boolean;
    resolution: string;
    resolvedDate: string | null;
}

export interface EquipmentData {
    id: string;
    name: string;
    slug: string;
    equipmentCode: string;
    category: string;
    ownerArea: string;
    brand: string;
    model: string;
    description: string;
    featuredImage: string | null;
    gallery: { id: string; url: string }[];
    specifications: EquipmentSpecification[];
    materials: string[];
    status: 'available' | 'in-use' | 'maintenance' | 'inactive' | 'out-of-service' | 'borrowed';
    location: string;
    locationId: number | null;
    technicalResponsible: string;
    technicalResponsibleId: number | null;
    lastReviewDate: string | null;
    requiresTraining: boolean;
    showInTecnologias: boolean;
    order: number;
    activeUsages: number;
    maintenanceHistory: MaintenanceEntry[];
    failureHistory: FailureEntry[];
}

// ── Inventario (solo admin) ──

export interface InventoryItemData {
    id: string;
    name: string;
    sku: string;
    category: string;
    description: string;
    image: string | null;
    quantity: number;
    unit: string;
    minimumStock: number;
    location: string;
    locationId: number | null;
    supplier: string;
    unitCost: number | null;
    status: 'available' | 'low-stock' | 'out-of-stock';
    notes: string;
    updatedAt: string;
}

// ── Usos de Equipos ──

export interface EquipmentUsageData {
    id: string;
    equipmentId: string;
    equipmentName: string;
    userId: string;
    userName: string;
    startTime: string;
    endTime: string | null;
    estimatedDuration: string;
    description: string;
    status: 'active' | 'completed';
}

// ── Sala / Room para selector de ubicación ──

export interface RoomOption {
    id: number;
    name: string;
    location: string;
}

// ── Constantes de categoría ──

export const EQUIPMENT_CATEGORIES: Record<string, string> = {
    '3d-printer': 'Impresora 3D',
    'laser-cutter': 'Cortadora Láser',
    'cnc': 'CNC',
    'electronics': 'Electrónica',
    'hand-tools': 'Herramientas Manuales',
    'power-tools': 'Herramientas Eléctricas',
    '3d-scanner': 'Escáner 3D',
    'computing': 'Computación',
    'other': 'Otro',
};

export const INVENTORY_CATEGORIES: Record<string, string> = {
    'consumable': 'Consumible',
    'material': 'Material',
    'component': 'Componente Electrónico',
    'tool': 'Herramienta',
    'supply': 'Insumo General',
    'furniture': 'Mueble',
    'room': 'Sala / Espacio',
    'other': 'Otro',
};

export const INVENTORY_UNITS: Record<string, string> = {
    'unit': 'Unidad(es)',
    'kg': 'Kilogramos',
    'g': 'Gramos',
    'm': 'Metros',
    'cm': 'Centímetros',
    'l': 'Litros',
    'ml': 'Mililitros',
    'roll': 'Rollos',
    'sheet': 'Hojas',
    'pack': 'Paquetes',
};

export const EQUIPMENT_STATUS: Record<string, string> = {
    'available': 'Activo',
    'in-use': 'En Uso',
    'maintenance': 'En Mantención',
    'inactive': 'Inactivo',
    'out-of-service': 'Fuera de Servicio',
    'borrowed': 'Prestado',
};

export const MAINTENANCE_TYPES: Record<string, string> = {
    'preventive': 'Preventiva',
    'corrective': 'Correctiva',
    'calibration': 'Calibración',
    'cleaning': 'Limpieza',
    'upgrade': 'Actualización',
};

export const FAILURE_SEVERITY: Record<string, string> = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
    'critical': 'Crítica',
};

export const INVENTORY_STATUS: Record<string, string> = {
    'available': 'Disponible',
    'low-stock': 'Stock Bajo',
    'out-of-stock': 'Agotado',
};
