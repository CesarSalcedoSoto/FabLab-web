"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Badge } from "@/shared/ui/badges/badge";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Zap,
  Cpu,
  Wrench,
  ScanLine,
  Hammer,
  Cog,
  CalendarDays,
  Clock,
  Users,
  Video,
  X,
  Plus,
  Loader2,
  DoorOpen,
  FileText,
  CalendarPlus,
  MapPin,
  User,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import {
  getCalendarEvents,
  getViewerCalendarEvents,
  getEquipmentUsageDetail,
  getProjectsForMeeting,
  createMeeting,
  type CalendarEvent,
  type EquipmentDetail,
} from "./actions";
import { useAuth } from "@/features/auth";

// ============================================================
// ICON MAP FOR EQUIPMENT
// ============================================================

const equipmentIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "3d-printer": Printer,
  "laser-cutter": Zap,
  cnc: Cog,
  electronics: Cpu,
  "hand-tools": Hammer,
  "3d-scanner": ScanLine,
  other: Wrench,
};

function getEquipmentIcon(category?: string) {
  return equipmentIconMap[category || "other"] || Wrench;
}

const eventTypeColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  equipment: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200" },
  room: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-200" },
  meeting: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" },
  event: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
};

const eventTypeLabels: Record<string, string> = {
  equipment: "Uso de Equipo",
  room: "Reserva de Sala",
  meeting: "Reunión",
  event: "Evento",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "En uso", color: "bg-green-100 text-green-700" },
  completed: { label: "Completado", color: "bg-gray-100 text-gray-600" },
  confirmed: { label: "Confirmada", color: "bg-teal-100 text-teal-700" },
  programada: { label: "Programada", color: "bg-blue-100 text-blue-700" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  realizada: { label: "Realizada", color: "bg-green-100 text-green-700" },
  published: { label: "Publicado", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ============================================================
// HELPERS
// ============================================================

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
}

function formatTime(t?: string) {
  if (!t) return "";
  return t.slice(0, 5);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CalendarioPage() {
  const { user } = useAuth();
  const userRole = user?.role;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleCode = typeof userRole === 'string' ? userRole : userRole?.code || (user as any)?.payloadRole;
  const isAdmin = roleCode === 'super_admin' || roleCode === 'admin' || roleCode === 'editor';

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [equipmentDetail, setEquipmentDetail] = useState<EquipmentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  // Meeting form
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [meetingForm, setMeetingForm] = useState({ projectId: "", date: "", time: "", description: "" });
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const data = isAdmin
      ? await getCalendarEvents(currentMonth, currentYear)
      : await getViewerCalendarEvents(currentMonth, currentYear);
    setEvents(data);
    setLoading(false);
  }, [currentMonth, currentYear, isAdmin]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Filter events
  const filteredEvents = filter ? events.filter(e => e.type === filter) : events;

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const evt of filteredEvents) {
    if (!eventsByDate[evt.date]) eventsByDate[evt.date] = [];
    eventsByDate[evt.date].push(evt);
  }

  // Selected date events
  const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Handle event click
  const handleEventClick = async (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setEquipmentDetail(null);
    if (evt.type === "equipment") {
      setLoadingDetail(true);
      const detail = await getEquipmentUsageDetail(evt.id);
      setEquipmentDetail(detail);
      setLoadingDetail(false);
    }
  };

  // Meeting creation
  const openMeetingForm = async () => {
    const projs = await getProjectsForMeeting();
    setProjects(projs);
    setMeetingForm({
      projectId: projs[0]?.id || "",
      date: selectedDate || todayStr,
      time: "10:00",
      description: "",
    });
    setMeetingError(null);
    setShowMeetingForm(true);
  };

  const handleCreateMeeting = async () => {
    if (!meetingForm.projectId || !meetingForm.date || !meetingForm.time || !meetingForm.description) {
      setMeetingError("Todos los campos son obligatorios");
      return;
    }
    setSavingMeeting(true);
    setMeetingError(null);
    const res = await createMeeting(meetingForm);
    setSavingMeeting(false);
    if (res.success) {
      setShowMeetingForm(false);
      loadEvents();
    } else {
      setMeetingError(res.error || "Error al crear reunión");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            Calendario
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Reservas, reuniones, uso de equipos y eventos" : "Tus reuniones, reservas de equipos y salas"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openMeetingForm} size="sm">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Agendar Reunión
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={!filter ? "default" : "outline"} size="sm" onClick={() => setFilter(null)}>Todos</Button>
        {(["equipment", "room", "meeting", "event"]).map((type: string) => {
          const c = eventTypeColors[type];
          return (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filter === type ? null : type)}
              className="gap-1.5"
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              {eventTypeLabels[type]}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <CardTitle className="text-lg font-semibold">
                  {MONTHS[currentMonth]} {currentYear}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {/* Weekday headers */}
                {WEEKDAYS.map(d => (
                  <div key={d} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">{d}</div>
                ))}
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px] sm:min-h-[100px]" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                      className={`bg-white p-1.5 sm:p-2 min-h-[80px] sm:min-h-[100px] cursor-pointer transition-colors hover:bg-blue-50 relative ${
                        isSelected ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
                      }`}
                    >
                      <span className={`text-xs sm:text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday ? "bg-blue-600 text-white" : "text-gray-700"
                      }`}>
                        {day}
                      </span>
                      {/* Event dots / icons */}
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map(evt => {
                          const c = eventTypeColors[evt.type];
                          if (evt.type === "equipment") {
                            const EqIcon = getEquipmentIcon(evt.icon);
                            return (
                              <button
                                key={evt.id}
                                onClick={(e) => { e.stopPropagation(); handleEventClick(evt); }}
                                className={`w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] sm:text-xs truncate ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}
                                title={evt.title}
                              >
                                <EqIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate hidden sm:inline">{evt.title}</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              key={evt.id}
                              onClick={(e) => { e.stopPropagation(); handleEventClick(evt); }}
                              className={`w-full flex items-center gap-1 px-1 py-0.5 rounded text-[10px] sm:text-xs truncate ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}
                              title={evt.title}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
                              <span className="truncate hidden sm:inline">{evt.title}</span>
                            </button>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-gray-400 px-1">+{dayEvents.length - 3} más</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel: Selected date events or detail */}
        <div className="space-y-4">
          {/* Selected date events list */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {selectedDate ? formatDate(selectedDate) : "Selecciona un día"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Haz clic en un día del calendario para ver sus eventos
                </p>
              ) : selectedDateEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin eventos este día</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {selectedDateEvents.map(evt => {
                    const c = eventTypeColors[evt.type];
                    const st = evt.status ? statusLabels[evt.status] : null;
                    return (
                      <button
                        key={evt.id}
                        onClick={() => handleEventClick(evt)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors hover:shadow-sm ${c.bg} ${c.border}`}
                      >
                        <div className="flex items-start gap-2">
                          {evt.type === "equipment" ? (
                            (() => { const EqIcon = getEquipmentIcon(evt.icon); return <EqIcon className={`h-4 w-4 mt-0.5 ${c.text}`} />; })()
                          ) : evt.type === "room" ? (
                            <DoorOpen className={`h-4 w-4 mt-0.5 ${c.text}`} />
                          ) : evt.type === "meeting" ? (
                            <Video className={`h-4 w-4 mt-0.5 ${c.text}`} />
                          ) : (
                            <CalendarDays className={`h-4 w-4 mt-0.5 ${c.text}`} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${c.text} truncate`}>{evt.title}</p>
                            {evt.subtitle && <p className="text-xs text-gray-500 truncate">{evt.subtitle}</p>}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {evt.startTime && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatTime(evt.startTime)}{evt.endTime ? ` - ${formatTime(evt.endTime)}` : ""}
                                </span>
                              )}
                              {st && <Badge className={`text-[10px] px-1.5 py-0 ${st.color}`}>{st.label}</Badge>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Detail Panel */}
          {selectedEvent && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Detalle</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedEvent(null); setEquipmentDetail(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Equipment detail */}
                {selectedEvent.type === "equipment" && (
                  loadingDetail ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : equipmentDetail ? (
                    <div className="space-y-3">
                      {/* Equipment icon + name */}
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 rounded-lg">
                          {(() => { const EqIcon = getEquipmentIcon(equipmentDetail.equipmentCategory); return <EqIcon className="h-6 w-6 text-purple-600" />; })()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{equipmentDetail.equipmentName}</p>
                          <Badge className="text-[10px] bg-purple-100 text-purple-700">
                            {equipmentDetail.equipmentCategory?.replace("-", " ") || "Equipo"}
                          </Badge>
                        </div>
                      </div>
                      {/* User */}
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {equipmentDetail.userAvatar ? (
                          <Image src={equipmentDetail.userAvatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{equipmentDetail.userName}</p>
                          <p className="text-[10px] text-gray-500">Persona a cargo</p>
                        </div>
                      </div>
                      {/* Schedule */}
                      <div className="p-2 bg-gray-50 rounded-lg space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {new Date(equipmentDetail.startTime).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>
                        {equipmentDetail.endTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>
                              Hasta: {new Date(equipmentDetail.endTime).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Duración estimada: {equipmentDetail.estimatedDuration}</span>
                        </div>
                      </div>
                      {/* Reason */}
                      {equipmentDetail.description && (
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-[10px] uppercase font-medium text-gray-400 mb-1">Motivo de uso</p>
                          <p className="text-sm text-gray-700">{equipmentDetail.description}</p>
                        </div>
                      )}
                      {/* Status */}
                      {equipmentDetail.status && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Estado:</span>
                          <Badge className={statusLabels[equipmentDetail.status]?.color || "bg-gray-100"}>
                            {statusLabels[equipmentDetail.status]?.label || equipmentDetail.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se pudo cargar el detalle</p>
                  )
                )}

                {/* Room reservation detail */}
                {selectedEvent.type === "room" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-teal-100 rounded-lg">
                        <DoorOpen className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{selectedEvent.title}</p>
                        <Badge className="text-[10px] bg-teal-100 text-teal-700">Reserva de Sala</Badge>
                      </div>
                    </div>
                    {selectedEvent.userName && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-teal-500" />
                        <p className="text-sm">{selectedEvent.userName}</p>
                      </div>
                    )}
                    <div className="p-2 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</span>
                      </div>
                    </div>
                    {selectedEvent.description && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] uppercase font-medium text-gray-400 mb-1">Propósito</p>
                        <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                      </div>
                    )}
                    {Boolean(selectedEvent.metadata?.companions) && (selectedEvent.metadata!.companions as Array<{name: string}>).length > 0 && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] uppercase font-medium text-gray-400 mb-1">Acompañantes</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedEvent.metadata!.companions as Array<{name: string}>).map((c, i) => (
                            <Badge key={i} className="text-[10px] bg-teal-50 text-teal-700">{c.name}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Meeting detail */}
                {selectedEvent.type === "meeting" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 rounded-lg">
                        <Video className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{selectedEvent.title}</p>
                        {selectedEvent.status && (
                          <Badge className={`text-[10px] ${statusLabels[selectedEvent.status]?.color || "bg-gray-100"}`}>
                            {statusLabels[selectedEvent.status]?.label || selectedEvent.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedEvent.startTime && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatTime(selectedEvent.startTime)}</span>
                      </div>
                    )}
                    {selectedEvent.description && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] uppercase font-medium text-gray-400 mb-1">Descripción</p>
                        <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                      </div>
                    )}
                    {Boolean(selectedEvent.metadata?.notes) && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-[10px] uppercase font-medium text-gray-400 mb-1">Notas</p>
                        <p className="text-sm text-gray-700">{String(selectedEvent.metadata!.notes)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Event detail */}
                {selectedEvent.type === "event" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-100 rounded-lg">
                        <CalendarDays className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{selectedEvent.title}</p>
                        {selectedEvent.subtitle && (
                          <Badge className="text-[10px] bg-orange-100 text-orange-700">{selectedEvent.subtitle}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg space-y-1">
                      {selectedEvent.startTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatTime(selectedEvent.startTime)}{selectedEvent.endTime ? ` - ${formatTime(selectedEvent.endTime)}` : ""}</span>
                        </div>
                      )}
                      {Boolean(selectedEvent.metadata?.location) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span>{String(selectedEvent.metadata!.location)}</span>
                        </div>
                      )}
                      {Boolean(selectedEvent.metadata?.isOnline) && (
                        <Badge className="text-[10px] bg-indigo-100 text-indigo-700">Online</Badge>
                      )}
                    </div>
                    {selectedEvent.description && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                      </div>
                    )}
                    {Boolean(selectedEvent.metadata?.capacity) && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        <span>Capacidad: {Number(selectedEvent.metadata!.capacity)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] uppercase font-medium text-gray-400 mb-2">Leyenda</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(eventTypeColors).map(([type, c]) => (
                  <div key={type} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                    <span className="text-gray-600">{eventTypeLabels[type]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Meeting Creation Modal */}
      {showMeetingForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowMeetingForm(false)}>
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-blue-600" />
                Agendar Reunión
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowMeetingForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetingError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  {meetingError}
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Proyecto *</label>
                <select
                  className="w-full border rounded-md p-2 text-sm mt-1"
                  value={meetingForm.projectId}
                  onChange={e => setMeetingForm(f => ({ ...f, projectId: e.target.value }))}
                >
                  {projects.length === 0 && <option value="">Sin proyectos disponibles</option>}
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Fecha *</label>
                  <Input
                    type="date"
                    value={meetingForm.date}
                    onChange={e => setMeetingForm(f => ({ ...f, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora *</label>
                  <Input
                    type="time"
                    value={meetingForm.time}
                    onChange={e => setMeetingForm(f => ({ ...f, time: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Descripción *</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm mt-1 min-h-[80px]"
                  placeholder="Tema de la reunión..."
                  value={meetingForm.description}
                  onChange={e => setMeetingForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setShowMeetingForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreateMeeting} disabled={savingMeeting}>
                  {savingMeeting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Guardando...</> : "Agendar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
