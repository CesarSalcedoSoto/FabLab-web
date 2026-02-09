"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Label } from "@/shared/ui/labels/label";
import { Textarea } from "@/shared/ui/inputs/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/misc/sheet";
import { createProject, updateProject, getTeamMembersForSelect } from "./actions";
import type { ProjectData } from "./data";
import { toast } from "sonner";
import { Loader2, Upload, X, FolderOpen, Star, Camera, Plus, Trash2, Link, Users, User, ExternalLink } from "lucide-react";
import Image from "next/image";

interface ProjectFormProps {
    project?: ProjectData | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface LocalCreator { teamMemberId?: string; externalName?: string; role?: string; }
interface LocalLink { label: string; url: string; }

export function ProjectForm({ project, isOpen, onOpenChange, onSuccess }: ProjectFormProps) {
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('draft');
    const [isFeatured, setIsFeatured] = useState(false);
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [newTech, setNewTech] = useState("");
    const [creators, setCreators] = useState<LocalCreator[]>([]);
    const [links, setLinks] = useState<LocalLink[]>([]);
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { getTeamMembersForSelect().then(setTeamMembers); }, []);

    useEffect(() => {
        if (project) {
            setImagePreview(project.featuredImage);
            setSelectedStatus(project.status);
            setIsFeatured(project.featured);
            setTechnologies(project.technologies);
            setCreators(project.creators.map(c => ({ teamMemberId: c.teamMemberId, externalName: c.externalName, role: c.role })));
            setLinks(project.links);
        } else {
            setImagePreview(null);
            setSelectedStatus('draft');
            setIsFeatured(false);
            setTechnologies([]);
            setCreators([]);
            setLinks([]);
        }
    }, [project, isOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        formData.set('technologies', technologies.join(','));
        formData.set('creators', JSON.stringify(creators.map(c => ({
            teamMember: c.teamMemberId || undefined,
            externalName: c.externalName || undefined,
            role: c.role,
        }))));
        formData.set('links', JSON.stringify(links));
        formData.set('status', selectedStatus);
        formData.set('featured', isFeatured.toString());

        setLoading(true);
        try {
            const result = project?.id ? await updateProject(project.id, formData) : await createProject(formData);
            if (result.success) { toast.success(project ? "Actualizado" : "Creado"); onSuccess(); onOpenChange(false); }
            else toast.error(result.error || "Error");
        } catch (error) { console.error(error); toast.error("Error"); }
        finally { setLoading(false); }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddTech = () => {
        if (newTech.trim() && !technologies.includes(newTech.trim())) {
            setTechnologies([...technologies, newTech.trim()]);
            setNewTech("");
        }
    };

    const handleAddCreator = (isTeam: boolean) => {
        setCreators([...creators, isTeam ? { teamMemberId: '', role: '' } : { externalName: '', role: '' }]);
    };

    const handleCreatorChange = (index: number, field: string, value: string) => {
        const updated = [...creators];
        (updated[index] as any)[field] = value;
        setCreators(updated);
    };

    const handleAddLink = () => setLinks([...links, { label: '', url: '' }]);

    const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
        const updated = [...links];
        updated[index][field] = value;
        setLinks(updated);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col h-full bg-white">
                <SheetHeader className="px-6 py-5 border-b bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${project ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            <FolderOpen className={`h-6 w-6 ${project ? 'text-blue-600' : 'text-orange-600'}`} />
                        </div>
                        <div className="flex-1">
                            <SheetTitle className="text-xl font-bold">{project ? "Editar Proyecto" : "Nuevo Proyecto"}</SheetTitle>
                            <SheetDescription>{project ? project.title : "Completa la información básica"}</SheetDescription>
                        </div>
                        {project && (
                            <Button type="button" variant="outline" size="sm" onClick={() => window.open(`/cms/collections/projects/${project.id}`, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-1" />CMS
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Imagen */}
                        <div>
                            <Label className="mb-2 block">Imagen Principal</Label>
                            <div className="flex items-center gap-4">
                                {imagePreview ? (
                                    <div className="relative w-40 h-28 rounded-xl overflow-hidden border-2 group">
                                        <Image src={imagePreview} alt="Preview" fill sizes="160px" className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full"><Camera className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => setImagePreview(null)} className="p-2 bg-red-500 text-white rounded-full"><X className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => fileInputRef.current?.click()} className="w-40 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50">
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-xs text-gray-500 mt-1">Subir imagen</span>
                                    </div>
                                )}
                                <Input ref={fileInputRef} name="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                        </div>

                        {/* Info básica */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="title">Título *</Label>
                                <Input id="title" name="title" defaultValue={project?.title} required className="mt-1" />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="description">Descripción *</Label>
                                <Textarea id="description" name="description" defaultValue={project?.description} required rows={3} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="year">Año</Label>
                                <Input id="year" name="year" type="number" defaultValue={project?.year || new Date().getFullYear()} className="mt-1" />
                            </div>
                            <div>
                                <Label>Estado</Label>
                                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full h-10 rounded-lg border px-3 text-sm mt-1">
                                    <option value="draft">Borrador</option>
                                    <option value="published">Publicado</option>
                                </select>
                            </div>
                        </div>

                        {/* Destacado */}
                        <div>
                            <button type="button" onClick={() => setIsFeatured(!isFeatured)} className={`w-full h-10 rounded-lg border-2 flex items-center justify-center gap-2 ${isFeatured ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                                <Star className={`h-4 w-4 ${isFeatured ? 'fill-orange-500' : ''}`} />
                                {isFeatured ? 'Destacado' : 'No destacado'}
                            </button>
                        </div>

                        {/* Tecnologías */}
                        <div>
                            <Label className="mb-2 block">Tecnologías</Label>
                            <div className="flex gap-2 mb-2">
                                <Input value={newTech} onChange={(e) => setNewTech(e.target.value)} placeholder="Arduino, Python..." onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())} />
                                <Button type="button" variant="outline" onClick={handleAddTech}><Plus className="w-4 h-4" /></Button>
                            </div>
                            {technologies.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {technologies.map((tech) => (
                                        <span key={tech} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                            {tech}
                                            <button type="button" onClick={() => setTechnologies(technologies.filter(t => t !== tech))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Creadores */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Creadores</Label>
                                <div className="flex gap-1">
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddCreator(true)}><Users className="w-4 h-4 mr-1" />Equipo</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddCreator(false)}><User className="w-4 h-4 mr-1" />Externo</Button>
                                </div>
                            </div>
                            {creators.length > 0 ? (
                                <div className="space-y-2">
                                    {creators.map((c, idx) => (
                                        <div key={idx} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
                                            {c.teamMemberId !== undefined ? (
                                                <select value={c.teamMemberId} onChange={(e) => handleCreatorChange(idx, 'teamMemberId', e.target.value)} className="flex-1 h-9 rounded border px-2 text-sm">
                                                    <option value="">Seleccionar...</option>
                                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            ) : (
                                                <Input placeholder="Nombre" value={c.externalName || ''} onChange={(e) => handleCreatorChange(idx, 'externalName', e.target.value)} className="flex-1 h-9" />
                                            )}
                                            <Input placeholder="Rol" value={c.role || ''} onChange={(e) => handleCreatorChange(idx, 'role', e.target.value)} className="flex-1 h-9" />
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setCreators(creators.filter((_, i) => i !== idx))} className="text-red-500 h-9 w-9 p-0"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-400 text-center py-3 border border-dashed rounded-lg">Sin creadores</p>}
                        </div>

                        {/* Enlaces */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="flex items-center gap-2"><Link className="w-4 h-4" />Enlaces</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddLink}><Plus className="w-4 h-4 mr-1" />Añadir</Button>
                            </div>
                            {links.length > 0 ? (
                                <div className="space-y-2">
                                    {links.map((link, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <Input placeholder="Nombre (ej: Video, Repo, Docs)" value={link.label} onChange={(e) => handleLinkChange(idx, 'label', e.target.value)} className="w-40" />
                                            <Input placeholder="https://..." value={link.url} onChange={(e) => handleLinkChange(idx, 'url', e.target.value)} className="flex-1" />
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-400 text-center py-3 border border-dashed rounded-lg">Sin enlaces</p>}
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} type="button">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 min-w-[120px]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {project ? "Guardar" : "Crear"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
