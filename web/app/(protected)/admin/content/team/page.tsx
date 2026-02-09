"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Badge } from "@/shared/ui/misc/badge";
import { Label } from "@/shared/ui/labels/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/misc/dialog";
import {
    Users,
    Clock,
    FolderOpen,
    Search,
    Plus,
    TrendingUp,
    Edit,
    Trash2,
    X,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { 
    getTeamMembers, 
    createTeamMember, 
    updateTeamMember, 
    deleteTeamMember,
    toggleTeamMemberStatus 
} from "./actions";

// Tipo para los datos retornados por getTeamMembers
interface TeamMemberData {
    id: string;
    name?: string;
    role?: string;
    category?: string;
    specialty?: string;
    bio?: string;
    experience?: string;
    image?: string;
    active?: boolean;
}

interface Specialist {
    id: string;
    name: string;
    profession: string;
    image: string;
    active: boolean;
    skills: string[];
    role?: string;
    category?: string;
    specialty?: string;
    bio?: string;
    experience?: string;
}

export default function EspecialistasPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [specialistsList, setSpecialistsList] = useState<Specialist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form states for adding/editing specialist
    const [formData, setFormData] = useState({
        name: "",
        profession: "",
        skills: "",
        active: true,
    });

    // Cargar especialistas desde la base de datos
    const loadSpecialists = useCallback(async () => {
        try {
            setIsLoading(true);
            const members = await getTeamMembers();
            
            // Mapear datos de la BD al formato del componente
            const mapped: Specialist[] = members.map((m: TeamMemberData) => ({
                id: m.id,
                name: m.name || '',
                profession: m.specialty || m.role || '',
                image: m.image || '',
                active: m.active !== false,
                skills: [], // TODO: agregar campo skills en la BD si es necesario
                role: m.role,
                category: m.category,
                specialty: m.specialty,
                bio: m.bio,
                experience: m.experience,
            }));
            
            setSpecialistsList(mapped);
        } catch (error) {
            console.error("Error cargando especialistas:", error);
            toast.error("Error al cargar especialistas");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Cargar al montar el componente
    useEffect(() => {
        loadSpecialists();
    }, [loadSpecialists]);

    const activeSpecialists = specialistsList.filter(s => s.active).length;
    const totalSpecialists = specialistsList.length;
    
    // Calcular porcentaje de mejora del equipo
    const teamImprovement = totalSpecialists > 0 
        ? Math.round((activeSpecialists / totalSpecialists) * 100 - 70)
        : 0;

    const filteredSpecialists = specialistsList.filter(specialist =>
        specialist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialist.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specialist.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddSpecialist = async () => {
        if (!formData.name || !formData.profession) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        try {
            setIsSaving(true);
            const form = new FormData();
            form.append('name', formData.name);
            form.append('role', formData.profession);
            form.append('specialty', formData.profession);
            form.append('category', 'collaborator');
            
            await createTeamMember(form);
            
            setIsAddDialogOpen(false);
            setFormData({ name: "", profession: "", skills: "", active: true });
            toast.success(`${formData.name} agregado al equipo`);
            
            // Recargar lista
            loadSpecialists();
        } catch (error) {
            console.error("Error creando especialista:", error);
            toast.error("Error al crear especialista");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditSpecialist = async () => {
        if (!selectedSpecialist || !formData.name || !formData.profession) {
            toast.error("Por favor completa todos los campos requeridos");
            return;
        }

        try {
            setIsSaving(true);
            const form = new FormData();
            form.append('name', formData.name);
            form.append('role', formData.profession);
            form.append('specialty', formData.profession);
            form.append('active', String(formData.active));
            
            await updateTeamMember(selectedSpecialist.id, form);
            
            setIsEditDialogOpen(false);
            setSelectedSpecialist(null);
            setFormData({ name: "", profession: "", skills: "", active: true });
            toast.success("Especialista actualizado");
            
            // Recargar lista
            loadSpecialists();
        } catch (error) {
            console.error("Error actualizando especialista:", error);
            toast.error("Error al actualizar especialista");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSpecialist = async (specialist: Specialist) => {
        if (confirm(`¿Estás seguro de eliminar a ${specialist.name}?`)) {
            try {
                await deleteTeamMember(specialist.id);
                toast.success(`${specialist.name} eliminado del equipo`);
                loadSpecialists();
            } catch (error) {
                console.error("Error eliminando especialista:", error);
                toast.error("Error al eliminar especialista");
            }
        }
    };

    const handleToggleStatus = async (specialist: Specialist) => {
        try {
            await toggleTeamMemberStatus(specialist.id, !specialist.active);
            toast.success(`${specialist.name} ${!specialist.active ? 'activado' : 'desactivado'}`);
            loadSpecialists();
        } catch (error) {
            console.error("Error cambiando estado:", error);
            toast.error("Error al cambiar estado");
        }
    };

    const openEditDialog = (specialist: Specialist) => {
        setSelectedSpecialist(specialist);
        setFormData({
            name: specialist.name,
            profession: specialist.profession,
            skills: specialist.skills.join(', '),
            active: specialist.active,
        });
        setIsEditDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Especialistas</h1>
                <p className="text-gray-600 mt-1">Gestión del equipo de trabajo</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Especialistas Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeSpecialists}/{totalSpecialists}</div>
                        <div className="flex items-center text-xs text-green-600 mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {totalSpecialists > 0 ? Math.round((activeSpecialists / totalSpecialists) * 100) : 0}% del equipo
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Mejora del Equipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {teamImprovement > 0 ? `+${teamImprovement}%` : `${teamImprovement}%`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            vs. baseline del 70%
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Estado del Equipo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {activeSpecialists === totalSpecialists ? "Completo" : "Parcial"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {totalSpecialists - activeSpecialists} inactivos
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Actions Bar */}
            <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar especialistas por nombre o profesión..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Agregar Especialista
                </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Cargando especialistas...</span>
                </div>
            )}

            {/* Specialists Grid */}
            {!isLoading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSpecialists.map((specialist) => (
                        <Card key={specialist.id} className="hover:shadow-md transition-shadow group relative">
                            {/* Action buttons */}
                            <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    size="sm" 
                                    variant="secondary"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditDialog(specialist)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDeleteSpecialist(specialist)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    {/* Profile Image */}
                                    <div className="relative">
                                        {specialist.image ? (
                                            <Image 
                                                src={specialist.image} 
                                                alt={specialist.name}
                                                width={64}
                                                height={64}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                                                {specialist.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        )}
                                        {/* Status Indicator */}
                                        <div 
                                            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white cursor-pointer ${
                                                specialist.active ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                            onClick={() => handleToggleStatus(specialist)}
                                            title={specialist.active ? 'Click para desactivar' : 'Click para activar'}
                                        ></div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                                            {specialist.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">{specialist.profession}</p>
                                        <div className="mt-1">
                                            <Badge variant={specialist.active ? "default" : "secondary"} className={
                                                specialist.active 
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                                    : "bg-red-100 text-red-700 hover:bg-red-100"
                                            }>
                                                {specialist.active ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio/Experience */}
                                {(specialist.bio || specialist.experience) && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        {specialist.bio && (
                                            <p className="text-sm text-gray-600 line-clamp-2">{specialist.bio}</p>
                                        )}
                                        {specialist.experience && (
                                            <p className="text-xs text-gray-500 mt-1">Experiencia: {specialist.experience}</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && filteredSpecialists.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No se encontraron especialistas</p>
                    {searchQuery && (
                        <Button variant="link" onClick={() => setSearchQuery("")}>
                            Limpiar búsqueda
                        </Button>
                    )}
                </div>
            )}

            {/* Diálogo: Agregar Especialista */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Agregar Especialista</DialogTitle>
                        <DialogDescription>
                            Completa los datos del nuevo miembro del equipo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo *</Label>
                            <Input
                                id="name"
                                placeholder="Ej: César Salcedo"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profession">Profesión / Especialidad *</Label>
                            <Input
                                id="profession"
                                placeholder="Ej: Ing. Informático"
                                value={formData.profession}
                                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="rounded"
                            />
                            <Label htmlFor="active">Especialista activo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddSpecialist} disabled={isSaving}>
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

            {/* Diálogo: Editar Especialista */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Especialista</DialogTitle>
                        <DialogDescription>
                            Actualiza los datos del miembro del equipo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre completo *</Label>
                            <Input
                                id="edit-name"
                                placeholder="Ej: César Salcedo"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-profession">Profesión / Especialidad *</Label>
                            <Input
                                id="edit-profession"
                                placeholder="Ej: Ing. Informático"
                                value={formData.profession}
                                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-active"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="rounded"
                            />
                            <Label htmlFor="edit-active">Especialista activo</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEditSpecialist} disabled={isSaving}>
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
        </div>
    );
}
