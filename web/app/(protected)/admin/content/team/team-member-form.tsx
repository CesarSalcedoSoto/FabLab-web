"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Label } from "@/shared/ui/labels/label";
import { Textarea } from "@/shared/ui/inputs/textarea";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/shared/ui/misc/sheet";
import { createTeamMember, updateTeamMember } from "./actions";
import { ImagePositionEditor } from "./image-position-editor";
import { toast } from "sonner";
import {
    Loader2,
    Upload,
    X,
    User,
    Briefcase,
    Crown,
    UserCircle,
    Mail,
    Linkedin,
    Github,
    Twitter,
    Camera,
    CheckCircle2,
    AlertCircle,
    Move
} from "lucide-react";
import Image from "next/image";

interface TeamMemberFormProps {
    member?: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
    {
        value: 'leadership',
        label: 'Liderazgo & Dirección',
        description: 'Directores y coordinadores',
        icon: Crown,
        color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
        value: 'specialist',
        label: 'Especialistas Técnicos',
        description: 'Expertos en tecnología',
        icon: Briefcase,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
        value: 'collaborator',
        label: 'Colaboradores & Staff',
        description: 'Equipo de apoyo',
        icon: UserCircle,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
];

const EDUCATION_STATUS_OPTIONS = [
    { value: 'graduated', label: 'Egresado' },
    { value: 'studying', label: 'Cursando' },
    { value: 'titled', label: 'Titulado' },
    { value: 'bachelor', label: 'Bachiller' },
    { value: 'masters', label: 'Maestría' },
    { value: 'doctorate', label: 'Doctorado' },
];

const getObjectPosition = (position: string) => {
    if (!position) return '50% 50%';
    if (position.includes('%')) return position;
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

export function TeamMemberForm({ member, isOpen, onOpenChange, onSuccess }: TeamMemberFormProps) {
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('specialist');
    const [selectedEducationStatus, setSelectedEducationStatus] = useState<string>('graduated');
    const [selectedImagePosition, setSelectedImagePosition] = useState<string>('50% 50%');
    const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (member) {
            setImagePreview(member.image || null);
            setSelectedCategory(member.category || 'specialist');
            setSelectedEducationStatus(member.educationStatus || 'graduated');
            setSelectedImagePosition(member.imagePosition || '50% 50%');
        } else {
            setImagePreview(null);
            setSelectedCategory('specialist');
            setSelectedEducationStatus('graduated');
            setSelectedImagePosition('50% 50%');
        }
        setFormErrors({});
    }, [member, isOpen]);

