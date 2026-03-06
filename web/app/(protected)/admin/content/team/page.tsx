"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Badge } from "@/shared/ui/misc/badge";
import { Label } from "@/shared/ui/labels/label";
import { Switch } from "@/shared/ui/misc/switch";
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
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2,
    CheckCircle,
    Upload,
    User as UserIcon,
    Eye,
    EyeOff,
    Move,
    AlertCircle,
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Calendar,
    Clock,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { WeeklyScheduleEditor } from "./weekly-schedule-editor";
import { 
    getAllTeamUsers,
    createTeamMember, 
    updateTeamMember, 
    deleteTeamMember,
    toggleTeamMemberStatus,
    searchSpecialists,
    getFilterOptions,
    type TeamMemberData as ActionTeamMemberData,
    type SpecialistSearchFilters,
    type DaySchedule,
} from "./actions";
import { ImagePositionEditor } from "./image-position-editor";

const getObjectPosition = (position: string) => {
    if (!position) return '50% 50%';
    // Si ya es formato "X% Y%", devolverlo tal cual
    if (position.includes('%')) return position;
    // Valores legacy predefinidos
    const positions: Record<string, string> = {
        'center': '50% 50%',
        'top': '50% 20%',
        'bottom': '50% 80%',
        'left': '20% 50%',
        'right': '80% 50%',
        'top-left': '20% 20%',
        'top-right': '80% 20%',
        'bottom-left': '20% 80%',
        'bottom-right': '80% 80%',
    };
    return positions[position] || '50% 50%';
};

interface TeamMemberData {
    id: string;
    name: string;
    email: string;
    role: string;
    category: string;
    specialty: string;
    bio: string;
    experience: string;
    image: string | null;
    imagePosition: string;
    active: boolean;
    userRole: string;
    educationStatus: string;
    personalSkills?: string[];
    technicalDomain?: string[];
    availabilityMode?: string;
    weeklySchedule?: DaySchedule[];
    docenteResponsable?: { id: string; name: string } | null;
}

