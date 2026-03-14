"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Badge } from "@/shared/ui/badges/badge";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Wrench,
  DoorOpen,
  Users,
  FileText,
} from "lucide-react";
import { getPublicCalendarEvents, type CalendarEvent } from "./calendario-actions";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEKDAYS_SHORT = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const eventTypeColors: Record<string, { bg: string; dot: string; text: string }> = {
  equipment: { bg: "bg-purple-50", dot: "bg-purple-500", text: "text-purple-700" },
  room: { bg: "bg-teal-50", dot: "bg-teal-500", text: "text-teal-700" },
  meeting: { bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-700" },
  event: { bg: "bg-orange-50", dot: "bg-orange-500", text: "text-orange-700" },
};

const eventTypeLabels: Record<string, string> = {
  equipment: "Equipo",
  room: "Sala",
  meeting: "Reunion",
  event: "Evento",
};

const eventTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  equipment: Wrench,
  room: DoorOpen,
  meeting: Users,
  event: FileText,
};

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function PanelCalendarWidget() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicCalendarEvents(currentMonth, currentYear);
      setEvents(data);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfWeek(currentMonth, currentYear);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Calendario
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-4 xl:gap-5 items-start">
          <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-sm font-semibold">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5 mb-4">
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
              {calendarCells.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="p-1" />;
                }
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = isCurrentMonth && day === today.getDate();
                const isSelected = selectedDate === dateStr;
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`
                      relative p-1 text-center rounded-lg transition-all text-xs
                      ${isToday ? "bg-blue-600 text-white font-bold" : ""}
                      ${isSelected && !isToday ? "bg-gray-900 text-white" : ""}
                      ${!isToday && !isSelected ? "hover:bg-gray-100" : ""}
                      ${!isToday && !isSelected && hasEvents ? "font-medium" : ""}
                    `}
                  >
                    <span className="block">{day}</span>
                    {hasEvents && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, idx) => {
                          const colors = eventTypeColors[ev.type] || eventTypeColors.equipment;
                          return (
                            <span
                              key={idx}
                              className={`w-1 h-1 rounded-full ${isToday || isSelected ? "bg-white/70" : colors.dot}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Stats when no date selected */}
            {!selectedDate && (
              <div className="border-t pt-3 mt-1">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(["equipment", "room", "meeting", "event"] as const).map((type) => {
                    const count = events.filter((e) => e.type === type).length;
                    const colors = eventTypeColors[type];
                    return (
                      <div key={type} className={`rounded-lg p-2 ${colors.bg}`}>
                        <p className={`text-lg font-bold ${colors.text}`}>{count}</p>
                        <p className="text-[9px] text-gray-500">{eventTypeLabels[type]}s</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t xl:border-t-0 xl:border-l pt-3 xl:pt-0 xl:pl-4 min-h-[11rem]">
            {selectedDate ? (
              <>
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h4>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">Sin eventos este día</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedEvents.map((ev) => {
                      const colors = eventTypeColors[ev.type] || eventTypeColors.equipment;
                      const Icon = eventTypeIcons[ev.type] || Wrench;
                      return (
                        <div
                          key={ev.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg ${colors.bg}`}
                        >
                          <div className="p-1.5 rounded-md bg-white/80">
                            <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${colors.text} truncate`}>{ev.title}</p>
                            {ev.startTime && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] text-gray-500">
                                  {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ""}
                                </span>
                              </div>
                            )}
                            {ev.userName && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{ev.userName}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
                            {eventTypeLabels[ev.type] || ev.type}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col justify-center text-center text-gray-400">
                <p className="text-sm font-medium text-gray-500">Selecciona un día</p>
                <p className="text-xs mt-1">Aquí verás los eventos agendados.</p>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
