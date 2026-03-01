"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, Users, Tag, Search, Video, Loader2,
  ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ============================================================================
// TYPES
// ============================================================================

interface RegistrationFieldDef {
  fieldName: string;
  fieldType: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'signature';
  required?: boolean;
  options?: string;
  id?: string;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  featuredImage?: { url?: string; alt?: string } | null;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  capacity?: number;
  registrationUrl?: string;
  price?: string;
  status: string;
  featured?: boolean;
  tags?: { tag: string }[];
  calendarColor?: string;
  enableDirectRegistration?: boolean;
  requireSignature?: boolean;
  registrationFields?: RegistrationFieldDef[];
  registrationCount?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const typeLabels: Record<string, string> = {
  workshop: "Taller",
  course: "Curso",
  talk: "Charla",
  hackathon: "Hackathon",
  "open-day": "Open Day",
  meetup: "Meetup",
};

const calendarColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-800",   dot: "bg-blue-500",   border: "border-blue-300" },
  purple: { bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-500", border: "border-purple-300" },
  green:  { bg: "bg-green-50",  text: "text-green-800",  dot: "bg-green-500",  border: "border-green-300" },
  orange: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500", border: "border-orange-300" },
  pink:   { bg: "bg-pink-50",   text: "text-pink-800",   dot: "bg-pink-500",   border: "border-pink-300" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-800",   dot: "bg-teal-500",   border: "border-teal-300" },
  red:    { bg: "bg-red-50",    text: "text-red-800",    dot: "bg-red-500",    border: "border-red-300" },
};

const defaultColorMap: Record<string, string> = {
  workshop: "blue",
  course: "purple",
  talk: "green",
  hackathon: "orange",
  "open-day": "pink",
  meetup: "teal",
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEventColor(event: EventItem) {
  const colorKey = event.calendarColor || defaultColorMap[event.type] || "blue";
  return calendarColors[colorKey] || calendarColors.blue;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isUpcoming(d: string) {
  return new Date(d) >= new Date();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday-based
}

function spotsText(event: EventItem) {
  if (!event.capacity || event.capacity === 0) return null;
  const enrolled = event.registrationCount || 0;
  const remaining = event.capacity - enrolled;
  if (remaining <= 0) return "Sin cupos";
  return `${remaining} cupo${remaining !== 1 ? 's' : ''} disponible${remaining !== 1 ? 's' : ''}`;
}

// ============================================================================
// SIGNATURE PAD COMPONENT
// ============================================================================

function SignaturePad({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="border rounded-lg bg-white w-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button type="button" onClick={clear} className="text-xs text-gray-500 mt-1 hover:text-red-500">
        Limpiar firma
      </button>
    </div>
  );
}

// ============================================================================
// REGISTRATION MODAL
// ============================================================================

function RegistrationModal({ event, onClose, onSuccess }: { event: EventItem; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<Record<string, any>>({
    fullName: '', lastName: '', email: '', phone: '', institution: '', rut: '',
  });
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Build custom fields
      const customFields: Record<string, any> = {};
      (event.registrationFields || []).forEach(field => {
        if (field.fieldType !== 'signature') {
          customFields[field.fieldName] = form[`custom_${field.fieldName}`] || '';
        }
      });

      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          fullName: form.fullName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          institution: form.institution,
          rut: form.rut,
          customFields,
          signature: event.requireSignature ? signature : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Error al inscribirse');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const spots = spotsText(event);
  const isFull = spots === "Sin cupos";

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
          onClick={e => e.stopPropagation()}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">¡Inscripción exitosa!</h3>
          <p className="text-gray-600">Te has inscrito en <strong>{event.title}</strong>. Recibirás información por correo.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h3 className="text-lg font-bold">Inscribirse</h3>
            <p className="text-sm text-gray-500">{event.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFull && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> Este evento está lleno. No es posible inscribirse.
            </div>
          )}

          {spots && !isFull && (
            <div className="bg-orange-50 text-orange-700 p-3 rounded-lg flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" /> {spots}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Required fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" required className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellidos</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Correo Electrónico *</label>
            <input type="email" required className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input type="tel" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RUT</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="12.345.678-9"
                value={form.rut} onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Institución / Empresa</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
          </div>

          {/* Dynamic custom fields from event */}
          {(event.registrationFields || []).map((field) => (
            <div key={field.fieldName}>
              <label className="block text-sm font-medium mb-1">
                {field.fieldName} {field.required && '*'}
              </label>
              {field.fieldType === 'textarea' ? (
                <textarea
                  required={field.required}
                  className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                  value={form[`custom_${field.fieldName}`] || ''}
                  onChange={e => setForm(f => ({ ...f, [`custom_${field.fieldName}`]: e.target.value }))}
                />
              ) : field.fieldType === 'select' ? (
                <select
                  required={field.required}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form[`custom_${field.fieldName}`] || ''}
                  onChange={e => setForm(f => ({ ...f, [`custom_${field.fieldName}`]: e.target.value }))}
                >
                  <option value="">Seleccionar...</option>
                  {(field.options || '').split('\n').filter(Boolean).map(opt => (
                    <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                  ))}
                </select>
              ) : field.fieldType === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form[`custom_${field.fieldName}`]}
                    onChange={e => setForm(f => ({ ...f, [`custom_${field.fieldName}`]: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-600">Sí</span>
                </label>
              ) : field.fieldType === 'signature' ? (
                <SignaturePad onSave={(data) => setForm(f => ({ ...f, [`custom_${field.fieldName}`]: data }))} />
              ) : (
                <input
                  type={field.fieldType}
                  required={field.required}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form[`custom_${field.fieldName}`] || ''}
                  onChange={e => setForm(f => ({ ...f, [`custom_${field.fieldName}`]: e.target.value }))}
                />
              )}
            </div>
          ))}

          {/* Signature pad for event-level signature requirement */}
          {event.requireSignature && (
            <div>
              <label className="block text-sm font-medium mb-1">Firma *</label>
              <SignaturePad onSave={setSignature} />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || isFull}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscribiendo...</> : "Inscribirse"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================================================
// EVENT DETAIL PANEL
// ============================================================================

function EventDetailPanel({ event, onClose, onRegister }: { event: EventItem; onClose: () => void; onRegister: () => void }) {
  const color = getEventColor(event);
  const spots = spotsText(event);
  const upcoming = isUpcoming(event.startDate);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {event.featuredImage?.url && (
          <div className="relative h-48 rounded-t-2xl overflow-hidden">
            <Image src={event.featuredImage.url} alt={event.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}>
              {typeLabels[event.type] || event.type}
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            {!event.featuredImage?.url && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}>
                {typeLabels[event.type] || event.type}
              </span>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full ml-auto"><X className="w-5 h-5" /></button>
          </div>

          <h2 className="text-2xl font-bold mb-3">{event.title}</h2>
          <p className="text-gray-600 mb-6">{event.description}</p>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatTime(event.startDate)}{event.endDate ? ` - ${formatTime(event.endDate)}` : ""}</span>
            </div>
            {(event.location || event.isOnline) && (
              <div className="flex items-center gap-3">
                {event.isOnline ? <Video className="w-4 h-4 text-gray-400" /> : <MapPin className="w-4 h-4 text-gray-400" />}
                <span>{event.isOnline ? "Online" : event.location}</span>
              </div>
            )}
            {event.capacity && event.capacity > 0 && (
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{event.registrationCount || 0} / {event.capacity} inscritos</span>
                {spots && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${spots === "Sin cupos" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {spots}
                  </span>
                )}
              </div>
            )}
            {event.price && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-gray-400" />
                <span>{event.price}</span>
              </div>
            )}
          </div>

          {upcoming && (
            <div className="flex gap-3">
              {event.enableDirectRegistration ? (
                <button
                  onClick={onRegister}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  Inscribirse
                </button>
              ) : event.registrationUrl ? (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  Inscribirse (externo)
                </a>
              ) : null}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// CALENDAR GRID
// ============================================================================

function CalendarGrid({ events, onSelectEvent }: { events: EventItem[]; onSelectEvent: (e: EventItem) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const eventsByDay = useMemo(() => {
    const map = new Map<number, EventItem[]>();
    events.forEach(event => {
      const d = new Date(event.startDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(event);
      }
    });
    return map;
  }, [events, year, month]);

  const today = new Date();
  const isToday = (day: number) => isSameDay(new Date(year, month, day), today);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">{MONTHS[month]} {year}</h3>
          <button onClick={goToday} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">Hoy</button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const dayEvents = day ? (eventsByDay.get(day) || []) : [];
          return (
            <div
              key={idx}
              className={`min-h-[80px] md:min-h-[100px] border-b border-r p-1 ${day ? 'bg-white' : 'bg-gray-50'} ${idx % 7 === 0 ? 'border-l' : ''}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${
                    isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}>
                    {day}
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map(ev => {
                      const color = getEventColor(ev);
                      return (
                        <button
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className={`w-full text-left text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate ${color.bg} ${color.text} hover:opacity-80 transition-opacity`}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${color.dot} mr-1`} />
                          {ev.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3} más</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Color legend */}
      <div className="p-3 border-t flex flex-wrap gap-3 text-xs">
        {Object.entries(typeLabels).map(([key, label]) => {
          const colorKey = defaultColorMap[key] || 'blue';
          const color = calendarColors[colorKey];
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
              <span className="text-gray-600">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// UPCOMING EVENTS LIST
// ============================================================================

function UpcomingEventsList({ events, onSelect }: { events: EventItem[]; onSelect: (e: EventItem) => void }) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" /> Próximos Eventos
      </h2>
      <div className="space-y-3">
        {events.slice(0, 6).map(event => {
          const color = getEventColor(event);
          const spots = spotsText(event);
          return (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${color.border} border-l-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color.bg} ${color.text}`}>
                      {typeLabels[event.type] || event.type}
                    </span>
                    {event.featured && <span className="text-yellow-500 text-xs">★ Destacado</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(event.startDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(event.startDate)}</span>
                  </div>
                </div>
                {spots && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                    spots === "Sin cupos" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {spots}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function EventsPageClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events/calendar");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error cargando eventos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || e.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [events, search, typeFilter]);

  const upcomingEvents = useMemo(() =>
    filteredEvents.filter(e => isUpcoming(e.startDate)).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [filteredEvents]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Calendario de Eventos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8"
          >
            Descubre talleres, cursos y actividades. Inscríbete directamente.
          </motion.p>

          {/* Search & filter in hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Buscar eventos..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50"
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-3 rounded-xl text-gray-900 bg-white/95 focus:outline-none text-sm"
                value={typeFilter || ""}
                onChange={e => setTypeFilter(e.target.value || null)}
              >
                <option value="">Todos los tipos</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar - 2 cols */}
            <div className="lg:col-span-2">
              <CalendarGrid events={filteredEvents} onSelectEvent={setSelectedEvent} />
            </div>

            {/* Sidebar - upcoming */}
            <div>
              <UpcomingEventsList events={upcomingEvents} onSelect={setSelectedEvent} />

              {upcomingEvents.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay eventos próximos</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selectedEvent && !showRegistration && (
          <EventDetailPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRegister={() => setShowRegistration(true)}
          />
        )}
        {selectedEvent && showRegistration && (
          <RegistrationModal
            event={selectedEvent}
            onClose={() => { setShowRegistration(false); setSelectedEvent(null); }}
            onSuccess={() => { loadEvents(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