export default function TeamMembersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [membersList, setMembersList] = useState<TeamMemberData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
    const [lastCreatedName, setLastCreatedName] = useState("");
    const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        profession: "",
        category: "specialist",
        educationStatus: "graduated",
        imagePosition: "50% 50%",
        bio: "",
        active: true,
        isAdmin: false,
        image: null as File | null,
        personalSkills: [] as string[],
        technicalDomain: [] as string[],
        availabilityMode: "" as string,
        weeklySchedule: [] as DaySchedule[],
        docenteResponsable: "" as string,
    });
    const [skillInput, setSkillInput] = useState("");
    const [domainInput, setDomainInput] = useState("");
    const [docentesList, setDocentesList] = useState<{id: string; name: string}[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saveError, setSaveError] = useState<string | null>(null);

    // ── Advanced filters ──
    const [showFilters, setShowFilters] = useState(false);
    const [filterSkills, setFilterSkills] = useState<string[]>([]);
    const [filterDomains, setFilterDomains] = useState<string[]>([]);
    const [filterMode, setFilterMode] = useState<string>('');
    const [filterDay, setFilterDay] = useState<string>('');
    const [filterStartTime, setFilterStartTime] = useState<string>('');
    const [filterEndTime, setFilterEndTime] = useState<string>('');
    const [allSkills, setAllSkills] = useState<string[]>([]);
    const [allDomains, setAllDomains] = useState<string[]>([]);

    const loadMembers = useCallback(async () => {
        try {
            setIsLoading(true);
            const members = await getAllTeamUsers();
            setMembersList(members);
        } catch (error) {
            console.error("Error cargando miembros:", error);
            toast.error("Error al cargar miembros del equipo");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Build unique skills/domains for filter dropdowns
    useEffect(() => {
        const skills = new Set<string>();
        const domains = new Set<string>();
        membersList.forEach(m => {
            m.personalSkills?.forEach(s => skills.add(s));
            m.technicalDomain?.forEach(d => domains.add(d));
        });
        setAllSkills(Array.from(skills).sort());
        setAllDomains(Array.from(domains).sort());
    }, [membersList]);

    const activeMembers = membersList.filter(m => m.active).length;
    const totalMembers = membersList.length;

    const hasActiveFilters = filterSkills.length > 0 || filterDomains.length > 0 || filterMode || filterDay || filterStartTime || filterEndTime;

    const clearAllFilters = () => {
        setFilterSkills([]);
        setFilterDomains([]);
        setFilterMode('');
        setFilterDay('');
        setFilterStartTime('');
        setFilterEndTime('');
    };

    const filteredMembers = membersList.filter(member => {
        // Text search
        const q = searchQuery.toLowerCase();
        if (q) {
            const matchesText = member.name.toLowerCase().includes(q) ||
                member.email.toLowerCase().includes(q) ||
                (member.role || '').toLowerCase().includes(q) ||
                (member.personalSkills || []).some(s => s.toLowerCase().includes(q)) ||
                (member.technicalDomain || []).some(s => s.toLowerCase().includes(q));
            if (!matchesText) return false;
        }

        // Skills filter
        if (filterSkills.length > 0) {
            const hasSkill = filterSkills.some(fs =>
                (member.personalSkills || []).some(ms => ms.toLowerCase().includes(fs.toLowerCase()))
            );
            if (!hasSkill) return false;
        }

        // Domain filter
        if (filterDomains.length > 0) {
            const hasDomain = filterDomains.some(fd =>
                (member.technicalDomain || []).some(md => md.toLowerCase().includes(fd.toLowerCase()))
            );
            if (!hasDomain) return false;
        }

        // Availability mode filter
        if (filterMode && member.availabilityMode !== filterMode) return false;

        // Day filter
        if (filterDay) {
            const daySchedule = (member.weeklySchedule || []).find(d => d.day === filterDay && d.active);
            if (!daySchedule) return false;

            // Time range filter (only when day is set)
            if (filterStartTime && filterEndTime) {
                const hasOverlap = daySchedule.timeRanges.some(range =>
                    range.startTime <= filterEndTime && range.endTime >= filterStartTime
                );
                if (!hasOverlap) return false;
            }
        }

        return true;
    });

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            profession: "",
            category: "specialist",
            educationStatus: "graduated",
            imagePosition: "50% 50%",
            bio: "",
            active: true,
            isAdmin: false,
            image: null,
            personalSkills: [],
            technicalDomain: [],
            availabilityMode: "",
            weeklySchedule: [],
            docenteResponsable: "",
        });
        setSkillInput("");
        setDomainInput("");
        setFormErrors({});
        setSaveError(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Cargar lista de docentes para el selector
    useEffect(() => {
        const loadDocentes = async () => {
            try {
                const members = await getAllTeamUsers();
                const docentes = members.filter((m) => m.category === 'docente' || m.category === 'leadership');
                setDocentesList(docentes.map((d) => ({ id: d.id, name: d.name })));
            } catch (e) {
                console.error('Error loading docentes:', e);
            }
        };
        loadDocentes();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddMember = async () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'El nombre es obligatorio.';
        if (!formData.email.trim()) errors.email = 'El correo es obligatorio.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'El formato de correo no es válido.';
        setFormErrors(errors);
        setSaveError(null);
        if (Object.keys(errors).length > 0) {
            toast.error('Corrige los errores antes de guardar.');
            return;
        }

        try {
            setIsSaving(true);
            const form = new FormData();
            form.append('name', formData.name);
            form.append('email', formData.email);
            if (formData.password) {
                form.append('password', formData.password);
            }
            form.append('role', formData.profession);
            form.append('specialty', formData.profession);
            form.append('category', formData.category);
            form.append('educationStatus', formData.educationStatus);
            form.append('imagePosition', formData.imagePosition);
            form.append('bio', formData.bio);
            form.append('isAdmin', String(formData.isAdmin));
            form.append('personalSkills', JSON.stringify(formData.personalSkills));
            form.append('technicalDomain', JSON.stringify(formData.technicalDomain));
            if (formData.availabilityMode) {
                form.append('availabilityMode', formData.availabilityMode);
            }
            form.append('weeklySchedule', JSON.stringify(formData.weeklySchedule));
            if (formData.docenteResponsable) {
                form.append('docenteResponsable', formData.docenteResponsable);
            }
            
            if (formData.image) {
                form.append('image', formData.image);
            }
            
            const result = await createTeamMember(form);
            
            if (result.success) {
                setLastCreatedName(formData.name);
                setIsAddDialogOpen(false);
                setIsSuccessDialogOpen(true);
                resetForm();
                loadMembers();
            } else {
                const msg = result.error || 'Error al crear miembro';
                setSaveError(msg);
                toast.error(msg);
            }
        } catch (error: unknown) {
            console.error('Error creando miembro:', error);
            const msg = error instanceof Error ? error.message : 'Error inesperado al crear miembro';
            setSaveError(msg);
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditMember = async () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'El nombre es obligatorio.';
        setFormErrors(errors);
        setSaveError(null);
        if (Object.keys(errors).length > 0) {
            toast.error('Corrige los errores antes de guardar.');
            return;
        }
        if (!selectedMember) return;

        try {
            setIsSaving(true);
            const form = new FormData();
            form.append('name', formData.name);
            form.append('email', formData.email);
            form.append('role', formData.profession);
            form.append('specialty', formData.profession);
            form.append('category', formData.category);
            form.append('educationStatus', formData.educationStatus);
            form.append('imagePosition', formData.imagePosition);
            form.append('bio', formData.bio);
            form.append('active', String(formData.active));
            form.append('isAdmin', String(formData.isAdmin));
            form.append('personalSkills', JSON.stringify(formData.personalSkills));
            form.append('technicalDomain', JSON.stringify(formData.technicalDomain));
            if (formData.availabilityMode) {
                form.append('availabilityMode', formData.availabilityMode);
            }
            form.append('weeklySchedule', JSON.stringify(formData.weeklySchedule));
            form.append('docenteResponsable', formData.docenteResponsable || '');
            
            if (formData.image) {
                form.append('image', formData.image);
            }
            
            const result = await updateTeamMember(selectedMember.id, form);
            
            if (result.success) {
                setIsEditDialogOpen(false);
                setSelectedMember(null);
                resetForm();
                toast.success('Miembro actualizado correctamente');
                loadMembers();
            } else {
                const msg = result.error || 'Error al actualizar miembro';
                setSaveError(msg);
                toast.error(msg);
            }
        } catch (error: unknown) {
            console.error('Error actualizando miembro:', error);
            const msg = error instanceof Error ? error.message : 'Error inesperado al actualizar miembro';
            setSaveError(msg);
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMember = async (member: TeamMemberData) => {
        if (confirm(`¿Estás seguro de quitar a ${member.name} del equipo?`)) {
            try {
                await deleteTeamMember(member.id);
                toast.success(`${member.name} quitado del equipo`);
                loadMembers();
            } catch (error) {
                console.error("Error eliminando miembro:", error);
                toast.error("Error al eliminar miembro");
            }
        }
    };

    const handleToggleStatus = async (member: TeamMemberData) => {
        try {
            await toggleTeamMemberStatus(member.id, !member.active);
            toast.success(`${member.name} ${!member.active ? 'visible' : 'oculto'} en /equipo`);
            loadMembers();
        } catch (error) {
            console.error("Error cambiando estado:", error);
            toast.error("Error al cambiar estado");
        }
    };

    const openEditDialog = (member: TeamMemberData) => {
        setSelectedMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            password: "",
            profession: member.role || member.specialty,
            category: member.category || "specialist",
            educationStatus: member.educationStatus || "graduated",
            imagePosition: member.imagePosition || "50% 50%",
            bio: member.bio || "",
            active: member.active,
            image: null,
            isAdmin: member.userRole === 'admin',
            personalSkills: member.personalSkills || [],
            technicalDomain: member.technicalDomain || [],
            availabilityMode: member.availabilityMode || "",
            weeklySchedule: member.weeklySchedule || [],
            docenteResponsable: member.docenteResponsable?.id || "",
        });
        setSkillInput("");
        setDomainInput("");
        setImagePreview(member.image || null);
        setIsEditDialogOpen(true);
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            'leadership': 'Directivo',
            'specialist': 'Especialista',
            'collaborator': 'Colaborador',
            'docente': 'Docente',
        };
        return labels[cat] || cat;
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'leadership': 'bg-purple-100 text-purple-700',
            'specialist': 'bg-blue-100 text-blue-700',
            'collaborator': 'bg-green-100 text-green-700',
            'docente': 'bg-amber-100 text-amber-700',
        };
        return colors[cat] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Equipo</h1>
                <p className="text-gray-600 mt-1">Gestiona los miembros del equipo que aparecen en /equipo</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Total Miembros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalMembers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Visibles en /equipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{activeMembers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <EyeOff className="h-4 w-4" />
                            Ocultos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-400">{totalMembers - activeMembers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Actions */}
            <div className="space-y-3">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nombre, correo, cargo o habilidad..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        className={showFilters ? "gap-2 bg-orange-500 hover:bg-orange-600" : "gap-2"}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-white text-orange-600 rounded-full">
                                {[filterSkills.length > 0, filterDomains.length > 0, !!filterMode, !!filterDay, !!(filterStartTime && filterEndTime)].filter(Boolean).length}
                            </span>
                        )}
                    </Button>
                    <Button className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Agregar Miembro
                    </Button>
                </div>

                {/* Advanced Filter Panel */}
                {showFilters && (
                    <Card className="border-orange-200 bg-orange-50/40">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-orange-500" />
                                    Filtros Avanzados
                                </h3>
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-600 gap-1">
                                        <X className="h-3 w-3" />
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Habilidades Personales */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Habilidades Personales</Label>
                                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                                        {allSkills.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">Sin datos</p>
                                        ) : allSkills.map((skill) => {
                                            const isActive = filterSkills.includes(skill);
                                            return (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => setFilterSkills(prev =>
                                                        isActive ? prev.filter(s => s !== skill) : [...prev, skill]
                                                    )}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                                        isActive
                                                            ? 'bg-orange-500 text-white border-orange-500'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                                                    }`}
                                                >
                                                    {skill}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dominio Técnico */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Dominio Técnico</Label>
                                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                                        {allDomains.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">Sin datos</p>
                                        ) : allDomains.map((domain) => {
                                            const isActive = filterDomains.includes(domain);
                                            return (
                                                <button
                                                    key={domain}
                                                    type="button"
                                                    onClick={() => setFilterDomains(prev =>
                                                        isActive ? prev.filter(d => d !== domain) : [...prev, domain]
                                                    )}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                                        isActive
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                                    }`}
                                                >
                                                    {domain}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Modalidad */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Modalidad</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: 'presencial', label: 'Presencial', color: 'green' },
                                            { value: 'remoto', label: 'Remoto', color: 'blue' },
                                            { value: 'hibrido', label: 'Híbrido', color: 'purple' },
                                        ].map((mode) => {
                                            const isActive = filterMode === mode.value;
                                            return (
                                                <button
                                                    key={mode.value}
                                                    type="button"
                                                    onClick={() => setFilterMode(isActive ? '' : mode.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                        isActive
                                                            ? `bg-${mode.color}-500 text-white border-${mode.color}-500`
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    {mode.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Día Específico */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Día Específico
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { value: 'monday', label: 'Lun' },
                                            { value: 'tuesday', label: 'Mar' },
                                            { value: 'wednesday', label: 'Mié' },
                                            { value: 'thursday', label: 'Jue' },
                                            { value: 'friday', label: 'Vie' },
                                            { value: 'saturday', label: 'Sáb' },
                                            { value: 'sunday', label: 'Dom' },
                                        ].map((day) => {
                                            const isActive = filterDay === day.value;
                                            return (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFilterDay(isActive ? '' : day.value);
                                                        if (isActive) {
                                                            setFilterStartTime('');
                                                            setFilterEndTime('');
                                                        }
                                                    }}
                                                    className={`w-10 h-10 rounded-lg text-xs font-semibold border transition-all ${
                                                        isActive
                                                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                                    }`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Rango Horario (solo visible si hay día seleccionado) */}
                                {filterDay && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Rango Horario
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={filterStartTime}
                                                onChange={(e) => setFilterStartTime(e.target.value)}
                                                className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 w-[7rem] tabular-nums"
                                            />
                                            <span className="text-gray-400 text-sm">→</span>
                                            <input
                                                type="time"
                                                value={filterEndTime}
                                                onChange={(e) => setFilterEndTime(e.target.value)}
                                                className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 w-[7rem] tabular-nums"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400">Filtra miembros disponibles en este horario</p>
                                    </div>
                                )}
                            </div>

                            {/* Active filter summary */}
                            {hasActiveFilters && (
                                <div className="pt-2 border-t border-orange-200/60 flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium">Mostrando:</span>
                                    <span className="font-bold text-orange-600">{filteredMembers.length}</span>
                                    <span>de {membersList.length} miembros</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Cargando...</span>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No hay miembros del equipo</p>
                            <p className="text-sm text-gray-500 mt-1">Agrega el primer miembro para que aparezca en /equipo</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Foto</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Correo</TableHead>
                                    <TableHead>Cargo</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-center">Visible</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            {member.image ? (
                                                <Image 
                                                    src={member.image} 
                                                    alt={member.name}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell className="text-gray-600">{member.email}</TableCell>
                                        <TableCell>{member.role || member.specialty || '-'}</TableCell>
                                        <TableCell>
                                            <Badge className={getCategoryColor(member.category)}>
                                                {getCategoryLabel(member.category)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(member)}
                                                className={member.active ? "text-green-600" : "text-gray-400"}
                                            >
                                                {member.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => openEditDialog(member)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteMember(member)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-orange-500" />
                            Agregar al Equipo
                        </DialogTitle>
                        <DialogDescription>
                            Crea un nuevo miembro que aparecerá en /equipo y podrá iniciar sesión
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Foto */}
                        <div className="space-y-2">
                            <Label>Foto de perfil</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            width={80}
                                            height={80}
                                            className="w-20 h-20 rounded-full border-2 border-gray-200"
                                            style={{ objectFit: 'cover', objectPosition: getObjectPosition(formData.imagePosition) }}
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                            <UserIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            {imagePreview ? 'Reemplazar' : 'Subir imagen'}
                                        </Button>
                                        {imagePreview && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsPositionEditorOpen(true)}
                                                className="gap-2"
                                            >
                                                <Move className="h-4 w-4" />
                                                Ajustar posición
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo *</Label>
                            <Input
                                id="name"
                                placeholder="Ej: César Salcedo"
                                value={formData.name}
                                onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                                className={formErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            {formErrors.name && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.email; return n; }); }}
                                className={formErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            {formErrors.email && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.email}</p>}
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña (para login)</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500">Permite al miembro iniciar sesión en /admin</p>
                        </div>

                        {/* Cargo */}
                        <div className="space-y-2">
                            <Label htmlFor="profession">Cargo / Especialidad</Label>
                            <Input
                                id="profession"
                                placeholder="Ej: Ing. Informático, Diseñador 3D"
                                value={formData.profession}
                                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                            />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                            <Label>Categoría *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="leadership">Equipo Directivo</SelectItem>
                                    <SelectItem value="specialist">Especialista</SelectItem>
                                    <SelectItem value="collaborator">Colaborador</SelectItem>
                                    <SelectItem value="docente">Docente Responsable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estado de Estudios */}
                        <div className="space-y-2">
                            <Label>Estado de Estudios</Label>
                            <Select
                                value={formData.educationStatus}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, educationStatus: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona estado de estudios" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="graduated">Egresado</SelectItem>
                                    <SelectItem value="studying">Cursando</SelectItem>
                                    <SelectItem value="titled">Titulado</SelectItem>
                                    <SelectItem value="bachelor">Bachiller</SelectItem>
                                    <SelectItem value="masters">Maestría</SelectItem>
                                    <SelectItem value="doctorate">Doctorado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Habilidades Personales - Tag Input */}
                        <div className="space-y-2">
                            <Label>Habilidades Personales</Label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {formData.personalSkills.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                        {skill}
                                        <button type="button" onClick={() => setFormData(prev => ({
                                            ...prev,
                                            personalSkills: prev.personalSkills.filter((_, idx) => idx !== i)
                                        }))} className="hover:text-orange-900">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Liderazgo, Comunicación..."
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && skillInput.trim()) {
                                            e.preventDefault();
                                            setFormData(prev => ({
                                                ...prev,
                                                personalSkills: prev.personalSkills.includes(skillInput.trim())
                                                    ? prev.personalSkills
                                                    : [...prev.personalSkills, skillInput.trim()]
                                            }));
                                            setSkillInput("");
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    if (skillInput.trim()) {
                                        setFormData(prev => ({
                                            ...prev,
                                            personalSkills: prev.personalSkills.includes(skillInput.trim())
                                                ? prev.personalSkills
                                                : [...prev.personalSkills, skillInput.trim()]
                                        }));
                                        setSkillInput("");
                                    }
                                }}>+</Button>
                            </div>
                        </div>

                        {/* Dominio Técnico - Tag Input */}
                        <div className="space-y-2">
                            <Label>Dominio Técnico</Label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {formData.technicalDomain.map((domain, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                        {domain}
                                        <button type="button" onClick={() => setFormData(prev => ({
                                            ...prev,
                                            technicalDomain: prev.technicalDomain.filter((_, idx) => idx !== i)
                                        }))} className="hover:text-blue-900">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Impresión 3D, Arduino..."
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && domainInput.trim()) {
                                            e.preventDefault();
                                            setFormData(prev => ({
                                                ...prev,
                                                technicalDomain: prev.technicalDomain.includes(domainInput.trim())
                                                    ? prev.technicalDomain
                                                    : [...prev.technicalDomain, domainInput.trim()]
                                            }));
                                            setDomainInput("");
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    if (domainInput.trim()) {
                                        setFormData(prev => ({
                                            ...prev,
                                            technicalDomain: prev.technicalDomain.includes(domainInput.trim())
                                                ? prev.technicalDomain
                                                : [...prev.technicalDomain, domainInput.trim()]
                                        }));
                                        setDomainInput("");
                                    }
                                }}>+</Button>
                            </div>
                        </div>

                        {/* Disponibilidad */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Disponibilidad</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                    { value: 'presencial', label: 'Presencial' },
                                    { value: 'remoto', label: 'Remoto' },
                                    { value: 'hibrido', label: 'Híbrido' },
                                ].map((mode) => {
                                    const isActive = formData.availabilityMode === mode.value;
                                    return (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, availabilityMode: isActive ? '' : mode.value }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                isActive
                                                    ? 'bg-orange-500 text-white border-orange-500'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <WeeklyScheduleEditor
                                value={formData.weeklySchedule}
                                onChange={(schedule) => setFormData(prev => ({ ...prev, weeklySchedule: schedule }))}
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Biografía corta</Label>
                            <textarea
                                id="bio"
                                placeholder="Describe brevemente al miembro..."
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {/* Permisos de Administrador */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="space-y-0.5">
                                <Label htmlFor="isAdmin" className="text-sm font-medium">
                                    Usuario con permisos de administrador
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Tendrá acceso completo a todas las secciones del panel de administración
                                </p>
                            </div>
                            <Switch
                                id="isAdmin"
                                checked={formData.isAdmin}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAdmin: checked }))}
                            />
                        </div>
                    </div>
                    {(Object.keys(formErrors).length > 0 || saveError) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                            <p className="text-sm font-medium text-red-800 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Errores en el formulario</p>
                            {Object.values(formErrors).map((err, i) => (
                                <p key={i} className="text-xs text-red-600 ml-6">• {err}</p>
                            ))}
                            {saveError && <p className="text-xs text-red-600 ml-6 font-medium">• Servidor: {saveError}</p>}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddMember} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open);
                if (!open) {
                    setSelectedMember(null);
                    resetForm();
                }
            }}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-orange-500" />
                            Editar Miembro
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Foto */}
                        <div className="space-y-2">
                            <Label>Foto de perfil</Label>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            width={80}
                                            height={80}
                                            className="w-20 h-20 rounded-full border-2 border-gray-200"
                                            style={{ objectFit: 'cover', objectPosition: getObjectPosition(formData.imagePosition) }}
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                            <UserIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload-edit"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('image-upload-edit')?.click()}
                                            className="gap-2"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Reemplazar foto
                                        </Button>
                                        {imagePreview && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsPositionEditorOpen(true)}
                                                className="gap-2"
                                            >
                                                <Move className="h-4 w-4" />
                                                Ajustar posición
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre completo *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.name; return n; }); }}
                                className={formErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            />
                            {formErrors.name && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Correo electrónico</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>

                        {/* Cargo */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-profession">Cargo / Especialidad</Label>
                            <Input
                                id="edit-profession"
                                value={formData.profession}
                                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                            />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="leadership">Equipo Directivo</SelectItem>
                                    <SelectItem value="specialist">Especialista</SelectItem>
                                    <SelectItem value="collaborator">Colaborador</SelectItem>
                                    <SelectItem value="docente">Docente Responsable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estado de Estudios */}
                        <div className="space-y-2">
                            <Label>Estado de Estudios</Label>
                            <Select
                                value={formData.educationStatus}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, educationStatus: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="graduated">Egresado</SelectItem>
                                    <SelectItem value="studying">Cursando</SelectItem>
                                    <SelectItem value="titled">Titulado</SelectItem>
                                    <SelectItem value="bachelor">Bachiller</SelectItem>
                                    <SelectItem value="masters">Maestría</SelectItem>
                                    <SelectItem value="doctorate">Doctorado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Habilidades Personales - Tag Input */}
                        <div className="space-y-2">
                            <Label>Habilidades Personales</Label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {formData.personalSkills.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                        {skill}
                                        <button type="button" onClick={() => setFormData(prev => ({
                                            ...prev,
                                            personalSkills: prev.personalSkills.filter((_, idx) => idx !== i)
                                        }))} className="hover:text-orange-900">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Liderazgo, Comunicación..."
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && skillInput.trim()) {
                                            e.preventDefault();
                                            setFormData(prev => ({
                                                ...prev,
                                                personalSkills: prev.personalSkills.includes(skillInput.trim())
                                                    ? prev.personalSkills
                                                    : [...prev.personalSkills, skillInput.trim()]
                                            }));
                                            setSkillInput("");
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    if (skillInput.trim()) {
                                        setFormData(prev => ({
                                            ...prev,
                                            personalSkills: prev.personalSkills.includes(skillInput.trim())
                                                ? prev.personalSkills
                                                : [...prev.personalSkills, skillInput.trim()]
                                        }));
                                        setSkillInput("");
                                    }
                                }}>+</Button>
                            </div>
                        </div>

                        {/* Dominio Técnico - Tag Input */}
                        <div className="space-y-2">
                            <Label>Dominio Técnico</Label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {formData.technicalDomain.map((domain, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                        {domain}
                                        <button type="button" onClick={() => setFormData(prev => ({
                                            ...prev,
                                            technicalDomain: prev.technicalDomain.filter((_, idx) => idx !== i)
                                        }))} className="hover:text-blue-900">×</button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: Impresión 3D, Arduino..."
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && domainInput.trim()) {
                                            e.preventDefault();
                                            setFormData(prev => ({
                                                ...prev,
                                                technicalDomain: prev.technicalDomain.includes(domainInput.trim())
                                                    ? prev.technicalDomain
                                                    : [...prev.technicalDomain, domainInput.trim()]
                                            }));
                                            setDomainInput("");
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    if (domainInput.trim()) {
                                        setFormData(prev => ({
                                            ...prev,
                                            technicalDomain: prev.technicalDomain.includes(domainInput.trim())
                                                ? prev.technicalDomain
                                                : [...prev.technicalDomain, domainInput.trim()]
                                        }));
                                        setDomainInput("");
                                    }
                                }}>+</Button>
                            </div>
                        </div>

                        {/* Disponibilidad */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Disponibilidad</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                    { value: 'presencial', label: 'Presencial' },
                                    { value: 'remoto', label: 'Remoto' },
                                    { value: 'hibrido', label: 'Híbrido' },
                                ].map((mode) => {
                                    const isActive = formData.availabilityMode === mode.value;
                                    return (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, availabilityMode: isActive ? '' : mode.value }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                                isActive
                                                    ? 'bg-orange-500 text-white border-orange-500'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <WeeklyScheduleEditor
                                value={formData.weeklySchedule}
                                onChange={(schedule) => setFormData(prev => ({ ...prev, weeklySchedule: schedule }))}
                            />
                        </div>

                        {/* Docente Responsable */}
                        {formData.category !== 'docente' && formData.category !== 'leadership' && (
                            <div className="space-y-2">
                                <Label>Docente Responsable</Label>
                                <Select
                                    value={formData.docenteResponsable || '__none__'}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, docenteResponsable: value === '__none__' ? '' : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona docente responsable" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin asignar</SelectItem>
                                        {docentesList.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-bio">Biografía corta</Label>
                            <textarea
                                id="edit-bio"
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {/* Visible */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-active"
                                checked={formData.active}
                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <Label htmlFor="edit-active">Visible en la página /equipo</Label>
                        </div>

                        {/* Permisos de Administrador */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="space-y-0.5">
                                <Label htmlFor="edit-isAdmin" className="text-sm font-medium">
                                    Usuario con permisos de administrador
                                </Label>
                                <p className="text-xs text-gray-500">
                                    Tendrá acceso completo a todas las secciones del panel de administración
                                </p>
                            </div>
                            <Switch
                                id="edit-isAdmin"
                                checked={formData.isAdmin}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAdmin: checked }))}
                            />
                        </div>
                    </div>
                    {(Object.keys(formErrors).length > 0 || saveError) && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                            <p className="text-sm font-medium text-red-800 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Errores en el formulario</p>
                            {Object.values(formErrors).map((err, i) => (
                                <p key={i} className="text-xs text-red-600 ml-6">• {err}</p>
                            ))}
                            {saveError && <p className="text-xs text-red-600 ml-6 font-medium">• Servidor: {saveError}</p>}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditMember} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar Cambios"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl mb-2">¡Miembro agregado!</DialogTitle>
                        <DialogDescription className="text-base">
                            <span className="font-semibold text-gray-900">{lastCreatedName}</span> ha sido agregado al equipo y aparecerá en /equipo
                        </DialogDescription>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button 
                            onClick={() => setIsSuccessDialogOpen(false)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Entendido
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => {
                                setIsSuccessDialogOpen(false);
                                setIsAddDialogOpen(true);
                            }}
                        >
                            Agregar otro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Editor de posición de imagen */}
            {imagePreview && (
                <ImagePositionEditor
                    imageUrl={imagePreview}
                    currentPosition={formData.imagePosition}
                    isOpen={isPositionEditorOpen}
                    onClose={() => setIsPositionEditorOpen(false)}
                    onSave={(position) => setFormData(prev => ({ ...prev, imagePosition: position }))}
                />
            )}
        </div>
    );
}
