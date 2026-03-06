"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { DatePicker } from "@/shared/ui/inputs/date-picker";
import { Badge } from "@/shared/ui/misc/badge";
import { Label } from "@/shared/ui/labels/label";
import { Textarea } from "@/shared/ui/inputs/textarea";
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
    FolderTree,
    Search,
    Plus,
    Edit,
    Trash2,
    Loader2,
    CheckCircle,
    Upload,
    Star,
    StarOff,
    Eye,
    EyeOff,
    X,
    Link as LinkIcon,
    ExternalLink,
    Users,
    User as UserIcon,
    ImagePlus,
    Clock,
    Calendar,
    FileSpreadsheet,
    Download,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { 
    getProjects,
    getTeamMembersForSelect,
    createProject, 
    updateProject, 
    deleteProject,
    toggleProjectFeatured,
    updateProjectStatus,
    exportProjectsToExcel,
    getTechnologies,
    createTechnology,
    getProjectMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
} from "./actions";
import type { ProjectData, GalleryImage, PracticeHoursData, PracticeHoursSpecialist, BidireccionEntry, ProjectBeneficiary, ProjectMeeting, ProjectTechnology, ExternalStaff } from "./data";

interface LocalCreator { 
    teamMemberId?: string; 
    teamMemberName?: string;
    externalName?: string; 
    role?: string; 
}

interface LocalLink { 
    label: string; 
    url: string; 
}

interface LocalGalleryItem {
    id?: string;
    url?: string;
    file?: File;
    preview?: string;
}

interface TeamMemberOption {
    id: string;
    name: string;
    image?: string;
    jobTitle?: string;
}

const PROJECT_CATEGORY_OPTIONS = [
    { value: 'proyectos-fisicos', label: 'Proyectos físicos' },
    { value: 'proyectos-digitales', label: 'Proyectos digitales' },
    { value: 'diseno', label: 'Diseño' },
    { value: 'animacion', label: 'Animación' },
];

