"use client";

import { useEffect, useState } from "react";
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
  Calendar, MapPin, Loader2, AlertCircle, ExternalLink, Globe, Video
} from "lucide-react";
import { getAllEvents, deleteEvent, updateEvent, createEvent, type EventItem } from "./actions";

const typeLabels: Record<string, string> = {
  workshop: "Taller",
  course: "Curso",
  talk: "Charla",
  hackathon: "Hackathon",
  "open-day": "Open Day",
  meetup: "Meetup",
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  cancelled: "Cancelado",
  completed: "Completado",
};

function formatDate(d: string | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

type Vista = "lista" | "formulario";

export default function EventosAdminPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vista, setVista] = useState<Vista>("lista");
  const [editando, setEditando] = useState<EventItem | null>(null);
  const [aEliminar, setAEliminar] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    slug: "",
    type: "workshop",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    isOnline: false,
    capacity: 0,
    registrationUrl: "",
    price: "",
    status: "draft",
    featured: false,
  });

  const loadEvents = async () => {
    setLoading(true);
    const result = await getAllEvents();
    setEvents(result.events);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNuevo = () => {
    setEditando(null);
    setForm({
      title: "", slug: "", type: "workshop", description: "",
      startDate: "", endDate: "", location: "", isOnline: false,
      capacity: 0, registrationUrl: "", price: "", status: "draft", featured: false,
    });
    setVista("formulario");
  };

  const handleEditar = (event: EventItem) => {
    setEditando(event);
    setForm({
      title: event.title,
      slug: event.slug,
      type: event.type,
      description: event.description,
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      location: event.location || "",
      isOnline: event.isOnline || false,
      capacity: event.capacity || 0,
      registrationUrl: event.registrationUrl || "",
      price: event.price || "",
      status: event.status,
      featured: event.featured || false,
    });
    setVista("formulario");
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError(null);
    try {
      const data: any = { ...form };
      if (data.startDate) data.startDate = new Date(data.startDate).toISOString();
      if (data.endDate) data.endDate = new Date(data.endDate).toISOString();
      if (!data.capacity) delete data.capacity;

      if (editando) {
        const res = await updateEvent(editando.id, data);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createEvent(data);
        if (!res.success) throw new Error(res.error);
      }
      setVista("lista");
      loadEvents();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!aEliminar) return;
    const res = await deleteEvent(aEliminar.id);
    if (!res.success) setError(res.error || "Error al eliminar");
    setAEliminar(null);
    loadEvents();
  };

  const toggleStatus = async (event: EventItem) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    await updateEvent(event.id, { status: newStatus } as any);
    loadEvents();
  };

  // Vista Formulario
  if (vista === "formulario") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setVista("lista")}>← Volver</Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar Evento" : "Nuevo Evento"}</h1>
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
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre del evento" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-amigable (auto)" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(typeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <select className="w-full border rounded-md p-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Precio</label>
                <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder='Ej: "Gratis", "$10.000"' />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descripción *</label>
              <textarea className="w-full border rounded-md p-2 text-sm min-h-[100px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del evento..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha Inicio *</label>
                <Input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Fin</label>
                <Input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ubicación</label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="FabLab INACAP Sede Los Ángeles" />
              </div>
              <div>
                <label className="text-sm font-medium">Capacidad</label>
                <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">URL de Inscripción</label>
              <Input value={form.registrationUrl} onChange={e => setForm(f => ({ ...f, registrationUrl: e.target.value }))} placeholder="https://forms.google.com/..." />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isOnline} onChange={e => setForm(f => ({ ...f, isOnline: e.target.checked }))} className="rounded" />
                Evento Online
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
                Destacado
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setVista("lista")}>Cancelar</Button>
              <Button onClick={handleGuardar} disabled={saving || !form.title || !form.description || !form.startDate}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar Evento"}
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
          <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">Gestiona talleres, cursos y actividades</p>
        </div>
        <Button onClick={handleNuevo}>
          <Plus className="h-4 w-4 mr-2" />Nuevo Evento
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
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{total}</div><p className="text-sm text-muted-foreground">Total eventos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{events.filter(e => e.status === "published").length}</div><p className="text-sm text-muted-foreground">Publicados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{events.filter(e => e.status === "draft").length}</div><p className="text-sm text-muted-foreground">Borradores</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{events.filter(e => e.featured).length}</div><p className="text-sm text-muted-foreground">Destacados</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar eventos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No se encontraron eventos</p>
              <Button onClick={handleNuevo}><Plus className="h-4 w-4 mr-2" />Crear Evento</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {event.featured && <span className="text-yellow-500">★</span>}
                        {event.title}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{typeLabels[event.type] || event.type}</Badge></TableCell>
                    <TableCell className="text-sm">{formatDate(event.startDate)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        {event.isOnline ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {event.isOnline ? "Online" : (event.location || "-")}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={statusColors[event.status]}>{statusLabels[event.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(event)} title={event.status === "published" ? "Ocultar" : "Publicar"}>
                          {event.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {event.registrationUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={event.registrationUrl} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEditar(event)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAEliminar(event)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!aEliminar} onOpenChange={() => setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
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
