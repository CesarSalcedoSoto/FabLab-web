"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Badge } from "@/shared/ui/badges/badge";
import { Input } from "@/shared/ui/inputs/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/shared/ui/misc/alert-dialog";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff,
  ImageIcon, Loader2, AlertCircle, Star
} from "lucide-react";
import Image from "next/image";
import { getAllGallery, deleteGalleryItem, updateGalleryItem, createGalleryItem, type GalleryItem } from "./actions";

function formatDate(d: string | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

type Vista = "lista" | "formulario";

export default function GaleriaAdminPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("lista");
  const [editando, setEditando] = useState<GalleryItem | null>(null);
  const [aEliminar, setAEliminar] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    album: "",
    date: "",
    featured: false,
    status: "draft",
  });

  const loadItems = async () => {
    setLoading(true);
    const result = await getAllGallery();
    setItems(result.items);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const albums = [...new Set(items.map(i => i.album).filter(Boolean))] as string[];

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase());
    const matchesAlbum = !albumFilter || i.album === albumFilter;
    return matchesSearch && matchesAlbum;
  });

  const handleNuevo = () => {
    setEditando(null);
    setForm({ title: "", description: "", album: "", date: "", featured: false, status: "draft" });
    setVista("formulario");
  };

  const handleEditar = (item: GalleryItem) => {
    setEditando(item);
    setForm({
      title: item.title,
      description: item.description || "",
      album: item.album || "",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      featured: item.featured || false,
      status: item.status,
    });
    setVista("formulario");
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError(null);
    try {
      const data: any = { ...form };
      if (data.date) data.date = new Date(data.date).toISOString();
      else delete data.date;

      if (editando) {
        const res = await updateGalleryItem(editando.id, data);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createGalleryItem(data);
        if (!res.success) throw new Error(res.error);
      }
      setVista("lista");
      loadItems();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!aEliminar) return;
    const res = await deleteGalleryItem(aEliminar.id);
    if (!res.success) setError(res.error || "Error al eliminar");
    setAEliminar(null);
    loadItems();
  };

  const toggleStatus = async (item: GalleryItem) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    await updateGalleryItem(item.id, { status: newStatus } as any);
    loadItems();
  };

  const toggleFeatured = async (item: GalleryItem) => {
    await updateGalleryItem(item.id, { featured: !item.featured } as any);
    loadItems();
  };

  // Vista Formulario
  if (vista === "formulario") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setVista("lista")}>← Volver</Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar Imagen" : "Nueva Imagen"}</h1>
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
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título de la imagen" />
              </div>
              <div>
                <label className="text-sm font-medium">Álbum</label>
                <Input value={form.album} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} placeholder='Ej: "Inauguración 2025"' />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea className="w-full border rounded-md p-2 text-sm min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción de la imagen..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicada</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
              Imagen destacada
            </label>

            <p className="text-xs text-muted-foreground">
              Nota: Para subir la imagen, usa el CMS de Payload en /cms → Galería y vincula el archivo de medios.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setVista("lista")}>Cancelar</Button>
              <Button onClick={handleGuardar} disabled={saving || !form.title}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista Lista (Grid de imágenes)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Galería</h1>
          <p className="text-muted-foreground">Fotos y videos del FabLab</p>
        </div>
        <Button onClick={handleNuevo}>
          <Plus className="h-4 w-4 mr-2" />Añadir Imagen
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{total}</div><p className="text-sm text-muted-foreground">Total imágenes</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{items.filter(i => i.status === "published").length}</div><p className="text-sm text-muted-foreground">Publicadas</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{albums.length}</div><p className="text-sm text-muted-foreground">Álbumes</p></CardContent></Card>
      </div>

      {/* Filtro álbumes */}
      {albums.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Button variant={!albumFilter ? "default" : "outline"} size="sm" onClick={() => setAlbumFilter(null)}>Todos</Button>
          {albums.map(a => (
            <Button key={a} variant={albumFilter === a ? "default" : "outline"} size="sm" onClick={() => setAlbumFilter(a)}>{a}</Button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar imágenes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No se encontraron imágenes</p>
          <Button onClick={handleNuevo}><Plus className="h-4 w-4 mr-2" />Añadir Imagen</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-video bg-gray-100">
                {item.image?.url ? (
                  <Image src={item.image.url} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {/* Overlay de acciones */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => toggleStatus(item)}>
                    {item.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleFeatured(item)}>
                    <Star className={`h-4 w-4 ${item.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleEditar(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setAEliminar(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    {item.album && <p className="text-xs text-muted-foreground">{item.album}</p>}
                  </div>
                  <Badge className={item.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {item.status === "published" ? "Visible" : "Oculta"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!aEliminar} onOpenChange={() => setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
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