export default function ProjectsAdminPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [projectsList, setProjectsList] = useState<ProjectData[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
    const [availableTechnologies, setAvailableTechnologies] = useState<ProjectTechnology[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [lastCreatedTitle, setLastCreatedTitle] = useState("");
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [galleryItems, setGalleryItems] = useState<LocalGalleryItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // ── Selección múltiple para Excel ──
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    // ── Horas de Práctica ──
    const [practiceHoursEnabled, setPracticeHoursEnabled] = useState(false);
    const [practiceHoursData, setPracticeHoursData] = useState<PracticeHoursData>({
        beneficiaryType: '',
        institutionName: '',
        institutionRut: '',
        email: '',
        phone: '',
        commune: '',
        referringOrganization: '',
        specialists: [],
        bidireccionEntries: [],
    });
    
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "proyectos-fisicos",
        startDate: "",
        endDate: "",
        year: new Date().getFullYear(),
        status: "draft" as "draft" | "published",
        featured: false,
        technologies: [] as string[],
        creators: [] as LocalCreator[],
        responsibleStaff: [] as string[],
        externalStaff: [] as ExternalStaff[],
        links: [] as LocalLink[],
        beneficiaries: [] as ProjectBeneficiary[],
        meetings: [] as ProjectMeeting[],
        image: null as File | null,
    });
    
    const [newTech, setNewTech] = useState("");
    const [newTechCategory, setNewTechCategory] = useState("other");
    const [selectedExistingTech, setSelectedExistingTech] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saveError, setSaveError] = useState<string | null>(null);

    const existingTechnologyOptions = availableTechnologies;

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [projects, members, techs] = await Promise.all([
                getProjects(),
                getTeamMembersForSelect(),
                getTechnologies(),
            ]);
            setProjectsList(projects);
            setTeamMembers(members);
            setAvailableTechnologies(techs);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar datos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const publishedProjects = projectsList.filter(p => p.status === 'published').length;
    const featuredProjects = projectsList.filter(p => p.featured).length;

    const filteredProjects = projectsList.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            category: "proyectos-fisicos",
            startDate: "",
            endDate: "",
            year: new Date().getFullYear(),
            status: "draft",
            featured: false,
            technologies: [],
            creators: [],
            responsibleStaff: [],
            externalStaff: [],
            links: [],
            beneficiaries: [],
            meetings: [],
            image: null,
        });
        setNewTech("");
        setNewTechCategory("other");
        setSelectedExistingTech("");
        setFormErrors({});
        setSaveError(null);
        setImagePreview(null);
        setGalleryItems([]);
        setPracticeHoursEnabled(false);
        setPracticeHoursData({
            beneficiaryType: '',
            institutionName: '',
            institutionRut: '',
            email: '',
            phone: '',
            commune: '',
            referringOrganization: '',
            specialists: [],
            bidireccionEntries: [],
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (galleryInputRef.current) {
            galleryInputRef.current.value = "";
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("La imagen no debe superar 5MB");
                return;
            }
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTech = async () => {
        // Create a brand-new technology (admin-only), then add its ID
        if (!newTech.trim()) return;
        const result = await createTechnology(newTech.trim(), newTechCategory);
        if (result.success && result.id) {
            setFormData({ 
                ...formData, 
                technologies: [...formData.technologies, result.id] 
            });
            setAvailableTechnologies(prev => [...prev, { id: result.id!, name: newTech.trim(), category: newTechCategory }]);
            setNewTech("");
            setNewTechCategory("other");
            toast.success(`Tecnología "${newTech.trim()}" creada`);
        } else {
            toast.error(result.error || "Error al crear tecnología");
        }
    };

    const handleRemoveTech = (techId: string) => {
        setFormData({
            ...formData,
            technologies: formData.technologies.filter(t => t !== techId),
        });
    };

    const handleAddExistingTech = () => {
        if (!selectedExistingTech) return;
        if (formData.technologies.includes(selectedExistingTech)) return;
        setFormData({ ...formData, technologies: [...formData.technologies, selectedExistingTech] });
        setSelectedExistingTech("");
    };

    const getTechName = (techId: string): string => {
        const tech = availableTechnologies.find(t => t.id === techId);
        return tech?.name || techId;
    };

    const handleAddCreator = (isTeamMember: boolean) => {
        const newCreator: LocalCreator = isTeamMember 
            ? { teamMemberId: '', role: '' }
            : { externalName: '', role: '' };
        setFormData({
            ...formData,
            creators: [...formData.creators, newCreator],
        });
    };

    const handleUpdateCreator = (index: number, field: string, value: string) => {
        const updated = [...formData.creators];
        (updated[index] as any)[field] = value;
        if (field === 'teamMemberId') {
            const member = teamMembers.find(m => m.id === value);
            updated[index].teamMemberName = member?.name;
        }
        setFormData({ ...formData, creators: updated });
    };

    const handleRemoveCreator = (index: number) => {
        setFormData({
            ...formData,
            creators: formData.creators.filter((_, i) => i !== index),
        });
    };

    const handleAddLink = () => {
        setFormData({
            ...formData,
            links: [...formData.links, { label: '', url: '' }],
        });
    };

    const handleUpdateLink = (index: number, field: 'label' | 'url', value: string) => {
        const updated = [...formData.links];
        updated[index][field] = value;
        setFormData({ ...formData, links: updated });
    };

    const handleRemoveLink = (index: number) => {
        setFormData({
            ...formData,
            links: formData.links.filter((_, i) => i !== index),
        });
    };

    const handleAddGalleryImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
        const newItems: LocalGalleryItem[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} supera el límite de 5MB`);
                continue;
            }
            newItems.push({
                file,
                preview: URL.createObjectURL(file),
            });
        }
        setGalleryItems([...galleryItems, ...newItems]);
        if (galleryInputRef.current) {
            galleryInputRef.current.value = "";
        }
    };

    const handleRemoveGalleryItem = (index: number) => {
        const item = galleryItems[index];
        if (item.preview && !item.id) {
            URL.revokeObjectURL(item.preview);
        }
        setGalleryItems(galleryItems.filter((_, i) => i !== index));
    };

    // ── Horas de Práctica: Especialistas ──
    const handleAddSpecialist = () => {
        setPracticeHoursData({
            ...practiceHoursData,
            specialists: [
                ...(practiceHoursData.specialists || []),
                { firstName: '', paternalLastName: '', maternalLastName: '', rut: '' },
            ],
        });
    };

    const handleUpdateSpecialist = (index: number, field: keyof PracticeHoursSpecialist, value: string) => {
        const updated = [...(practiceHoursData.specialists || [])];
        updated[index] = { ...updated[index], [field]: value };
        setPracticeHoursData({ ...practiceHoursData, specialists: updated });
    };

    const handleRemoveSpecialist = (index: number) => {
        setPracticeHoursData({
            ...practiceHoursData,
            specialists: (practiceHoursData.specialists || []).filter((_, i) => i !== index),
        });
    };

    // ── Horas de Práctica: Bidirección ──
    const handleAddBidireccionEntry = () => {
        setPracticeHoursData({
            ...practiceHoursData,
            bidireccionEntries: [
                ...(practiceHoursData.bidireccionEntries || []),
                { tipoBeneficiario: '', rut: '', firstName: '', paternalLastName: '', maternalLastName: '', rol: '', horasDocente: undefined, horasEstudiante: undefined },
            ],
        });
    };

    const handleUpdateBidireccionEntry = (index: number, field: keyof BidireccionEntry, value: string | number | undefined) => {
        const updated = [...(practiceHoursData.bidireccionEntries || [])];
        updated[index] = { ...updated[index], [field]: value };
        setPracticeHoursData({ ...practiceHoursData, bidireccionEntries: updated });
    };

    const handleRemoveBidireccionEntry = (index: number) => {
        setPracticeHoursData({
            ...practiceHoursData,
            bidireccionEntries: (practiceHoursData.bidireccionEntries || []).filter((_, i) => i !== index),
        });
    };

    const handleAddBeneficiary = () => {
        setFormData({
            ...formData,
            beneficiaries: [
                ...formData.beneficiaries,
                { tipoBeneficiario: '', rut: '', firstName: '', paternalLastName: '', maternalLastName: '', rol: '', horasDocente: undefined, horasEstudiante: undefined },
            ],
        });
    };

    const handleUpdateBeneficiary = (index: number, field: keyof ProjectBeneficiary, value: string | number | undefined) => {
        const next = [...formData.beneficiaries];
        next[index] = { ...next[index], [field]: value };
        setFormData({ ...formData, beneficiaries: next });
    };

    const handleRemoveBeneficiary = (index: number) => {
        setFormData({ ...formData, beneficiaries: formData.beneficiaries.filter((_, i) => i !== index) });
    };

    const handleAddMeeting = () => {
        setFormData({
            ...formData,
            meetings: [...formData.meetings, { date: '', time: '09:00', description: '', status: 'programada' }],
        });
    };

    const handleUpdateMeeting = (index: number, field: keyof ProjectMeeting, value: string) => {
        const next = [...formData.meetings];
        next[index] = { ...next[index], [field]: value } as ProjectMeeting;
        setFormData({ ...formData, meetings: next });
    };

    const handleRemoveMeeting = (index: number) => {
        setFormData({ ...formData, meetings: formData.meetings.filter((_, i) => i !== index) });
    };

    const validateProjectForm = (): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (!formData.title.trim()) {
            errors.title = 'El título es obligatorio.';
        }
        if (!formData.description.trim()) {
            errors.description = 'La descripción es obligatoria.';
        }

        if (formData.startDate && formData.endDate && new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()) {
            errors.endDate = 'Fecha de cierre no puede ser anterior a fecha de inicio.';
        }

        if (formData.category === 'proyectos-digitales' && formData.technologies.length === 0) {
            errors.technologies = 'Proyectos digitales deben tener al menos una tecnología.';
        }

        const now = new Date();
        for (let i = 0; i < formData.meetings.length; i++) {
            const meeting = formData.meetings[i];
            if (meeting.status !== 'programada' || !meeting.date || !meeting.time) continue;
            const [h, m] = meeting.time.split(':').map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) {
                errors[`meeting_${i}`] = `Reunión ${i + 1}: hora inválida, usa formato HH:mm.`;
                continue;
            }
            // Parse date parts to avoid UTC-vs-local timezone issues
            const dateParts = meeting.date.slice(0, 10).split('-').map(Number);
            const meetingDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], h, m, 0, 0);
            if (meetingDateTime.getTime() < now.getTime()) {
                errors[`meeting_${i}`] = `Reunión ${i + 1}: no puede estar en fecha/hora pasada.`;
            }
        }
        return errors;
    };

    const buildFormData = (): FormData => {
        const form = new FormData();
        form.append('title', formData.title);
        form.append('description', formData.description);
        form.append('category', formData.category);
        form.append('startDate', formData.startDate || '');
        form.append('endDate', formData.endDate || '');
        form.append('year', String(formData.year));
        form.append('status', formData.status);
        form.append('featured', String(formData.featured));
        form.append('technologies', formData.technologies.join(','));
        form.append('creators', JSON.stringify(formData.creators.map(c => ({
            teamMember: c.teamMemberId || undefined,
            externalName: c.externalName || undefined,
            role: c.role,
        }))));
        form.append('links', JSON.stringify(formData.links));
        form.append('responsibleStaff', JSON.stringify(formData.responsibleStaff));
        form.append('externalStaff', JSON.stringify(formData.externalStaff));
        form.append('beneficiaries', JSON.stringify(formData.beneficiaries));
        form.append('meetings', JSON.stringify(formData.meetings));
        
        // Horas de práctica
        form.append('practiceHoursEnabled', String(practiceHoursEnabled));
        if (practiceHoursEnabled) {
            form.append('practiceHours', JSON.stringify(practiceHoursData));
        }

        if (formData.image) {
            form.append('image', formData.image);
        }
        
        const existingIds = galleryItems.filter(g => g.id).map(g => g.id);
        if (existingIds.length > 0) {
            form.append('existingGallery', JSON.stringify(existingIds));
        }
        for (const item of galleryItems) {
            if (item.file) {
                form.append('gallery', item.file);
            }
        }
        return form;
    };

    const handleAddProject = async () => {
        setSaveError(null);
        const errors = validateProjectForm();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error('Corrige los errores antes de guardar.');
            return;
        }

        try {
            setIsSaving(true);
            const form = buildFormData();
            const result = await createProject(form);
            
            if (result.success) {
                setLastCreatedTitle(formData.title);
                setIsAddDialogOpen(false);
                setIsSuccessDialogOpen(true);
                resetForm();
                setFormErrors({});
                setSaveError(null);
                loadData();
            } else {
                const msg = result.error || 'Error al crear proyecto';
                setSaveError(msg);
                toast.error(msg);
            }
        } catch (error: any) {
            console.error('Error creando proyecto:', error);
            const msg = error?.message || 'Error inesperado al crear proyecto';
            setSaveError(msg);
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditProject = async () => {
        setSaveError(null);
        const errors = validateProjectForm();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error('Corrige los errores antes de guardar.');
            return;
        }
        if (!selectedProject) return;

        try {
            setIsSaving(true);
            const form = buildFormData();
            const result = await updateProject(selectedProject.id, form);
            
            if (result.success) {
                setIsEditDialogOpen(false);
                setSelectedProject(null);
                resetForm();
                setFormErrors({});
                setSaveError(null);
                toast.success('Proyecto actualizado correctamente');
                loadData();
            } else {
                const msg = result.error || 'Error al actualizar proyecto';
                setSaveError(msg);
                toast.error(msg);
            }
        } catch (error: any) {
            console.error('Error actualizando proyecto:', error);
            const msg = error?.message || 'Error inesperado al actualizar proyecto';
            setSaveError(msg);
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProject = async (project: ProjectData) => {
        if (confirm(`¿Estás seguro de eliminar "${project.title}"?`)) {
            try {
                const result = await deleteProject(project.id);
                if (result.success) {
                    toast.success(`"${project.title}" eliminado`);
                    loadData();
                } else {
                    toast.error(result.error || "Error al eliminar");
                }
            } catch (error) {
                console.error("Error eliminando proyecto:", error);
                toast.error("Error al eliminar proyecto");
            }
        }
    };

    const handleToggleFeatured = async (project: ProjectData) => {
        try {
            const result = await toggleProjectFeatured(project.id);
            if (result.success) {
                toast.success(`${project.title} ${!project.featured ? 'destacado' : 'sin destacar'}`);
                loadData();
            }
        } catch (error) {
            toast.error("Error al cambiar estado");
        }
    };

    const handleToggleStatus = async (project: ProjectData) => {
        try {
            const newStatus = project.status === 'published' ? 'draft' : 'published';
            const result = await updateProjectStatus(project.id, newStatus);
            if (result.success) {
                toast.success(`${project.title} ${newStatus === 'published' ? 'publicado' : 'como borrador'}`);
                loadData();
            } else {
                toast.error(result.error || "Error al cambiar estado");
            }
        } catch (error) {
            toast.error("Error al cambiar estado");
        }
    };

    const openEditDialog = async (project: ProjectData) => {
        setSelectedProject(project);
        
        // Load meetings from the meetings collection
        const projectMeetings = await getProjectMeetings(project.id);
        
        setFormData({
            title: project.title,
            description: project.description,
            category: project.category,
            startDate: project.startDate || '',
            endDate: project.endDate || '',
            year: project.year,
            status: project.status as "draft" | "published",
            featured: project.featured,
            technologies: project.technologies.map(t => t.id),
            creators: project.creators.map(c => ({
                teamMemberId: c.teamMemberId,
                teamMemberName: c.teamMemberName,
                externalName: c.externalName,
                role: c.role,
            })),
            responsibleStaff: project.responsibleStaff || [],
            externalStaff: project.externalStaff || [],
            links: project.links,
            beneficiaries: project.beneficiaries || [],
            meetings: projectMeetings,
            image: null,
        });
        setImagePreview(project.featuredImage || null);
        setGalleryItems(project.gallery?.map(g => ({
            id: g.id,
            url: g.url,
        })) || []);
        // Cargar datos de horas de práctica
        setPracticeHoursEnabled(project.practiceHoursEnabled || false);
        setPracticeHoursData(project.practiceHours || {
            beneficiaryType: '',
            institutionName: '',
            institutionRut: '',
            email: '',
            phone: '',
            commune: '',
            referringOrganization: '',
            specialists: [],
            bidireccionEntries: [],
        });
        setIsEditDialogOpen(true);
    };

    // ── Selección múltiple ──
    const handleToggleSelectProject = (id: string) => {
        setSelectedProjectIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedProjectIds.size === filteredProjects.length) {
            setSelectedProjectIds(new Set());
        } else {
            setSelectedProjectIds(new Set(filteredProjects.map(p => p.id)));
        }
    };

    // ── Exportar Excel ──
    const handleExportExcel = async (templateType: 'contribucion' | 'bidireccion', projectIds?: string[]) => {
        const ids = projectIds || Array.from(selectedProjectIds);
        if (ids.length === 0) {
            toast.error("Selecciona al menos un proyecto para exportar");
            return;
        }
        try {
            setIsExporting(true);
            const result = await exportProjectsToExcel(ids, templateType);
            if (result.success && result.data) {
                const byteCharacters = atob(result.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename || 'horas_practica.xlsx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success(`Excel descargado con ${ids.length} proyecto(s)`);
            } else {
                toast.error(result.error || "Error al exportar");
            }
        } catch (error) {
            console.error("Error exportando:", error);
            toast.error("Error al generar Excel");
        } finally {
            setIsExporting(false);
        }
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'proyectos-fisicos': 'bg-blue-100 text-blue-700',
            'proyectos-digitales': 'bg-green-100 text-green-700',
            'diseno': 'bg-purple-100 text-purple-700',
            'animacion': 'bg-orange-100 text-orange-700',
        };
        return colors[cat] || 'bg-gray-100 text-gray-700';
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            'proyectos-fisicos': 'Proyectos físicos',
            'proyectos-digitales': 'Proyectos digitales',
            'diseno': 'Diseño',
            'animacion': 'Animación',
        };
        return labels[cat] || cat;
    };

    const renderFormContent = () => (
        <div className="space-y-6 py-4">
            <div className="space-y-2">
                <Label>Imagen principal</Label>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {imagePreview ? (
                            <div className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div onClick={() => fileInputRef.current?.click()} className="w-32 h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50">
                                <Upload className="h-6 w-6 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">Subir</span>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input id="title" placeholder="Nombre del proyecto" value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setFormErrors(prev => { const n = { ...prev }; delete n.title; return n; }); }} className={formErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''} />
                    {formErrors.title && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.title}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea id="description" placeholder="Describe brevemente el proyecto..." value={formData.description} onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setFormErrors(prev => { const n = { ...prev }; delete n.description; return n; }); }} rows={3} className={formErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''} />
                    {formErrors.description && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.description}</p>}
                </div>
            </div>

            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {PROJECT_CATEGORY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha inicio</Label>
                    <DatePicker id="startDate" value={formData.startDate} onChange={(date) => setFormData({ ...formData, startDate: date })} placeholder="Seleccionar inicio" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha cierre</Label>
                    <DatePicker id="endDate" value={formData.endDate} onChange={(date) => { setFormData({ ...formData, endDate: date }); setFormErrors(prev => { const n = { ...prev }; delete n.endDate; return n; }); }} placeholder="Seleccionar cierre" />
                    {formErrors.endDate && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.endDate}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} />
                </div>
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={formData.status} onValueChange={(value: "draft" | "published") => setFormData({ ...formData, status: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Borrador</SelectItem>
                            <SelectItem value="published">Publicado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <input type="checkbox" id="featured" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 h-5 w-5" />
                <div>
                    <Label htmlFor="featured" className="font-medium cursor-pointer flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Proyecto destacado
                    </Label>
                    <p className="text-sm text-gray-500">Aparecerá primero en la lista</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Tecnologías utilizadas</Label>
                <div className="flex gap-2">
                    <Select value={selectedExistingTech || 'none'} onValueChange={(value) => setSelectedExistingTech(value === 'none' ? '' : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tecnología del catálogo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Seleccionar tecnología</SelectItem>
                            {existingTechnologyOptions
                                .filter(t => !formData.technologies.includes(t.id))
                                .map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>{tech.name} ({tech.category})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={handleAddExistingTech}>Agregar</Button>
                </div>
                <div className="flex gap-2">
                    <Input value={newTech} onChange={(e) => setNewTech(e.target.value)} placeholder="Crear nueva tecnología..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())} className="flex-1" />
                    <Select value={newTechCategory} onValueChange={setNewTechCategory}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hardware">Hardware</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="design">Diseño</SelectItem>
                            <SelectItem value="fabrication">Fabricación</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={handleAddTech}><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="text-xs text-gray-500">Selecciona del catálogo o crea una nueva (solo admin)</p>
                {formErrors.technologies && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.technologies}</p>}
                {formData.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.technologies.map((techId) => (
                            <span key={techId} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                {getTechName(techId)}
                                <button type="button" onClick={() => handleRemoveTech(techId)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Creadores del proyecto</Label>
                <div className="flex gap-2 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddCreator(true)} className="gap-1">
                        <Users className="h-3 w-3" /> Agregar especialista
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddCreator(false)} className="gap-1">
                        <UserIcon className="h-3 w-3" /> Agregar externo
                    </Button>
                </div>
                {formData.creators.length > 0 && (
                    <div className="space-y-2">
                        {formData.creators.map((creator, index) => (
                            <div key={index} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
                                {creator.teamMemberId !== undefined ? (
                                    <Select value={creator.teamMemberId} onValueChange={(value) => handleUpdateCreator(index, 'teamMemberId', value)}>
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar especialista" /></SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    <div className="flex items-center gap-2">
                                                        {member.image ? (
                                                            <Image src={member.image} alt={member.name} width={20} height={20} className="rounded-full" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs">{member.name.charAt(0)}</div>
                                                        )}
                                                        {member.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input value={creator.externalName || ''} onChange={(e) => handleUpdateCreator(index, 'externalName', e.target.value)} placeholder="Nombre del colaborador externo" className="flex-1" />
                                )}
                                <Input value={creator.role || ''} onChange={(e) => handleUpdateCreator(index, 'role', e.target.value)} placeholder="Rol" className="w-32" />
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveCreator(index)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <Label>Personal responsable</Label>
                <p className="text-xs text-gray-500">Solo este personal y administrador pueden editar proyecto y reuniones.</p>

                {/* Usuarios registrados */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1"><Users className="h-3 w-3" /> Usuarios registrados</p>
                    <div className="grid gap-2 md:grid-cols-2">
                        {teamMembers.map((member) => {
                            const checked = formData.responsibleStaff.includes(member.id);
                            return (
                                <label key={member.id} className="flex items-center gap-2 rounded border p-2 text-sm cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...formData.responsibleStaff, member.id]
                                                : formData.responsibleStaff.filter((id) => id !== member.id);
                                            setFormData({ ...formData, responsibleStaff: next });
                                        }}
                                    />
                                    <span>{member.name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Personas externas (no registradas) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600 flex items-center gap-1"><UserIcon className="h-3 w-3" /> Personal responsable no registrado</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({ ...formData, externalStaff: [...formData.externalStaff, { name: '', role: '' }] })}
                            className="gap-1"
                        >
                            <Plus className="h-3 w-3" /> Agregar
                        </Button>
                    </div>
                    {formData.externalStaff.length > 0 ? (
                        <div className="space-y-2">
                            {formData.externalStaff.map((ext, idx) => (
                                <div key={idx} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
                                    <Input
                                        placeholder="Nombre completo"
                                        value={ext.name}
                                        onChange={(e) => {
                                            const updated = [...formData.externalStaff];
                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                            setFormData({ ...formData, externalStaff: updated });
                                        }}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Rol / Cargo"
                                        value={ext.role || ''}
                                        onChange={(e) => {
                                            const updated = [...formData.externalStaff];
                                            updated[idx] = { ...updated[idx], role: e.target.value };
                                            setFormData({ ...formData, externalStaff: updated });
                                        }}
                                        className="w-40"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, externalStaff: formData.externalStaff.filter((_, i) => i !== idx) })}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-2 border border-dashed rounded-lg">Sin personal externo</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" />Enlaces (repositorio, video, demo)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLink} className="gap-1 mb-2"><Plus className="h-3 w-3" /> Agregar enlace</Button>
                {formData.links.length > 0 && (
                    <div className="space-y-2">
                        {formData.links.map((link, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input value={link.label} onChange={(e) => handleUpdateLink(index, 'label', e.target.value)} placeholder="Nombre (ej: GitHub)" className="w-32" />
                                <Input value={link.url} onChange={(e) => handleUpdateLink(index, 'url', e.target.value)} placeholder="https://..." className="flex-1" />
                                {link.url && <a href={link.url.match(/^https?:\/\//) ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors" title="Abrir enlace"><ExternalLink className="h-4 w-4 text-gray-600" /></a>}
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveLink(index)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!practiceHoursEnabled && (<div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                    <Label className="font-semibold">Beneficiarios (bidireccional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddBeneficiary}><Plus className="h-3 w-3 mr-1" />Agregar</Button>
                </div>
                {formData.beneficiaries.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin beneficiarios registrados.</p>
                ) : (
                    <div className="space-y-2">
                        {formData.beneficiaries.map((beneficiary, index) => (
                            <div key={index} className="rounded border p-2 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <Input placeholder="Tipo beneficiario" value={beneficiary.tipoBeneficiario} onChange={(e) => handleUpdateBeneficiary(index, 'tipoBeneficiario', e.target.value)} />
                                    <Input placeholder="RUT" value={beneficiary.rut} onChange={(e) => handleUpdateBeneficiary(index, 'rut', e.target.value)} />
                                    <Input placeholder="Rol" value={beneficiary.rol} onChange={(e) => handleUpdateBeneficiary(index, 'rol', e.target.value)} />
                                    <Input placeholder="Nombres" value={beneficiary.firstName} onChange={(e) => handleUpdateBeneficiary(index, 'firstName', e.target.value)} />
                                    <Input placeholder="Apellido paterno" value={beneficiary.paternalLastName} onChange={(e) => handleUpdateBeneficiary(index, 'paternalLastName', e.target.value)} />
                                    <Input placeholder="Apellido materno" value={beneficiary.maternalLastName || ''} onChange={(e) => handleUpdateBeneficiary(index, 'maternalLastName', e.target.value)} />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveBeneficiary(index)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>)}

            <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                    <Label className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Reuniones</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddMeeting}><Plus className="h-3 w-3 mr-1" />Agendar reunión</Button>
                </div>
                {formData.meetings.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay reuniones agendadas.</p>
                ) : (
                    <div className="space-y-2">
                        {formData.meetings.map((meeting, index) => (
                            <div key={index} className="rounded border p-2 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <DatePicker value={meeting.date} onChange={(date) => handleUpdateMeeting(index, 'date', date)} placeholder="Fecha" />
                                    <Input type="time" value={meeting.time} onChange={(e) => handleUpdateMeeting(index, 'time', e.target.value)} />
                                    <Select value={meeting.status} onValueChange={(value) => handleUpdateMeeting(index, 'status', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="programada">Programada</SelectItem>
                                            <SelectItem value="cancelada">Cancelada</SelectItem>
                                            <SelectItem value="realizada">Realizada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMeeting(index)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <Textarea value={meeting.description} onChange={(e) => handleUpdateMeeting(index, 'description', e.target.value)} placeholder="Descripción de la reunión" rows={2} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Galería de imágenes */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" />Galería de imágenes</Label>
                <p className="text-sm text-gray-500">Añade fotos adicionales del proyecto</p>
                <div className="flex flex-wrap gap-3 mt-2">
                    {galleryItems.map((item, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 group">
                            <Image 
                                src={item.preview || item.url || ''} 
                                alt={`Galería ${index + 1}`} 
                                fill 
                                className="object-cover" 
                            />
                            <button 
                                type="button" 
                                onClick={() => handleRemoveGalleryItem(index)} 
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <div 
                        onClick={() => galleryInputRef.current?.click()} 
                        className="w-24 h-24 rounded-lg bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
                    >
                        <ImagePlus className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Añadir</span>
                    </div>
                </div>
                <input 
                    ref={galleryInputRef} 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleAddGalleryImages} 
                    className="hidden" 
                />
            </div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* ── Interruptor: Agregar Horas de Práctica ──────── */}
            {/* ═══════════════════════════════════════════════════ */}
            <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <Label htmlFor="practice-hours-toggle" className="font-semibold text-blue-900 cursor-pointer">
                                Agregar horas de práctica
                            </Label>
                            <p className="text-sm text-blue-600">Datos confidenciales, solo visibles para administradores</p>
                        </div>
                    </div>
                    <Switch
                        id="practice-hours-toggle"
                        checked={practiceHoursEnabled}
                        onCheckedChange={setPracticeHoursEnabled}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {practiceHoursEnabled && (
                    <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-white space-y-4">
                        <h4 className="font-semibold text-blue-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <FileSpreadsheet className="h-4 w-4" />
                            Datos de Horas de Práctica
                        </h4>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="ph-beneficiary">Tipo de Beneficiario Externo</Label>
                                <Input
                                    id="ph-beneficiary"
                                    placeholder="Ej: Estudiante, Profesional, Empresa..."
                                    value={practiceHoursData.beneficiaryType || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, beneficiaryType: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ph-institution">Nombre de Institución o Empresa</Label>
                                <Input
                                    id="ph-institution"
                                    placeholder="Nombre de la institución"
                                    value={practiceHoursData.institutionName || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, institutionName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ph-rut-inst">RUT de Institución o Empresa</Label>
                                <Input
                                    id="ph-rut-inst"
                                    placeholder="Ej: 76.123.456-7"
                                    value={practiceHoursData.institutionRut || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, institutionRut: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ph-email">Email</Label>
                                <Input
                                    id="ph-email"
                                    type="email"
                                    placeholder="contacto@ejemplo.cl"
                                    value={practiceHoursData.email || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ph-phone">Teléfono</Label>
                                <Input
                                    id="ph-phone"
                                    placeholder="+56 9 1234 5678"
                                    value={practiceHoursData.phone || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ph-commune">Comuna</Label>
                                <Input
                                    id="ph-commune"
                                    placeholder="Ej: Santiago, Valparaíso..."
                                    value={practiceHoursData.commune || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, commune: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ph-referring">Institución / Organización que Deriva al Beneficiario</Label>
                                <Input
                                    id="ph-referring"
                                    placeholder="Nombre de la organización"
                                    value={practiceHoursData.referringOrganization || ''}
                                    onChange={(e) => setPracticeHoursData({ ...practiceHoursData, referringOrganization: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Especialistas */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="flex items-center gap-2 font-semibold text-blue-800">
                                    <UserIcon className="h-4 w-4" />
                                    Especialistas
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddSpecialist} className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                                    <Plus className="h-3 w-3" /> Agregar especialista
                                </Button>
                            </div>

                            {(practiceHoursData.specialists || []).length === 0 ? (
                                <div className="text-center py-4 border border-dashed border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-400">No hay especialistas agregados</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(practiceHoursData.specialists || []).map((specialist, index) => (
                                        <div key={index} className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-blue-600 uppercase">Especialista {index + 1}</span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSpecialist(index)} className="text-red-500 hover:text-red-600 h-7 w-7 p-0">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-xs">Nombres</Label>
                                                    <Input
                                                        placeholder="Nombres del especialista"
                                                        value={specialist.firstName}
                                                        onChange={(e) => handleUpdateSpecialist(index, 'firstName', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Apellido Paterno</Label>
                                                    <Input
                                                        placeholder="Apellido paterno"
                                                        value={specialist.paternalLastName}
                                                        onChange={(e) => handleUpdateSpecialist(index, 'paternalLastName', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Apellido Materno</Label>
                                                    <Input
                                                        placeholder="Apellido materno"
                                                        value={specialist.maternalLastName || ''}
                                                        onChange={(e) => handleUpdateSpecialist(index, 'maternalLastName', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-xs">RUT</Label>
                                                    <Input
                                                        placeholder="Ej: 12.345.678-9"
                                                        value={specialist.rut}
                                                        onChange={(e) => handleUpdateSpecialist(index, 'rut', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* ── Formulario Bidirección ──────────────────── */}
                        {/* ═══════════════════════════════════════════════ */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <Label className="flex items-center gap-2 font-semibold text-purple-800">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Beneficiarios Bidirección
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddBidireccionEntry} className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50">
                                    <Plus className="h-3 w-3" /> Agregar beneficiario
                                </Button>
                            </div>
                            <p className="text-xs text-purple-500 mb-3">Datos para la plantilla de bidirección (ej: docentes, estudiantes)</p>

                            {(practiceHoursData.bidireccionEntries || []).length === 0 ? (
                                <div className="text-center py-4 border border-dashed border-purple-200 rounded-lg">
                                    <p className="text-sm text-purple-400">No hay beneficiarios agregados</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(practiceHoursData.bidireccionEntries || []).map((entry, index) => (
                                        <div key={index} className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-purple-600 uppercase">Beneficiario {index + 1}</span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveBidireccionEntry(index)} className="text-red-500 hover:text-red-600 h-7 w-7 p-0">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Tipo de Beneficiario</Label>
                                                    <Input
                                                        placeholder="Ej: Docente, Estudiante..."
                                                        value={entry.tipoBeneficiario}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'tipoBeneficiario', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">RUT</Label>
                                                    <Input
                                                        placeholder="Ej: 12.345.678-9"
                                                        value={entry.rut}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'rut', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-xs">Nombres</Label>
                                                    <Input
                                                        placeholder="Nombres del beneficiario"
                                                        value={entry.firstName}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'firstName', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Apellido Paterno</Label>
                                                    <Input
                                                        placeholder="Apellido paterno"
                                                        value={entry.paternalLastName}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'paternalLastName', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Apellido Materno</Label>
                                                    <Input
                                                        placeholder="Apellido materno"
                                                        value={entry.maternalLastName || ''}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'maternalLastName', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <Label className="text-xs">Rol</Label>
                                                    <Input
                                                        placeholder="Ej: Coordinador FabLab, Profesor guía..."
                                                        value={entry.rol}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'rol', e.target.value)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">N° Horas Docente</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={entry.horasDocente ?? ''}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'horasDocente', e.target.value ? parseInt(e.target.value) : undefined)}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">N° Horas Estudiante</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={entry.horasEstudiante ?? ''}
                                                        onChange={(e) => handleUpdateBidireccionEntry(index, 'horasEstudiante', e.target.value ? parseInt(e.target.value) : undefined)}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Botones Exportar Excel individual */}
                        {selectedProject && (
                            <div className="border-t pt-4 mt-4 space-y-2">
                                <Label className="text-xs font-semibold text-blue-600 uppercase">Descargar plantilla Excel</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                                        onClick={() => handleExportExcel('contribucion', [selectedProject.id])}
                                        disabled={isExporting}
                                    >
                                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        Contribución
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleExportExcel('bidireccion', [selectedProject.id])}
                                        disabled={isExporting}
                                    >
                                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        Bidirección
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
                <p className="text-gray-600 mt-1">Gestiona los proyectos del FabLab</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><FolderTree className="h-4 w-4" />Total Proyectos</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{projectsList.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><Eye className="h-4 w-4" />Publicados</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-600">{publishedProjects}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2"><Star className="h-4 w-4" />Destacados</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-yellow-600">{featuredProjects}</div></CardContent>
                </Card>
            </div>

            <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar por título, descripción o categoría..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                {selectedProjectIds.size > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                            onClick={() => handleExportExcel('contribucion')}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Contribución ({selectedProjectIds.size})
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleExportExcel('bidireccion')}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Bidirección ({selectedProjectIds.size})
                        </Button>
                    </div>
                )}
                <Button className="gap-2 bg-orange-500 hover:bg-orange-600" onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4" />Nuevo Proyecto</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /><span className="ml-2 text-gray-600">Cargando...</span></div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-12"><FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">No hay proyectos</p><p className="text-sm text-gray-500 mt-1">Crea el primer proyecto del FabLab</p></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <input
                                            type="checkbox"
                                            checked={selectedProjectIds.size === filteredProjects.length && filteredProjects.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 h-4 w-4"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[80px]">Imagen</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Año</TableHead>
                                    <TableHead>Creadores</TableHead>
                                    <TableHead className="text-center">H.P.</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-center">Destacado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.map((project) => (
                                    <TableRow key={project.id} className={selectedProjectIds.has(project.id) ? "bg-orange-50/50" : ""}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedProjectIds.has(project.id)}
                                                onChange={() => handleToggleSelectProject(project.id)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 h-4 w-4"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {project.featuredImage ? (
                                                <Image src={project.featuredImage} alt={project.title} width={60} height={40} className="w-15 h-10 rounded object-cover" />
                                            ) : (
                                                <div className="w-15 h-10 rounded bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"><FolderTree className="h-5 w-5 text-gray-400" /></div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div><p className="font-medium">{project.title}</p><p className="text-xs text-gray-500 line-clamp-1">{project.description}</p></div>
                                        </TableCell>
                                        <TableCell><Badge className={getCategoryColor(project.category)}>{getCategoryLabel(project.category)}</Badge></TableCell>
                                        <TableCell className="text-gray-600">{project.year}</TableCell>
                                        <TableCell>
                                            {project.creators.length > 0 ? (
                                                <div className="flex -space-x-2">
                                                    {project.creators.slice(0, 3).map((creator, i) => (
                                                        <div key={i} className="w-7 h-7 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs border-2 border-white" title={creator.teamMemberName || creator.externalName}>
                                                            {(creator.teamMemberName || creator.externalName || 'U').charAt(0)}
                                                        </div>
                                                    ))}
                                                    {project.creators.length > 3 && <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs border-2 border-white">+{project.creators.length - 3}</div>}
                                                </div>
                                            ) : <span className="text-gray-400 text-sm">—</span>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {project.practiceHoursEnabled ? (
                                                <Badge className="bg-blue-100 text-blue-700 text-xs"><Clock className="h-3 w-3 mr-1" />Sí</Badge>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(project)} className={project.status === 'published' ? "text-green-600" : "text-gray-400"}>
                                                {project.status === 'published' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" onClick={() => handleToggleFeatured(project)} className={project.featured ? "text-yellow-500" : "text-gray-400"}>
                                                {project.featured ? <Star className="h-4 w-4 fill-yellow-500" /> : <StarOff className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(project)}><Edit className="h-4 w-4" /></Button>
                                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteProject(project)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-orange-500" />Nuevo Proyecto</DialogTitle>
                        <DialogDescription>Completa la información del proyecto</DialogDescription>
                    </DialogHeader>
                    {renderFormContent()}
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
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleAddProject} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : <><Plus className="h-4 w-4 mr-2" />Crear Proyecto</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setSelectedProject(null); resetForm(); } }}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-orange-500" />Editar Proyecto</DialogTitle></DialogHeader>
                    {renderFormContent()}
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
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={handleEditProject} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600">
                            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"><CheckCircle className="h-8 w-8 text-green-600" /></div>
                        <DialogTitle className="text-xl mb-2">¡Proyecto creado!</DialogTitle>
                        <DialogDescription className="text-base"><span className="font-semibold text-gray-900">"{lastCreatedTitle}"</span> ha sido creado exitosamente</DialogDescription>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={() => setIsSuccessDialogOpen(false)} className="bg-green-600 hover:bg-green-700">Entendido</Button>
                        <Button variant="outline" onClick={() => { setIsSuccessDialogOpen(false); setIsAddDialogOpen(true); }}>Crear otro</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
