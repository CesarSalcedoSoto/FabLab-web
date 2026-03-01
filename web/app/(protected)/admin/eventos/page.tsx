"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/misc/tabs";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, Users, CheckSquare,
  Calendar, MapPin, Loader2, AlertCircle, ExternalLink, Video,
  Download, ClipboardList, UserCheck, XCircle, ChevronLeft, PenLine, X
} from "lucide-react";
import {
  getAllEvents, deleteEvent, updateEvent, createEvent,
  getEventRegistrations, updateRegistration, deleteRegistration,
  getEventAttendance, initializeAttendance, toggleAttendance,
  exportEventData, getRegistrationCount,
  type EventItem, type RegistrationItem, type AttendanceItem, type RegistrationFieldDef
} from "./actions";

/* ─── Constants ─── */

const typeLabels: Record<string, string> = {
  workshop: "Taller", course: "Curso", talk: "Charla",
  hackathon: "Hackathon", "open-day": "Open Day", meetup: "Meetup",
};
const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800", published: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800", completed: "bg-gray-100 text-gray-800",
};
const statusLabels: Record<string, string> = {
  draft: "Borrador", published: "Publicado", cancelled: "Cancelado", completed: "Completado",
};
const regStatusLabels: Record<string, string> = {
  confirmed: "Confirmada", pending: "Pendiente", cancelled: "Cancelada", waitlist: "Lista de Espera",
};
const regStatusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800", waitlist: "bg-blue-100 text-blue-800",
};
const calendarColorLabels: Record<string, string> = {
  blue: "Azul", purple: "Morado", green: "Verde", orange: "Naranja",
  pink: "Rosa", teal: "Turquesa", red: "Rojo",
};
const fieldTypeLabels: Record<string, string> = {
  text: "Texto", email: "Email", tel: "Teléfono", number: "Número",
  textarea: "Texto largo", select: "Selección", checkbox: "Casilla", signature: "Firma",
};

