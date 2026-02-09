"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Badge } from "@/shared/ui/misc/badge";
import { Label } from "@/shared/ui/labels/label";
import { Textarea } from "@/shared/ui/inputs/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/misc/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/inputs/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/misc/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/tables/table";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2,
    CheckCircle,
    Upload,
    Eye,
    EyeOff,
    X,
    Cpu,
    Package,
    AlertTriangle,
    Monitor,
    MapPin,
    Activity,
    Play,
    ArrowRight,
    FileSpreadsheet,
    Download,
    FileUp,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    toggleEquipmentTecnologias,
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    registerEquipmentUsage,
    exportInventoryToExcel,
    getInventoryExcelTemplate,
    importInventoryFromExcel,
} from "./actions";
import {
    EQUIPMENT_CATEGORIES,
    EQUIPMENT_STATUS,
    INVENTORY_CATEGORIES,
    INVENTORY_UNITS,
    INVENTORY_STATUS,
} from "./data";
import type { EquipmentData, InventoryItemData } from "./data";

// ═══════════════════════════════════════════
// ── PAGE COMPONENT ────────────────────────
// ═══════════════════════════════════════════

export default function InventoryItemsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") === "inventory" ? "inventory" : "equipment";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Equipment state
    const [equipmentList, setEquipmentList] = useState<EquipmentData[]>([]);
    const [equipCategoryFilter, setEquipCategoryFilter] = useState("all");
    const [isEquipDialogOpen, setIsEquipDialogOpen] = useState(false);
    const [isEditEquipDialogOpen, setIsEditEquipDialogOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData | null>(null);

    // Usage registration state
    const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
    const [usageEquipment, setUsageEquipment] = useState<EquipmentData | null>(null);
    const [usageDuration, setUsageDuration] = useState("1h");
    const [usageDescription, setUsageDescription] = useState("");

    // Excel import state
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isExcelBusy, setIsExcelBusy] = useState(false);
    const importFileRef = useRef<HTMLInputElement>(null);

    // Inventory state
    const [inventoryList, setInventoryList] = useState<InventoryItemData[]>([]);
    const [invCategoryFilter, setInvCategoryFilter] = useState("all");
    const [isInvDialogOpen, setIsInvDialogOpen] = useState(false);
    const [isEditInvDialogOpen, setIsEditInvDialogOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState<InventoryItemData | null>(null);

    // Common
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [lastCreatedName, setLastCreatedName] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Equipment form state ──
    const [equipForm, setEquipForm] = useState({
        name: "", category: "3d-printer", brand: "", model: "",
        description: "", status: "available", location: "",
        requiresTraining: false, showInTecnologias: true,
        specifications: [] as { label: string; value: string }[],
        materials: [] as string[],
        image: null as File | null,
    });
    const [newSpecLabel, setNewSpecLabel] = useState("");
    const [newSpecValue, setNewSpecValue] = useState("");
    const [newMaterial, setNewMaterial] = useState("");

    // ── Inventory form state ──
    const [invForm, setInvForm] = useState({
        name: "", sku: "", category: "consumable", description: "",
        quantity: 0, unit: "unit", minimumStock: 0,
        location: "", supplier: "", unitCost: "",
        notes: "", image: null as File | null,
    });

    // ═══════════════════════════════════════
    // ── DATA LOADING ──────────────────────
    // ═══════════════════════════════════════

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [equip, inv] = await Promise.all([
                getEquipment(),
                getInventoryItems(),
            ]);
            setEquipmentList(equip);
            setInventoryList(inv);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar datos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ═══════════════════════════════════════
    // ── STATS ─────────────────────────────
    // ═══════════════════════════════════════

    const availableEquipment = equipmentList.filter(e => e.status === 'available').length;
    const visibleInTecnologias = equipmentList.filter(e => e.showInTecnologias).length;
    const lowStockItems = inventoryList.filter(i => i.status === 'low-stock' || i.status === 'out-of-stock').length;

    // ═══════════════════════════════════════
    // ── FILTERS ───────────────────────────
    // ═══════════════════════════════════════

    const filteredEquipment = equipmentList.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.model.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = equipCategoryFilter === "all" || e.category === equipCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    const filteredInventory = inventoryList.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.supplier.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = invCategoryFilter === "all" || i.category === invCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    // ═══════════════════════════════════════
    // ── FORM HELPERS ──────────────────────
    // ═══════════════════════════════════════

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            if (activeTab === "equipment") {
                setEquipForm({ ...equipForm, image: file });
            } else {
                setInvForm({ ...invForm, image: file });
            }
        }
    };

    const resetEquipForm = () => {
        setEquipForm({
            name: "", category: "3d-printer", brand: "", model: "",
            description: "", status: "available", location: "",
            requiresTraining: false, showInTecnologias: true,
            specifications: [], materials: [], image: null,
        });
        setNewSpecLabel("");
        setNewSpecValue("");
        setNewMaterial("");
        setImagePreview(null);
    };

    const resetInvForm = () => {
        setInvForm({
            name: "", sku: "", category: "consumable", description: "",
            quantity: 0, unit: "unit", minimumStock: 0,
            location: "", supplier: "", unitCost: "",
            notes: "", image: null,
        });
        setImagePreview(null);
    };

    const addSpecification = () => {
        if (newSpecLabel && newSpecValue) {
            setEquipForm({
                ...equipForm,
                specifications: [...equipForm.specifications, { label: newSpecLabel, value: newSpecValue }],
            });
            setNewSpecLabel("");
            setNewSpecValue("");
        }
    };

    const removeSpecification = (idx: number) => {
        setEquipForm({
            ...equipForm,
            specifications: equipForm.specifications.filter((_, i) => i !== idx),
        });
    };

    const addMaterial = () => {
        if (newMaterial && !equipForm.materials.includes(newMaterial)) {
            setEquipForm({ ...equipForm, materials: [...equipForm.materials, newMaterial] });
            setNewMaterial("");
        }
    };

    const removeMaterial = (mat: string) => {
        setEquipForm({ ...equipForm, materials: equipForm.materials.filter(m => m !== mat) });
    };

    // ═══════════════════════════════════════
    // ── EQUIPMENT CRUD ────────────────────
    // ═══════════════════════════════════════

    const buildEquipFormData = () => {
        const form = new FormData();
        form.append("name", equipForm.name);
        form.append("category", equipForm.category);
        form.append("brand", equipForm.brand);
        form.append("model", equipForm.model);
        form.append("description", equipForm.description);
        form.append("status", equipForm.status);
        form.append("location", equipForm.location);
        form.append("requiresTraining", String(equipForm.requiresTraining));
        form.append("showInTecnologias", String(equipForm.showInTecnologias));
        form.append("specifications", JSON.stringify(equipForm.specifications));
        form.append("materials", JSON.stringify(equipForm.materials));
        if (equipForm.image) form.append("image", equipForm.image);
        return form;
    };

    const handleAddEquipment = async () => {
        if (!equipForm.name) { toast.error("El nombre es requerido"); return; }
        try {
            setIsSaving(true);
            const result = await createEquipment(buildEquipFormData());
            if (result.success) {
                setLastCreatedName(equipForm.name);
                setIsEquipDialogOpen(false);
                setIsSuccessDialogOpen(true);
                resetEquipForm();
                loadData();
            } else {
                toast.error(result.error || "Error al crear equipo");
            }
        } catch { toast.error("Error al crear equipo"); }
        finally { setIsSaving(false); }
    };

    const handleEditEquipment = async () => {
        if (!selectedEquipment || !equipForm.name) { toast.error("El nombre es requerido"); return; }
        try {
            setIsSaving(true);
            const result = await updateEquipment(selectedEquipment.id, buildEquipFormData());
            if (result.success) {
                setIsEditEquipDialogOpen(false);
                setSelectedEquipment(null);
                resetEquipForm();
                toast.success("Equipo actualizado");
                loadData();
            } else {
                toast.error(result.error || "Error al actualizar equipo");
            }
        } catch { toast.error("Error al actualizar equipo"); }
        finally { setIsSaving(false); }
    };

    const handleDeleteEquipment = async (eq: EquipmentData) => {
        if (confirm(`¿Eliminar "${eq.name}"?`)) {
            try {
                const result = await deleteEquipment(eq.id);
                if (result.success) { toast.success(`"${eq.name}" eliminado`); loadData(); }
                else toast.error(result.error || "Error al eliminar");
            } catch { toast.error("Error al eliminar equipo"); }
        }
    };

    const handleToggleTecnologias = async (eq: EquipmentData) => {
        try {
            const result = await toggleEquipmentTecnologias(eq.id);
            if (result.success) {
                toast.success(`${eq.name} ${eq.showInTecnologias ? 'oculto de' : 'visible en'} /tecnologías`);
                loadData();
            }
        } catch { toast.error("Error al cambiar visibilidad"); }
    };

    const openEditEquipment = (eq: EquipmentData) => {
        setSelectedEquipment(eq);
        setEquipForm({
            name: eq.name, category: eq.category, brand: eq.brand, model: eq.model,
            description: eq.description, status: eq.status, location: eq.location,
            requiresTraining: eq.requiresTraining, showInTecnologias: eq.showInTecnologias,
            specifications: eq.specifications, materials: eq.materials,
            image: null,
        });
        setImagePreview(eq.featuredImage);
        setIsEditEquipDialogOpen(true);
    };

    const openUsageDialog = (eq: EquipmentData) => {
        setUsageEquipment(eq);
        setUsageDuration("1h");
        setUsageDescription("");
        setIsUsageDialogOpen(true);
    };

    const handleRegisterUsage = async () => {
        if (!usageEquipment) return;
        try {
            setIsSaving(true);
            const result = await registerEquipmentUsage({
                equipmentId: usageEquipment.id,
                equipmentName: usageEquipment.name,
                userId: "",
                userName: "",
                estimatedDuration: usageDuration,
                description: usageDescription,
            });
            if (result.success) {
                toast.success(`Uso de "${usageEquipment.name}" registrado`);
                setIsUsageDialogOpen(false);
                loadData();
            } else {
                toast.error(result.error || "Error al registrar uso");
            }
        } catch {
            toast.error("Error al registrar uso del equipo");
        } finally {
            setIsSaving(false);
        }
    };

    // ═══════════════════════════════════════
    // ── INVENTORY CRUD ────────────────────
    // ═══════════════════════════════════════

    const buildInvFormData = () => {
        const form = new FormData();
        form.append("name", invForm.name);
        form.append("sku", invForm.sku);
        form.append("category", invForm.category);
        form.append("description", invForm.description);
        form.append("quantity", String(invForm.quantity));
        form.append("unit", invForm.unit);
        form.append("minimumStock", String(invForm.minimumStock));
        form.append("location", invForm.location);
        form.append("supplier", invForm.supplier);
        if (invForm.unitCost) form.append("unitCost", invForm.unitCost);
        form.append("notes", invForm.notes);
        if (invForm.image) form.append("image", invForm.image);
        return form;
    };

    const handleAddInventory = async () => {
        if (!invForm.name) { toast.error("El nombre es requerido"); return; }
        try {
            setIsSaving(true);
            const result = await createInventoryItem(buildInvFormData());
            if (result.success) {
                setLastCreatedName(invForm.name);
                setIsInvDialogOpen(false);
                setIsSuccessDialogOpen(true);
                resetInvForm();
                loadData();
            } else {
                toast.error(result.error || "Error al crear item");
            }
        } catch { toast.error("Error al crear item"); }
        finally { setIsSaving(false); }
    };

    const handleEditInventory = async () => {
        if (!selectedInventory || !invForm.name) { toast.error("El nombre es requerido"); return; }
        try {
            setIsSaving(true);
            const result = await updateInventoryItem(selectedInventory.id, buildInvFormData());
            if (result.success) {
                setIsEditInvDialogOpen(false);
                setSelectedInventory(null);
                resetInvForm();
                toast.success("Item actualizado");
                loadData();
            } else {
                toast.error(result.error || "Error al actualizar item");
            }
        } catch { toast.error("Error al actualizar item"); }
        finally { setIsSaving(false); }
    };

    const handleDeleteInventory = async (item: InventoryItemData) => {
        if (confirm(`¿Eliminar "${item.name}"?`)) {
            try {
                const result = await deleteInventoryItem(item.id);
                if (result.success) { toast.success(`"${item.name}" eliminado`); loadData(); }
                else toast.error(result.error || "Error al eliminar");
            } catch { toast.error("Error al eliminar item"); }
        }
    };

    const openEditInventory = (item: InventoryItemData) => {
        setSelectedInventory(item);
        setInvForm({
            name: item.name, sku: item.sku, category: item.category,
            description: item.description, quantity: item.quantity,
            unit: item.unit, minimumStock: item.minimumStock,
            location: item.location, supplier: item.supplier,
            unitCost: item.unitCost !== null ? String(item.unitCost) : "",
            notes: item.notes, image: null,
        });
        setImagePreview(item.image);
        setIsEditInvDialogOpen(true);
    };

    // ═══════════════════════════════════════
    // ── VISUAL HELPERS ────────────────────
    // ═══════════════════════════════════════

    // ═══════════════════════════════════════
    // ── EXCEL HANDLERS ─────────────────────
    // ═══════════════════════════════════════

    const triggerDownload = (base64: string, filename: string) => {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        try {
            setIsExcelBusy(true);
            const result = await exportInventoryToExcel();
            if (result.success && result.data) {
                triggerDownload(result.data, result.filename || 'inventario.xlsx');
                toast.success('Inventario exportado a Excel');
            } else {
                toast.error(result.error || 'Error al exportar');
            }
        } catch { toast.error('Error al exportar a Excel'); }
        finally { setIsExcelBusy(false); }
    };

    const handleDownloadTemplate = async () => {
        try {
            setIsExcelBusy(true);
            const result = await getInventoryExcelTemplate();
            if (result.success && result.data) {
                triggerDownload(result.data, result.filename || 'plantilla_inventario.xlsx');
                toast.success('Plantilla descargada');
            } else {
                toast.error(result.error || 'Error al generar plantilla');
            }
        } catch { toast.error('Error al descargar plantilla'); }
        finally { setIsExcelBusy(false); }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error('Solo se aceptan archivos .xlsx o .xls');
            return;
        }

        try {
            setIsExcelBusy(true);
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            const result = await importInventoryFromExcel(base64);
            if (result.success) {
                const msg = `${result.imported || 0} items importados exitosamente`;
                if (result.errors && result.errors.length > 0) {
                    toast.warning(`${msg}. ${result.errors.length} error(es).`);
                    console.warn('Import errors:', result.errors);
                } else {
                    toast.success(msg);
                }
                setIsImportDialogOpen(false);
                loadData();
            } else {
                toast.error(result.error || 'Error al importar');
            }
        } catch { toast.error('Error al procesar el archivo'); }
        finally {
            setIsExcelBusy(false);
            if (importFileRef.current) importFileRef.current.value = '';
        }
    };

    const getEquipCategoryColor = (cat: string) => {
        const c: Record<string, string> = {
            '3d-printer': 'bg-blue-100 text-blue-700',
            'laser-cutter': 'bg-red-100 text-red-700',
            'cnc': 'bg-purple-100 text-purple-700',
            'electronics': 'bg-green-100 text-green-700',
            'hand-tools': 'bg-yellow-100 text-yellow-700',
            'power-tools': 'bg-orange-100 text-orange-700',
            '3d-scanner': 'bg-indigo-100 text-indigo-700',
            'computing': 'bg-slate-100 text-slate-700',
            'other': 'bg-gray-100 text-gray-700',
        };
        return c[cat] || 'bg-gray-100 text-gray-700';
    };

    const getInvCategoryColor = (cat: string) => {
        const c: Record<string, string> = {
            'consumable': 'bg-cyan-100 text-cyan-700',
            'material': 'bg-amber-100 text-amber-700',
            'component': 'bg-violet-100 text-violet-700',
            'tool': 'bg-lime-100 text-lime-700',
            'supply': 'bg-pink-100 text-pink-700',
            'furniture': 'bg-teal-100 text-teal-700',
            'room': 'bg-sky-100 text-sky-700',
            'other': 'bg-gray-100 text-gray-700',
        };
        return c[cat] || 'bg-gray-100 text-gray-700';
    };

    const getStatusBadge = (status: string) => {
        const s: Record<string, string> = {
            'available': 'bg-green-100 text-green-700',
            'in-use': 'bg-blue-100 text-blue-700',
            'maintenance': 'bg-yellow-100 text-yellow-700',
            'out-of-service': 'bg-red-100 text-red-700',
            'low-stock': 'bg-yellow-100 text-yellow-700',
            'out-of-stock': 'bg-red-100 text-red-700',
        };
        return s[status] || 'bg-gray-100 text-gray-700';
    };

    // ═══════════════════════════════════════
    // ── EQUIPMENT FORM CONTENT ────────────
    // ═══════════════════════════════════════

    const renderEquipForm = () => (
        <div className="space-y-6 py-4">
            {/* Image */}
            <div className="space-y-2">
                <Label>Imagen del equipo</Label>
                <div className="flex items-center gap-4">
                    {imagePreview ? (
                        <div className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                            <Image src={imagePreview} alt="Preview" fill sizes="128px" className="object-cover" />
                            <button type="button" onClick={() => { setImagePreview(null); setEquipForm({ ...equipForm, image: null }); }} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-3 w-3" /></button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-32 h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50">
                            <Upload className="h-6 w-6 text-gray-400" /><span className="text-xs text-gray-500 mt-1">Subir</span>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
            </div>

            {/* Name & Category */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="eq-name">Nombre *</Label>
                    <Input id="eq-name" placeholder="Ej: Prusa MK4" value={equipForm.name} onChange={e => setEquipForm({ ...equipForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select value={equipForm.category} onValueChange={v => setEquipForm({ ...equipForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(EQUIPMENT_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Brand & Model */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="eq-brand">Marca</Label>
                    <Input id="eq-brand" placeholder="Ej: Prusa Research" value={equipForm.brand} onChange={e => setEquipForm({ ...equipForm, brand: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="eq-model">Modelo</Label>
                    <Input id="eq-model" placeholder="Ej: MK4S" value={equipForm.model} onChange={e => setEquipForm({ ...equipForm, model: e.target.value })} />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="eq-desc">Descripción</Label>
                <Textarea id="eq-desc" placeholder="Descripción del equipo..." value={equipForm.description} onChange={e => setEquipForm({ ...equipForm, description: e.target.value })} rows={3} />
            </div>

            {/* Status & Location */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={equipForm.status} onValueChange={v => setEquipForm({ ...equipForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(EQUIPMENT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="eq-location">Ubicación</Label>
                    <Input id="eq-location" placeholder="Ej: Sala principal" value={equipForm.location} onChange={e => setEquipForm({ ...equipForm, location: e.target.value })} />
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <input type="checkbox" id="requiresTraining" checked={equipForm.requiresTraining} onChange={e => setEquipForm({ ...equipForm, requiresTraining: e.target.checked })} className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-5 w-5" />
                    <div>
                        <Label htmlFor="requiresTraining" className="font-medium cursor-pointer">Requiere capacitación</Label>
                        <p className="text-sm text-gray-500">Los usuarios deberán completar una capacitación previa</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <input type="checkbox" id="showInTecnologias" checked={equipForm.showInTecnologias} onChange={e => setEquipForm({ ...equipForm, showInTecnologias: e.target.checked })} className="rounded border-gray-300 text-green-500 focus:ring-green-500 h-5 w-5" />
                    <div>
                        <Label htmlFor="showInTecnologias" className="font-medium cursor-pointer flex items-center gap-2"><Eye className="h-4 w-4 text-green-500" />Mostrar en /tecnologías</Label>
                        <p className="text-sm text-gray-500">Este equipo será visible en la página pública de tecnologías</p>
                    </div>
                </div>
            </div>

            {/* Specifications */}
            <div className="space-y-2">
                <Label>Especificaciones</Label>
                <div className="flex gap-2">
                    <Input placeholder="Etiqueta" value={newSpecLabel} onChange={e => setNewSpecLabel(e.target.value)} className="flex-1" />
                    <Input placeholder="Valor" value={newSpecValue} onChange={e => setNewSpecValue(e.target.value)} className="flex-1" />
                    <Button type="button" variant="outline" onClick={addSpecification}><Plus className="h-4 w-4" /></Button>
                </div>
                {equipForm.specifications.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {equipForm.specifications.map((spec, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-sm">
                                <span className="font-medium">{spec.label}:</span>
                                <span className="text-gray-600 flex-1">{spec.value}</span>
                                <button type="button" onClick={() => removeSpecification(i)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Materials */}
            <div className="space-y-2">
                <Label>Materiales compatibles</Label>
                <div className="flex gap-2">
                    <Input placeholder="Ej: PLA, ABS, PETG..." value={newMaterial} onChange={e => setNewMaterial(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addMaterial())} />
                    <Button type="button" variant="outline" onClick={addMaterial}><Plus className="h-4 w-4" /></Button>
                </div>
                {equipForm.materials.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {equipForm.materials.map(mat => (
                            <span key={mat} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                {mat}
                                <button type="button" onClick={() => removeMaterial(mat)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // ═══════════════════════════════════════
    // ── INVENTORY FORM CONTENT ────────────
    // ═══════════════════════════════════════

    const renderInvForm = () => (
        <div className="space-y-6 py-4">
            {/* Image */}
            <div className="space-y-2">
                <Label>Imagen del item</Label>
                <div className="flex items-center gap-4">
                    {imagePreview ? (
                        <div className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                            <Image src={imagePreview} alt="Preview" fill sizes="128px" className="object-cover" />
                            <button type="button" onClick={() => { setImagePreview(null); setInvForm({ ...invForm, image: null }); }} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-3 w-3" /></button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="w-32 h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50">
                            <Upload className="h-6 w-6 text-gray-400" /><span className="text-xs text-gray-500 mt-1">Subir</span>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
            </div>

            {/* Name & SKU */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="inv-name">Nombre *</Label>
                    <Input id="inv-name" placeholder="Ej: Filamento PLA 1kg" value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inv-sku">SKU / Código</Label>
                    <Input id="inv-sku" placeholder="Ej: FIL-PLA-001" value={invForm.sku} onChange={e => setInvForm({ ...invForm, sku: e.target.value })} />
                </div>
            </div>

            {/* Category & Unit */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select value={invForm.category} onValueChange={v => setInvForm({ ...invForm, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(INVENTORY_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Select value={invForm.unit} onValueChange={v => setInvForm({ ...invForm, unit: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(INVENTORY_UNITS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quantity & Minimum Stock */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="inv-qty">Cantidad</Label>
                    <Input id="inv-qty" type="number" min={0} value={invForm.quantity} onChange={e => setInvForm({ ...invForm, quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inv-min">Stock mínimo</Label>
                    <Input id="inv-min" type="number" min={0} value={invForm.minimumStock} onChange={e => setInvForm({ ...invForm, minimumStock: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inv-cost">Costo unitario</Label>
                    <Input id="inv-cost" type="number" min={0} step={0.01} placeholder="$0.00" value={invForm.unitCost} onChange={e => setInvForm({ ...invForm, unitCost: e.target.value })} />
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="inv-desc">Descripción</Label>
                <Textarea id="inv-desc" placeholder="Descripción del item..." value={invForm.description} onChange={e => setInvForm({ ...invForm, description: e.target.value })} rows={2} />
            </div>

            {/* Location & Supplier */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="inv-location">Ubicación</Label>
                    <Input id="inv-location" placeholder="Ej: Estante A, Cajón 3" value={invForm.location} onChange={e => setInvForm({ ...invForm, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="inv-supplier">Proveedor</Label>
                    <Input id="inv-supplier" placeholder="Ej: 3D Market Chile" value={invForm.supplier} onChange={e => setInvForm({ ...invForm, supplier: e.target.value })} />
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="inv-notes">Notas</Label>
                <Textarea id="inv-notes" placeholder="Notas adicionales..." value={invForm.notes} onChange={e => setInvForm({ ...invForm, notes: e.target.value })} rows={2} />
            </div>
        </div>
    );

    // ═══════════════════════════════════════
    // ── RENDER ─────────────────────────────
    // ═══════════════════════════════════════

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipos e Inventario</h1>
                    <p className="text-gray-600 mt-1">Gestiona equipos, insumos y materiales del FabLab</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => router.push('/admin/equipment-usage')}>
                    <Activity className="h-4 w-4" />
                    Panel de Uso
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><Cpu className="h-4 w-4" />Equipos</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{equipmentList.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><Monitor className="h-4 w-4" />Disponibles</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-600">{availableEquipment}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><Package className="h-4 w-4" />Inventario</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{inventoryList.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Stock Bajo</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-red-600">{lowStockItems}</div></CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSearchQuery(""); }}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="equipment" className="gap-2"><Cpu className="h-4 w-4" />Equipos ({equipmentList.length})</TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2"><Package className="h-4 w-4" />Inventario ({inventoryList.length})</TabsTrigger>
                </TabsList>

                {/* ═══════ EQUIPMENT TAB ═══════ */}
                <TabsContent value="equipment" className="space-y-4">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Buscar equipo por nombre, marca o modelo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={equipCategoryFilter} onValueChange={setEquipCategoryFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {Object.entries(EQUIPMENT_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => { resetEquipForm(); setIsEquipDialogOpen(true); }}>
                            <Plus className="h-4 w-4" />Nuevo Equipo
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /><span className="ml-2 text-gray-600">Cargando...</span></div>
                            ) : filteredEquipment.length === 0 ? (
                                <div className="text-center py-12"><Cpu className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">No hay equipos</p><p className="text-sm text-gray-500 mt-1">Agrega el primer equipo del FabLab</p></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[70px]">Imagen</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Marca / Modelo</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead className="text-center">Usos activos</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-center">/tecnologías</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEquipment.map(eq => (
                                            <TableRow key={eq.id}>
                                                <TableCell>
                                                    {eq.featuredImage ? (
                                                        <Image src={eq.featuredImage} alt={eq.name} width={56} height={40} className="w-14 h-10 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-14 h-10 rounded bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><Cpu className="h-4 w-4 text-gray-400" /></div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{eq.name}</p>
                                                        {eq.description && <p className="text-xs text-gray-500 line-clamp-1">{eq.description}</p>}
                                                    </div>
                                                </TableCell>
                                                <TableCell><Badge className={getEquipCategoryColor(eq.category)}>{EQUIPMENT_CATEGORIES[eq.category] || eq.category}</Badge></TableCell>
                                                <TableCell><span className="text-sm text-gray-700">{[eq.brand, eq.model].filter(Boolean).join(' ') || '—'}</span></TableCell>
                                                <TableCell>
                                                    {eq.location ? (
                                                        <span className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" />{eq.location}</span>
                                                    ) : <span className="text-gray-400 text-sm">—</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {eq.activeUsages > 0 ? (
                                                        <Badge className="bg-blue-100 text-blue-700"><Activity className="h-3 w-3 mr-1" />{eq.activeUsages}</Badge>
                                                    ) : <span className="text-gray-400 text-sm">0</span>}
                                                </TableCell>
                                                <TableCell className="text-center"><Badge className={getStatusBadge(eq.status)}>{EQUIPMENT_STATUS[eq.status] || eq.status}</Badge></TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="sm" onClick={() => handleToggleTecnologias(eq)} className={eq.showInTecnologias ? "text-green-600" : "text-gray-400"}>
                                                        {eq.showInTecnologias ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {eq.status === 'available' && eq.activeUsages === 0 && (
                                                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Registrar uso" onClick={() => openUsageDialog(eq)}>
                                                                <Play className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="ghost" onClick={() => openEditEquipment(eq)}><Edit className="h-4 w-4" /></Button>
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteEquipment(eq)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ═══════ INVENTORY TAB ═══════ */}
                <TabsContent value="inventory" className="space-y-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Buscar item por nombre, SKU o proveedor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={invCategoryFilter} onValueChange={setInvCategoryFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {Object.entries(INVENTORY_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={isExcelBusy || inventoryList.length === 0}>
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Exportar</span>
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => setIsImportDialogOpen(true)} disabled={isExcelBusy}>
                            <FileUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Importar</span>
                        </Button>
                        <Button className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => { resetInvForm(); setIsInvDialogOpen(true); }}>
                            <Plus className="h-4 w-4" />Nuevo Item
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /><span className="ml-2 text-gray-600">Cargando...</span></div>
                            ) : filteredInventory.length === 0 ? (
                                <div className="text-center py-12"><Package className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">No hay items de inventario</p><p className="text-sm text-gray-500 mt-1">Agrega el primer item al inventario</p></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[70px]">Imagen</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead className="text-center">Cantidad</TableHead>
                                            <TableHead>Ubicación</TableHead>
                                            <TableHead>Proveedor</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInventory.map(item => (
                                            <TableRow key={item.id} className={item.status === 'out-of-stock' ? 'bg-red-50/50' : item.status === 'low-stock' ? 'bg-yellow-50/50' : ''}>
                                                <TableCell>
                                                    {item.image ? (
                                                        <Image src={item.image} alt={item.name} width={56} height={40} className="w-14 h-10 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-14 h-10 rounded bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><Package className="h-4 w-4 text-gray-400" /></div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        {item.description && <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>}
                                                    </div>
                                                </TableCell>
                                                <TableCell><span className="text-sm font-mono text-gray-600">{item.sku || '—'}</span></TableCell>
                                                <TableCell><Badge className={getInvCategoryColor(item.category)}>{INVENTORY_CATEGORIES[item.category] || item.category}</Badge></TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`font-bold ${item.status === 'out-of-stock' ? 'text-red-600' : item.status === 'low-stock' ? 'text-yellow-600' : 'text-gray-900'}`}>
                                                            {item.quantity}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{INVENTORY_UNITS[item.unit] || item.unit}</span>
                                                        {item.minimumStock > 0 && (
                                                            <span className="text-xs text-gray-400">mín: {item.minimumStock}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.location ? (
                                                        <span className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
                                                    ) : <span className="text-gray-400 text-sm">—</span>}
                                                </TableCell>
                                                <TableCell><span className="text-sm text-gray-600">{item.supplier || '—'}</span></TableCell>
                                                <TableCell className="text-center"><Badge className={getStatusBadge(item.status)}>{INVENTORY_STATUS[item.status] || item.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="sm" variant="ghost" onClick={() => openEditInventory(item)}><Edit className="h-4 w-4" /></Button>
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteInventory(item)}><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ═══════ EQUIPMENT DIALOGS ═══════ */}
            <Dialog open={isEquipDialogOpen} onOpenChange={open => { setIsEquipDialogOpen(open); if (!open) resetEquipForm(); }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-orange-500" />Nuevo Equipo</DialogTitle>
                        <DialogDescription>Agrega un nuevo equipo al FabLab</DialogDescription>
                    </DialogHeader>
                    {renderEquipForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEquipDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleAddEquipment} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : <><Plus className="h-4 w-4 mr-2" />Crear Equipo</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditEquipDialogOpen} onOpenChange={open => { setIsEditEquipDialogOpen(open); if (!open) { setSelectedEquipment(null); resetEquipForm(); } }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-orange-500" />Editar Equipo</DialogTitle></DialogHeader>
                    {renderEquipForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditEquipDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleEditEquipment} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════ INVENTORY DIALOGS ═══════ */}
            <Dialog open={isInvDialogOpen} onOpenChange={open => { setIsInvDialogOpen(open); if (!open) resetInvForm(); }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-orange-500" />Nuevo Item de Inventario</DialogTitle>
                        <DialogDescription>Agrega un nuevo item al inventario del FabLab</DialogDescription>
                    </DialogHeader>
                    {renderInvForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInvDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleAddInventory} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : <><Plus className="h-4 w-4 mr-2" />Crear Item</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditInvDialogOpen} onOpenChange={open => { setIsEditInvDialogOpen(open); if (!open) { setSelectedInventory(null); resetInvForm(); } }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-orange-500" />Editar Item</DialogTitle></DialogHeader>
                    {renderInvForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditInvDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleEditInventory} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════ USAGE REGISTRATION DIALOG ═══════ */}
            <Dialog open={isUsageDialogOpen} onOpenChange={open => { setIsUsageDialogOpen(open); if (!open) setUsageEquipment(null); }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Play className="h-5 w-5 text-green-500" />Registrar Uso de Equipo</DialogTitle>
                        <DialogDescription>
                            Equipo: <span className="font-semibold text-gray-900">{usageEquipment?.name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Duración estimada *</Label>
                            <Select value={usageDuration} onValueChange={setUsageDuration}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30min">30 minutos</SelectItem>
                                    <SelectItem value="1h">1 hora</SelectItem>
                                    <SelectItem value="2h">2 horas</SelectItem>
                                    <SelectItem value="4h">4 horas</SelectItem>
                                    <SelectItem value="8h">8 horas (día completo)</SelectItem>
                                    <SelectItem value="1d">1 día</SelectItem>
                                    <SelectItem value="2d">2 días</SelectItem>
                                    <SelectItem value="1w">1 semana</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción / Proyecto</Label>
                            <Textarea placeholder="¿Para qué se usará?" value={usageDescription} onChange={e => setUsageDescription(e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUsageDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleRegisterUsage} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</> : <><Play className="h-4 w-4 mr-2" />Iniciar Uso</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════ EXCEL IMPORT DIALOG ═══════ */}
            <Dialog open={isImportDialogOpen} onOpenChange={open => { setIsImportDialogOpen(open); if (!open && importFileRef.current) importFileRef.current.value = ''; }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-green-600" />Importar Inventario desde Excel</DialogTitle>
                        <DialogDescription>Sube un archivo Excel (.xlsx) con los datos del inventario. Puedes descargar una plantilla de ejemplo primero.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="rounded-lg border-2 border-dashed border-orange-200 bg-orange-50/50 p-5 text-center space-y-3">
                            <FileSpreadsheet className="h-10 w-10 text-orange-400 mx-auto" />
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Selecciona un archivo Excel</p>
                                <p className="text-xs text-gray-500">Formato aceptado: .xlsx, .xls</p>
                            </div>
                            <input ref={importFileRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer" disabled={isExcelBusy} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400">o</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        <Button variant="outline" className="w-full gap-2" onClick={handleDownloadTemplate} disabled={isExcelBusy}>
                            {isExcelBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Descargar plantilla de ejemplo
                        </Button>
                        <p className="text-xs text-gray-500 text-center">La plantilla incluye datos de ejemplo e instrucciones para llenar correctamente el archivo.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isExcelBusy}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════ SUCCESS DIALOG ═══════ */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"><CheckCircle className="h-8 w-8 text-green-600" /></div>
                        <DialogTitle className="text-xl mb-2">¡Creado exitosamente!</DialogTitle>
                        <DialogDescription className="text-base"><span className="font-semibold text-gray-900">&quot;{lastCreatedName}&quot;</span> ha sido creado exitosamente</DialogDescription>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={() => setIsSuccessDialogOpen(false)} className="bg-green-600 hover:bg-green-700">Entendido</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