    const validateForm = (formData: FormData): boolean => {
        const errors: Record<string, string> = {};

        const name = formData.get('name') as string;
        if (!name?.trim()) {
            errors.name = 'El nombre es requerido';
        }

        const role = formData.get('role') as string;
        if (!role?.trim()) {
            errors.role = 'El cargo es requerido';
        }

        if (!member && !imagePreview) {
            errors.image = 'La foto es requerida para nuevos miembros';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (!validateForm(formData)) {
            toast.error('Por favor completa los campos requeridos');
            return;
        }

        setLoading(true);

        try {
            if (member?.id) {
                await updateTeamMember(member.id, formData);
                toast.success("Perfil actualizado exitosamente");
            } else {
                const file = formData.get('image') as File;
                if (!file || file.size === 0) {
                    toast.error("Debes subir una foto para el nuevo miembro");
                    setLoading(false);
                    return;
                }
                await createTeamMember(formData);
                toast.success("¡Nuevo miembro agregado al equipo!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar los datos");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('La imagen no debe superar 2MB');
                return;
            }
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            setFormErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col h-full bg-white">
                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-gray-100 flex-none bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${member ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            <User className={`h-6 w-6 ${member ? 'text-blue-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold text-gray-900">
                                {member ? "Editar Perfil" : "Nuevo Miembro"}
                            </SheetTitle>
                            <SheetDescription className="text-gray-500">
                                {member
                                    ? `Modificando el perfil de ${member.name}`
                                    : "Completa la información del nuevo integrante"}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-8">

                            {/* Image Upload Section */}
                            <div className="relative">
                                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                                    Foto de Perfil {!member && <span className="text-red-500">*</span>}
                                </Label>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="relative">
                                        {imagePreview ? (
                                            <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-4 ring-gray-100 group">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    fill
                                                    sizes="144px"
                                                    quality={75}
                                                    className="transition-transform duration-500 group-hover:scale-105"
                                                    style={{ objectFit: 'cover', objectPosition: getObjectPosition(selectedImagePosition) }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveImage}
                                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`w-36 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${formErrors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'}`}
                                            >
                                                <div className={`p-3 rounded-full mb-2 transition-colors ${formErrors.image ? 'bg-red-100' : 'bg-gray-100 group-hover:bg-orange-100'}`}>
                                                    <Upload className={`w-6 h-6 ${formErrors.image ? 'text-red-400' : 'text-gray-400 group-hover:text-orange-500'}`} />
                                                </div>
                                                <span className={`text-sm font-medium ${formErrors.image ? 'text-red-500' : 'text-gray-500 group-hover:text-orange-600'}`}>
                                                    Subir foto
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-3 text-center sm:text-left">
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-gray-900">Requisitos de imagen</h4>
                                            <ul className="text-sm text-gray-500 space-y-1">
                                                <li>• Formato cuadrado (1:1) recomendado</li>
                                                <li>• Mínimo 400x400 píxeles</li>
                                                <li>• JPG o PNG, máximo 2MB</li>
                                            </ul>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            {imagePreview ? 'Reemplazar foto' : 'Seleccionar archivo'}
                                        </Button>
                                        {imagePreview && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsPositionEditorOpen(true)}
                                            >
                                                <Move className="mr-2 h-4 w-4" />
                                                Ajustar posición
                                            </Button>
                                        )}
                                        <Input
                                            ref={fileInputRef}
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <input type="hidden" name="imagePosition" value={selectedImagePosition} />
                                    </div>
                                </div>
                                {formErrors.image && (
                                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {formErrors.image}
                                    </p>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                            Nombre Completo <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={member?.name}
                                            placeholder="Ej: Marcela Silva López"
                                            className={`h-11 ${formErrors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        />
                                        {formErrors.name && (
                                            <p className="text-xs text-red-500">{formErrors.name}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                                            Cargo / Puesto <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="role"
                                            name="role"
                                            defaultValue={member?.role}
                                            placeholder="Ej: Coordinadora de Proyectos"
                                            className={`h-11 ${formErrors.role ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        />
                                        {formErrors.role && (
                                            <p className="text-xs text-red-500">{formErrors.role}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Category Selection - Visual Cards */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-700">Categoría del Equipo</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {CATEGORY_OPTIONS.map((option) => {
                                            const Icon = option.icon;
                                            const isSelected = selectedCategory === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(option.value)}
                                                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                            ? `${option.color} ring-2 ring-offset-2`
                                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-current" />
                                                    )}
                                                    <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                                                    <p className={`font-medium text-sm ${isSelected ? 'text-current' : 'text-gray-700'}`}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {option.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input type="hidden" name="category" value={selectedCategory} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="specialty" className="text-sm font-medium text-gray-700">
                                        Especialidad Principal
                                    </Label>
                                    <Input
                                        id="specialty"
                                        name="specialty"
                                        defaultValue={member?.specialty}
                                        placeholder="Ej: Fabricación Digital, Impresión 3D"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience" className="text-sm font-medium text-gray-700">
                                        Experiencia / Trayectoria
                                    </Label>
                                    <Input
                                        id="experience"
                                        name="experience"
                                        defaultValue={member?.experience}
                                        placeholder="Ej: 8 años en innovación y fabricación digital"
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-700">Estado de Estudios</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {EDUCATION_STATUS_OPTIONS.map((option) => {
                                            const isSelected = selectedEducationStatus === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setSelectedEducationStatus(option.value)}
                                                    className={`relative p-3 rounded-lg border-2 transition-all text-center ${
                                                        isSelected
                                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <p className={`font-medium text-sm ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                                                        {option.label}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input type="hidden" name="educationStatus" value={selectedEducationStatus} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                                        Biografía Pública
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        defaultValue={member?.bio}
                                        rows={4}
                                        placeholder="Escribe una breve descripción profesional que se mostrará en la página pública del equipo..."
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-gray-400">Máximo 300 caracteres recomendados</p>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-700">Redes y Contacto</h3>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Opcional</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5" />
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={member?.social?.email}
                                            placeholder="correo@fablab.com"
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin" className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
                                            <Linkedin className="h-3.5 w-3.5" />
                                            LinkedIn
                                        </Label>
                                        <Input
                                            id="linkedin"
                                            name="linkedin"
                                            defaultValue={member?.social?.linkedin}
                                            placeholder="linkedin.com/in/usuario"
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="github" className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
                                            <Github className="h-3.5 w-3.5" />
                                            GitHub / Portfolio
                                        </Label>
                                        <Input
                                            id="github"
                                            name="github"
                                            defaultValue={member?.social?.github}
                                            placeholder="github.com/usuario"
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="twitter" className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
                                            <Twitter className="h-3.5 w-3.5" />
                                            Twitter / X
                                        </Label>
                                        <Input
                                            id="twitter"
                                            name="twitter"
                                            defaultValue={member?.social?.twitter}
                                            placeholder="@usuario"
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-none">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs text-gray-400 hidden sm:block">
                                Los cambios se reflejarán en la página pública
                            </p>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    type="button"
                                    className="flex-1 sm:flex-none"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 sm:flex-none min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {member ? "Guardar Cambios" : "Crear Perfil"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </SheetContent>

            {/* Editor de posición de imagen */}
            {imagePreview && (
                <ImagePositionEditor
                    imageUrl={imagePreview}
                    currentPosition={selectedImagePosition}
                    isOpen={isPositionEditorOpen}
                    onClose={() => setIsPositionEditorOpen(false)}
                    onSave={(position) => setSelectedImagePosition(position)}
                />
            )}
        </Sheet>
    );
}
