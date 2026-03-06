"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Badge } from "@/shared/ui/badges/badge";
import { Input } from "@/shared/ui/inputs/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/shared/ui/tables/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/shared/ui/misc/alert-dialog";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff,
  FileText, Download, FolderOpen, Loader2, AlertCircle,
  Lock, Users, Globe, ExternalLink, Upload, X, File
} from "lucide-react";
import { getAllResources, deleteResource, updateResource, createResource, type ResourceItem } from "./actions";

const typeLabels: Record<string, string> = {
  document: "Documento",
  guide: "Guía",
  tutorial: "Tutorial",
  template: "Plantilla",
  software: "Software",
  other: "Otro",
};

const visibilityLabels: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  public: { label: "Público", icon: Globe, color: "bg-green-100 text-green-800" },
  authenticated: { label: "Usuarios", icon: Users, color: "bg-blue-100 text-blue-800" },
  admin: { label: "Admin", icon: Lock, color: "bg-red-100 text-red-800" },
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

type Vista = "lista" | "formulario";

export default function RecursosAdminPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("lista");
  const [editando, setEditando] = useState<ResourceItem | null>(null);
  const [aEliminar, setAEliminar] = useState<ResourceItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    type: "document",
    externalUrl: "",
    folder: "",
    visibility: "public",
    status: "draft",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [existingFileId, setExistingFileId] = useState<number | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [existingFileSize, setExistingFileSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadResources = async () => {
    setLoading(true);
    const result = await getAllResources();
    setResources(result.resources);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => { loadResources(); }, []);

  // Obtener carpetas únicas
  const folders = [...new Set(resources.map(r => r.folder).filter(Boolean))] as string[];

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !folderFilter || r.folder === folderFilter;
    return matchesSearch && matchesFolder;
  });

  const handleNuevo = () => {
    setEditando(null);
    setForm({
      title: "", slug: "", description: "", type: "document",
      externalUrl: "", folder: "", visibility: "public", status: "draft",
    });
    setUploadFile(null);
    setExistingFileId(null);
    setExistingFileName(null);
    setExistingFileSize(null);
    setVista("formulario");
  };

  const handleEditar = (resource: ResourceItem) => {
    setEditando(resource);
    setForm({
      title: resource.title,
      slug: resource.slug || "",
      description: resource.description || "",
      type: resource.type,
      externalUrl: resource.externalUrl || "",
      folder: resource.folder || "",
      visibility: resource.visibility,
      status: resource.status,
    });
    setUploadFile(null);
    setExistingFileId(resource.file?.id || null);
    setExistingFileName(resource.file?.filename || null);
    setExistingFileSize(resource.file?.filesize || null);
    setVista("formulario");
  };

  const uploadMediaFile = async (file: File): Promise<number> => {
    const formData = new FormData();
    const altText = file.name.replace(/\.[^/.]+$/, "");
    formData.append("file", file);
    formData.append("_payload", JSON.stringify({ alt: altText }));

    const res = await fetch("/api/payload/media", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || "Error subiendo archivo");
    }

    const data = await res.json();
    return data.doc.id;
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setError("El archivo es muy grande. Máximo 100MB");
      return;
    }
    setUploadFile(file);
    setError(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleGuardar = async () => {
    setSaving(true);
    setError(null);
    try {
      const data: any = { ...form };

      // Upload file if there's a new one
      if (uploadFile) {
        setUploading(true);
        const mediaId = await uploadMediaFile(uploadFile);
        setUploading(false);
        data.file = mediaId;
      } else if (existingFileId) {
        data.file = existingFileId;
      } else if (editando?.file?.id) {
        // File was removed — clear the relationship
        data.file = null;
      }

      if (editando) {
        const res = await updateResource(editando.id, data);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createResource(data);
        if (!res.success) throw new Error(res.error);
      }
      setVista("lista");
      loadResources();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!aEliminar) return;
    const res = await deleteResource(aEliminar.id);
    if (!res.success) setError(res.error || "Error al eliminar");
    setAEliminar(null);
    loadResources();
  };

  const toggleStatus = async (resource: ResourceItem) => {
    const newStatus = resource.status === "published" ? "draft" : "published";
    await updateResource(resource.id, { status: newStatus } as any);
    loadResources();
  };

  // Vista Formulario
  if (vista === "formulario") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setVista("lista")}>← Volver</Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar Recurso" : "Nuevo Recurso"}</h1>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 pt-4 text-destructive">
              <AlertCircle className="h-5 w-5" /><span>{error}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre del recurso" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-amigable (auto)" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea className="w-full border rounded-md p-2 text-sm min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del recurso..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Visibilidad *</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
                  <option value="public">🌐 Público - Visible para todos</option>
                  <option value="authenticated">👤 Usuarios - Solo registrados</option>
                  <option value="admin">🔒 Admin - Solo administradores</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Carpeta</label>
                <Input value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} placeholder='Ej: "Manuales", "Diseños 3D"' />
              </div>
              <div>
                <label className="text-sm font-medium">URL Externa</label>
                <Input value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} placeholder="https://drive.google.com/..." />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium">Archivo</label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = "";
                }}
              />
              {uploadFile ? (
                <div className="mt-2 border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <File className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(uploadFile.size)} — Nuevo archivo (se subirá al guardar)
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => fileInputRef.current?.click()}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => setUploadFile(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : existingFileName ? (
                <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-200">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{existingFileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {existingFileSize ? formatBytes(existingFileSize) : ""} — Archivo actual
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => fileInputRef.current?.click()} title="Reemplazar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => { setExistingFileId(null); setExistingFileName(null); setExistingFileSize(null); }} title="Quitar">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, ZIP, STL, o cualquier archivo — Máx. 100MB</p>
                </div>
              )}
              {uploading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo archivo...
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setVista("lista")}>Cancelar</Button>
              <Button onClick={handleGuardar} disabled={saving || uploading || !form.title}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{uploading ? "Subiendo archivo..." : "Guardando..."}</> : "Guardar Recurso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista Lista
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recursos</h1>
          <p className="text-muted-foreground">Documentos, guías y archivos descargables</p>
        </div>
        <Button onClick={handleNuevo}>
          <Plus className="h-4 w-4 mr-2" />Nuevo Recurso
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /><span>{error}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setError(null)}>Cerrar</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{total}</div><p className="text-sm text-muted-foreground">Total recursos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{resources.filter(r => r.visibility === "public").length}</div><p className="text-sm text-muted-foreground">Públicos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{resources.filter(r => r.visibility === "authenticated").length}</div><p className="text-sm text-muted-foreground">Solo usuarios</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{resources.filter(r => r.visibility === "admin").length}</div><p className="text-sm text-muted-foreground">Solo admin</p></CardContent></Card>
      </div>

      {/* Filtro por carpetas */}
      {folders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <Button variant={!folderFilter ? "default" : "outline"} size="sm" onClick={() => setFolderFilter(null)}>Todas</Button>
          {folders.map(f => (
            <Button key={f} variant={folderFilter === f ? "default" : "outline"} size="sm" onClick={() => setFolderFilter(f)}>{f}</Button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar recursos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No se encontraron recursos</p>
              <Button onClick={handleNuevo}><Plus className="h-4 w-4 mr-2" />Crear Recurso</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Carpeta</TableHead>
                  <TableHead>Visibilidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Descargas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map(resource => {
                  const vis = visibilityLabels[resource.visibility] || visibilityLabels.public;
                  const VisIcon = vis.icon;
                  return (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {resource.title}
                        </div>
                        {resource.file?.filename && (
                          <p className="text-xs text-muted-foreground mt-0.5">{resource.file.filename} ({formatBytes(resource.file.filesize || 0)})</p>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{typeLabels[resource.type] || resource.type}</Badge></TableCell>
                      <TableCell className="text-sm">{resource.folder || "-"}</TableCell>
                      <TableCell>
                        <Badge className={vis.color}>
                          <VisIcon className="h-3 w-3 mr-1" />{vis.label}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge className={statusColors[resource.status]}>{statusLabels[resource.status]}</Badge></TableCell>
                      <TableCell className="text-sm">{resource.downloads}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(resource)} title={resource.status === "published" ? "Ocultar" : "Publicar"}>
                            {resource.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {(resource.file?.url || resource.externalUrl) && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={resource.file?.url || resource.externalUrl || "#"} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditar(resource)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAEliminar(resource)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!aEliminar} onOpenChange={() => setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{aEliminar?.title}&quot; permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
