"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RequireAuth } from "@/shared/auth/RequireAuth";
import { useAuth } from "@/shared/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Badge } from "@/shared/ui/misc/badge";
import { Input } from "@/shared/ui/inputs/input";
import { Label } from "@/shared/ui/labels/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/inputs/select";
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Save, 
  Loader2, 
  Upload, 
  Camera,
  Briefcase,
  Eye,
  EyeOff,
  Linkedin,
  Github,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentUserProfile, updateUserProfile } from "./actions";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  bio: string;
  category: string;
  showInTeam: boolean;
  linkedin: string;
  github: string;
  experience: string;
  avatar: string | null;
  avatarId: string | null;
  role: string;
}

export default function AdminProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    id: '',
    name: '',
    email: '',
    jobTitle: '',
    bio: '',
    category: 'specialist',
    showInTeam: false,
    linkedin: '',
    github: '',
    experience: '',
    avatar: null,
    avatarId: null,
    role: 'viewer',
  });
  
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const result = await getCurrentUserProfile();
      if (result.success && result.user) {
        setFormData(result.user as ProfileData);
        setImagePreview(result.user.avatar || null);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/admin");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      setIsSaving(true);
      
      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);
      form.append('jobTitle', formData.jobTitle);
      form.append('bio', formData.bio);
      form.append('category', formData.category);
      form.append('showInTeam', String(formData.showInTeam));
      form.append('linkedin', formData.linkedin);
      form.append('github', formData.github);
      form.append('experience', formData.experience);
      
      if (password) {
        form.append('password', password);
      }
      
      if (selectedFile) {
        form.append('avatar', selectedFile);
      }

      const result = await updateUserProfile(form);
      
      if (result.success) {
        toast.success("Perfil actualizado correctamente");
        setPassword('');
        setSelectedFile(null);
        loadProfile(); // Recargar datos
      } else {
        toast.error(result.error || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error guardando perfil:", error);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      editor: 'Editor',
      author: 'Autor',
      viewer: 'Visualizador',
    };
    return labels[role] || role;
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      leadership: 'Equipo Directivo',
      specialist: 'Especialista',
      collaborator: 'Colaborador',
    };
    return labels[cat] || cat;
  };

  return (
    <RequireAuth>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Administra tu información personal y configuración</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Cargando perfil...</span>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto y datos básicos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-orange-500" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Avatar"
                        width={100}
                        height={100}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-gray-100">
                        {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{formData.name || 'Sin nombre'}</h3>
                    <p className="text-gray-500">{formData.email}</p>
                    <Badge className="mt-2 bg-orange-100 text-orange-700">
                      {getRoleLabel(formData.role)}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña (dejar vacío para mantener actual)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && password.length < 8 && (
                    <p className="text-xs text-red-500">La contraseña debe tener al menos 8 caracteres</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información profesional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-orange-500" />
                  Información Profesional
                </CardTitle>
                <CardDescription>
                  Estos datos se muestran en la página /equipo si está habilitado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Cargo */}
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Cargo / Especialidad</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="Ej: Ing. Electrónico, Diseñador 3D"
                    />
                  </div>

                  {/* Categoría */}
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leadership">Equipo Directivo</SelectItem>
                        <SelectItem value="specialist">Especialista</SelectItem>
                        <SelectItem value="collaborator">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Experiencia */}
                <div className="space-y-2">
                  <Label htmlFor="experience">Experiencia</Label>
                  <Input
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="Ej: 10+ años en desarrollo"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía corta</Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Cuéntanos sobre ti..."
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Mostrar en equipo */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="showInTeam"
                    checked={formData.showInTeam}
                    onChange={(e) => setFormData({ ...formData, showInTeam: e.target.checked })}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 h-5 w-5"
                  />
                  <div>
                    <Label htmlFor="showInTeam" className="font-medium cursor-pointer">
                      Mostrar mi perfil en la página de Equipo
                    </Label>
                    <p className="text-sm text-gray-500">Tu perfil será visible en la sección /equipo del sitio web</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redes sociales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Linkedin className="h-5 w-5 text-orange-500" />
                  Redes Sociales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/tu-perfil"
                    />
                  </div>

                  {/* GitHub */}
                  <div className="space-y-2">
                    <Label htmlFor="github" className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/tu-usuario"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </RequireAuth>
  );
}