function formatDate(d: string | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(d: string | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("es-CL", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Types ─── */

type Vista = "lista" | "formulario" | "inscripciones" | "asistencia";

interface EventForm {
  title: string; slug: string; type: string; description: string;
  startDate: string; endDate: string; location: string; isOnline: boolean;
  capacity: number; registrationUrl: string; price: string; status: string;
  featured: boolean; calendarColor: string; enableDirectRegistration: boolean;
  requireSignature: boolean; registrationFields: RegistrationFieldDef[];
}

const emptyForm: EventForm = {
  title: "", slug: "", type: "workshop", description: "",
  startDate: "", endDate: "", location: "", isOnline: false,
  capacity: 0, registrationUrl: "", price: "", status: "draft",
  featured: false, calendarColor: "blue", enableDirectRegistration: true,
  requireSignature: false, registrationFields: [],
};

/* ═══════════════ COMPONENT ═══════════════ */

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
  const [form, setForm] = useState<EventForm>({ ...emptyForm });
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  // Inscripciones / Asistencia state
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [regSearch, setRegSearch] = useState("");
  const [viewingSignature, setViewingSignature] = useState<{ name: string; data: string } | null>(null);

  /* ─── Data loading ─── */

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const result = await getAllEvents();
    setEvents(result.events);
    setTotal(result.total);
    // Load registration counts
    const counts: Record<string, number> = {};
    await Promise.all(result.events.map(async (ev) => {
      counts[ev.id] = await getRegistrationCount(ev.id);
    }));
    setRegCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Event form handlers ─── */

  const handleNuevo = () => {
    setEditando(null);
    setForm({ ...emptyForm });
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
      calendarColor: event.calendarColor || "blue",
      enableDirectRegistration: event.enableDirectRegistration ?? true,
      requireSignature: event.requireSignature || false,
      registrationFields: event.registrationFields || [],
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

  /* ─── Registration Fields Builder ─── */

  const addRegField = () => {
    setForm(f => ({
      ...f,
      registrationFields: [...f.registrationFields, { fieldName: "", fieldType: "text", required: false, options: "" }],
    }));
  };
  const updateRegField = (idx: number, updates: Partial<RegistrationFieldDef>) => {
    setForm(f => ({
      ...f,
      registrationFields: f.registrationFields.map((field, i) => i === idx ? { ...field, ...updates } : field),
    }));
  };
  const removeRegField = (idx: number) => {
    setForm(f => ({ ...f, registrationFields: f.registrationFields.filter((_, i) => i !== idx) }));
  };

  /* ─── Inscripciones ─── */

  const openInscripciones = async (event: EventItem) => {
    setSelectedEvent(event);
    setVista("inscripciones");
    setLoadingDetail(true);
    setRegSearch("");
    const result = await getEventRegistrations(event.id);
    setRegistrations(result.registrations);
    setRegTotal(result.total);
    setLoadingDetail(false);
  };

  const handleUpdateRegStatus = async (regId: string, status: string) => {
    const res = await updateRegistration(regId, { status } as any);
    if (res.success && selectedEvent) {
      const result = await getEventRegistrations(selectedEvent.id);
      setRegistrations(result.registrations);
      setRegTotal(result.total);
    }
  };

  const handleDeleteRegistration = async (regId: string) => {
    const res = await deleteRegistration(regId);
    if (res.success && selectedEvent) {
      const result = await getEventRegistrations(selectedEvent.id);
      setRegistrations(result.registrations);
      setRegTotal(result.total);
    }
  };

  const filteredRegistrations = registrations.filter(r =>
    r.fullName.toLowerCase().includes(regSearch.toLowerCase()) ||
    r.email.toLowerCase().includes(regSearch.toLowerCase()) ||
    (r.lastName || "").toLowerCase().includes(regSearch.toLowerCase())
  );

  /* ─── Asistencia ─── */

  const openAsistencia = async (event: EventItem) => {
    setSelectedEvent(event);
    setVista("asistencia");
    setLoadingDetail(true);
    const records = await getEventAttendance(event.id);
    setAttendance(records);
    setLoadingDetail(false);
  };

  const handleInitAttendance = async () => {
    if (!selectedEvent) return;
    setLoadingDetail(true);
    await initializeAttendance(selectedEvent.id);
    const records = await getEventAttendance(selectedEvent.id);
    setAttendance(records);
    setLoadingDetail(false);
  };

  const handleToggleAttendance = async (attendanceId: string, attended: boolean) => {
    await toggleAttendance(attendanceId, attended);
    if (selectedEvent) {
      const records = await getEventAttendance(selectedEvent.id);
      setAttendance(records);
    }
  };

  /* ─── Export ─── */

  const handleExport = async (event: EventItem) => {
    const { csv, filename } = await exportEventData(event.id);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ═══════════════ VISTA: FORMULARIO ═══════════════ */

  if (vista === "formulario") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setVista("lista")}><ChevronLeft className="h-4 w-4 mr-1" />Volver</Button>
          <h1 className="text-xl font-semibold">{editando ? "Editar Evento" : "Nuevo Evento"}</h1>
        </div>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-2 pt-4 text-destructive">
              <AlertCircle className="h-5 w-5" /><span>{error}</span>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
            <TabsTrigger value="formulario-campos">Formulario Inscripción</TabsTrigger>
          </TabsList>

          {/* ── Tab General ── */}
          <TabsContent value="general">
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
                  <label className="text-sm font-medium">URL de Inscripción Externa</label>
                  <Input value={form.registrationUrl} onChange={e => setForm(f => ({ ...f, registrationUrl: e.target.value }))} placeholder="https://forms.google.com/... (opcional, si no usa inscripción interna)" />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab Calendario ── */}
          <TabsContent value="calendario">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Color en Calendario</label>
                    <div className="flex items-center gap-2 mt-1">
                      <select className="flex-1 border rounded-md p-2 text-sm" value={form.calendarColor} onChange={e => setForm(f => ({ ...f, calendarColor: e.target.value }))}>
                        {Object.entries(calendarColorLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <div className={`w-8 h-8 rounded-md ${
                        form.calendarColor === "blue" ? "bg-blue-500" :
                        form.calendarColor === "purple" ? "bg-purple-500" :
                        form.calendarColor === "green" ? "bg-green-500" :
                        form.calendarColor === "orange" ? "bg-orange-500" :
                        form.calendarColor === "pink" ? "bg-pink-500" :
                        form.calendarColor === "teal" ? "bg-teal-500" :
                        form.calendarColor === "red" ? "bg-red-500" : "bg-blue-500"
                      }`} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.enableDirectRegistration} onChange={e => setForm(f => ({ ...f, enableDirectRegistration: e.target.checked }))} className="rounded" />
                    <span><strong>Inscripción directa</strong> — Los usuarios pueden inscribirse desde el calendario público</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.requireSignature} onChange={e => setForm(f => ({ ...f, requireSignature: e.target.checked }))} className="rounded" />
                    <span><strong>Requiere firma</strong> — Solicitar firma digital al inscribirse</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab Formulario de Inscripción ── */}
          <TabsContent value="formulario-campos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Campos Personalizados</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Los campos Nombre, Apellidos, Email, Teléfono, Institución y RUT se incluyen automáticamente.
                      Agrega campos adicionales aquí.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addRegField}>
                    <Plus className="h-4 w-4 mr-1" />Campo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.registrationFields.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No hay campos personalizados. Haz clic en &quot;+ Campo&quot; para agregar.
                  </p>
                )}
                {form.registrationFields.map((field, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-md bg-muted/30">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Nombre del campo</label>
                        <Input
                          value={field.fieldName}
                          onChange={e => updateRegField(idx, { fieldName: e.target.value })}
                          placeholder="Ej: Carrera"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tipo</label>
                        <select
                          className="w-full border rounded-md p-1.5 text-sm"
                          value={field.fieldType}
                          onChange={e => updateRegField(idx, { fieldType: e.target.value as any })}
                        >
                          {Object.entries(fieldTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end gap-3">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={e => updateRegField(idx, { required: e.target.checked })}
                            className="rounded"
                          />
                          Obligatorio
                        </label>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive mt-4" onClick={() => removeRegField(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.registrationFields.some(f => f.fieldType === "select") && (
                  <div className="mt-3 space-y-2">
                    {form.registrationFields.map((field, idx) =>
                      field.fieldType === "select" ? (
                        <div key={idx} className="pl-3 border-l-2 border-blue-300">
                          <label className="text-xs text-muted-foreground">Opciones para &quot;{field.fieldName || `Campo ${idx + 1}`}&quot; (una por línea)</label>
                          <textarea
                            className="w-full border rounded-md p-2 text-sm min-h-[60px]"
                            value={field.options || ""}
                            onChange={e => updateRegField(idx, { options: e.target.value })}
                            placeholder={"Opción 1\nOpción 2\nOpción 3"}
                          />
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setVista("lista")}>Cancelar</Button>
          <Button onClick={handleGuardar} disabled={saving || !form.title || !form.description || !form.startDate}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : "Guardar Evento"}
          </Button>
        </div>
      </div>
    );
  }

  /* ═══════════════ VISTA: INSCRIPCIONES ═══════════════ */

  if (vista === "inscripciones" && selectedEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => { setVista("lista"); setSelectedEvent(null); }}>
              <ChevronLeft className="h-4 w-4 mr-1" />Volver
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Inscripciones: {selectedEvent.title}</h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedEvent.startDate)} · Capacidad: {selectedEvent.capacity || "Ilimitada"} · Inscritos: {regTotal}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => handleExport(selectedEvent)}>
            <Download className="h-4 w-4 mr-2" />Exportar Excel
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{regTotal}</div>
              <p className="text-sm text-muted-foreground">Total inscritos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{registrations.filter(r => r.status === "confirmed").length}</div>
              <p className="text-sm text-muted-foreground">Confirmados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{registrations.filter(r => r.status === "cancelled").length}</div>
              <p className="text-sm text-muted-foreground">Cancelados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o email..." value={regSearch} onChange={e => setRegSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay inscripciones aún</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Institución</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map(reg => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.fullName} {reg.lastName}</TableCell>
                        <TableCell className="text-sm">{reg.email}</TableCell>
                        <TableCell className="text-sm">{reg.phone || "-"}</TableCell>
                        <TableCell className="text-sm">{reg.institution || "-"}</TableCell>
                        <TableCell className="text-sm">{reg.rut || "-"}</TableCell>
                        <TableCell>
                          {reg.signature ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 gap-1"
                              onClick={() => setViewingSignature({ name: `${reg.fullName} ${reg.lastName || ''}`.trim(), data: reg.signature! })}
                            >
                              <PenLine className="h-4 w-4" />
                              <span className="text-xs">Ver</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={reg.status}
                            onChange={e => handleUpdateRegStatus(reg.id, e.target.value)}
                          >
                            {Object.entries(regStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(reg.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteRegistration(reg.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Firma */}
        {viewingSignature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewingSignature(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Firma de {viewingSignature.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewingSignature(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewingSignature.data} alt={`Firma de ${viewingSignature.name}`} className="max-w-full max-h-64" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════ VISTA: ASISTENCIA ═══════════════ */

  if (vista === "asistencia" && selectedEvent) {
    const attendedCount = attendance.filter(a => a.attended).length;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => { setVista("lista"); setSelectedEvent(null); }}>
              <ChevronLeft className="h-4 w-4 mr-1" />Volver
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Asistencia: {selectedEvent.title}</h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedEvent.startDate)} · {attendedCount}/{attendance.length} presentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleInitAttendance} disabled={loadingDetail}>
              <UserCheck className="h-4 w-4 mr-2" />Inicializar Lista
            </Button>
            <Button variant="outline" onClick={() => handleExport(selectedEvent)}>
              <Download className="h-4 w-4 mr-2" />Exportar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{attendance.length}</div>
              <p className="text-sm text-muted-foreground">Total en lista</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{attendedCount}</div>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{attendance.length - attendedCount}</div>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No hay registros de asistencia</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Haz clic en &quot;Inicializar Lista&quot; para crear registros de asistencia a partir de las inscripciones confirmadas.
                </p>
                <Button variant="outline" onClick={handleInitAttendance}>
                  <UserCheck className="h-4 w-4 mr-2" />Inicializar Lista
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Presente</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map(record => {
                    const reg = typeof record.registration === "object" ? record.registration : null;
                    return (
                      <TableRow key={record.id} className={record.attended ? "bg-green-50 dark:bg-green-900/10" : ""}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={record.attended}
                            onChange={e => handleToggleAttendance(record.id, e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {reg ? `${reg.fullName} ${reg.lastName || ""}`.trim() : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{reg?.email || "—"}</TableCell>
                        <TableCell className="text-sm">{reg?.institution || "—"}</TableCell>
                        <TableCell>
                          {reg?.signature ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 gap-1"
                              onClick={() => setViewingSignature({ name: reg ? `${reg.fullName} ${reg.lastName || ''}`.trim() : '—', data: reg.signature! })}
                            >
                              <PenLine className="h-4 w-4" />
                              <span className="text-xs">Ver</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{record.checkInTime ? formatDateTime(record.checkInTime) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal Firma */}
        {viewingSignature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewingSignature(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Firma de {viewingSignature.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewingSignature(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewingSignature.data} alt={`Firma de ${viewingSignature.name}`} className="max-w-full max-h-64" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════ VISTA: LISTA PRINCIPAL ═══════════════ */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario Inteligente</h1>
          <p className="text-muted-foreground">Gestiona eventos, inscripciones y asistencia</p>
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
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{Object.values(regCounts).reduce((a, b) => a + b, 0)}</div><p className="text-sm text-muted-foreground">Total inscripciones</p></CardContent></Card>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Inscritos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className={`w-3 h-3 rounded-full ${
                          event.calendarColor === "blue" ? "bg-blue-500" :
                          event.calendarColor === "purple" ? "bg-purple-500" :
                          event.calendarColor === "green" ? "bg-green-500" :
                          event.calendarColor === "orange" ? "bg-orange-500" :
                          event.calendarColor === "pink" ? "bg-pink-500" :
                          event.calendarColor === "teal" ? "bg-teal-500" :
                          event.calendarColor === "red" ? "bg-red-500" : "bg-blue-500"
                        }`} />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {event.featured && <span className="text-yellow-500">★</span>}
                          {event.title}
                          {event.enableDirectRegistration && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Inscripción</Badge>
                          )}
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{regCounts[event.id] || 0}</span>
                          {event.capacity ? <span className="text-xs text-muted-foreground">/{event.capacity}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={statusColors[event.status]}>{statusLabels[event.status]}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openInscripciones(event)} title="Ver inscripciones">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openAsistencia(event)} title="Control de asistencia">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleExport(event)} title="Exportar a Excel">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(event)} title={event.status === "published" ? "Ocultar" : "Publicar"}>
                            {event.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditar(event)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAEliminar(event)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!aEliminar} onOpenChange={() => setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{aEliminar?.title}&quot; permanentemente. También se eliminarán todas las inscripciones y registros de asistencia asociados.
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
