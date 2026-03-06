"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/buttons/button";
import { Switch } from "@/shared/ui/misc/switch";
import { Label } from "@/shared/ui/labels/label";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Clock,
    Calendar,
} from "lucide-react";
import { cn } from "@/shared/utils";

// ── Types ──

export interface TimeRange {
    startTime: string; // "HH:MM"
    endTime: string;   // "HH:MM"
}

export interface DaySchedule {
    day: string;
    active: boolean;
    timeRanges: TimeRange[];
}

interface WeeklyScheduleEditorProps {
    value: DaySchedule[];
    onChange: (schedule: DaySchedule[]) => void;
}

// ── Constants ──

const DAYS_CONFIG = [
    { value: "monday", label: "Lunes", short: "Lun", color: "bg-blue-500" },
    { value: "tuesday", label: "Martes", short: "Mar", color: "bg-indigo-500" },
    { value: "wednesday", label: "Miércoles", short: "Mié", color: "bg-violet-500" },
    { value: "thursday", label: "Jueves", short: "Jue", color: "bg-purple-500" },
    { value: "friday", label: "Viernes", short: "Vie", color: "bg-fuchsia-500" },
    { value: "saturday", label: "Sábado", short: "Sáb", color: "bg-amber-500" },
    { value: "sunday", label: "Domingo", short: "Dom", color: "bg-orange-500" },
];

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS_CONFIG.map((d) => ({
    day: d.value,
    active: false,
    timeRanges: [],
}));

const HOUR_LABELS = Array.from({ length: 15 }, (_, i) => {
    const h = i + 7; // 07:00 to 21:00
    return `${String(h).padStart(2, "0")}:00`;
});

// ── Helpers ──

function getDayConfig(day: string) {
    return DAYS_CONFIG.find((d) => d.value === day) ?? DAYS_CONFIG[0];
}

function formatTime(time: string) {
    return time || "--:--";
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function getBarStyle(range: TimeRange) {
    const start = timeToMinutes(range.startTime);
    const end = timeToMinutes(range.endTime);
    const dayStart = 7 * 60;   // 07:00
    const dayEnd = 21 * 60;    // 21:00
    const total = dayEnd - dayStart;

    const left = Math.max(0, ((start - dayStart) / total) * 100);
    const width = Math.max(0, ((end - start) / total) * 100);

    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
}

// ── Component ──

export function WeeklyScheduleEditor({ value, onChange }: WeeklyScheduleEditorProps) {
    const [expanded, setExpanded] = useState(false);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Ensure all 7 days exist in the schedule
    const schedule = DAYS_CONFIG.map((dc) => {
        const existing = value.find((d) => d.day === dc.value);
        return existing ?? { day: dc.value, active: false, timeRanges: [] };
    });

    const activeDaysCount = schedule.filter((d) => d.active).length;
    const totalRanges = schedule.reduce((sum, d) => sum + d.timeRanges.length, 0);

    const updateDay = (dayValue: string, updater: (day: DaySchedule) => DaySchedule) => {
        const currentSchedule = DAYS_CONFIG.map((dc) => {
            const existing = value.find((d) => d.day === dc.value);
            return existing ?? { day: dc.value, active: false, timeRanges: [] };
        });
        const next = currentSchedule.map((d) =>
            d.day === dayValue ? updater({ ...d }) : d
        );
        onChange(next);
    };

    const toggleDay = (dayValue: string) => {
        updateDay(dayValue, (d) => {
            const willBeActive = !d.active;
            // Auto-expand the day's time editor when activating it
            if (willBeActive) {
                setExpandedDay(dayValue);
            }
            return {
                ...d,
                active: willBeActive,
                timeRanges: willBeActive && d.timeRanges.length === 0
                    ? [{ startTime: "09:00", endTime: "13:00" }]
                    : d.timeRanges,
            };
        });
    };

    const addTimeRange = (dayValue: string) => {
        updateDay(dayValue, (d) => ({
            ...d,
            timeRanges: [...d.timeRanges, { startTime: "14:00", endTime: "18:00" }],
        }));
    };

    const removeTimeRange = (dayValue: string, index: number) => {
        updateDay(dayValue, (d) => ({
            ...d,
            timeRanges: d.timeRanges.filter((_, i) => i !== index),
        }));
    };

    const updateTimeRange = (
        dayValue: string,
        index: number,
        field: "startTime" | "endTime",
        val: string
    ) => {
        updateDay(dayValue, (d) => ({
            ...d,
            timeRanges: d.timeRanges.map((r, i) =>
                i === index ? { ...r, [field]: val } : r
            ),
        }));
    };

    return (
        <div className="space-y-3">
            {/* Header / toggle */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
                    expanded
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-lg",
                        expanded ? "bg-orange-100" : "bg-gray-100"
                    )}>
                        <Calendar className={cn("h-5 w-5", expanded ? "text-orange-600" : "text-gray-500")} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800">
                            Horario Semanal
                        </p>
                        <p className="text-xs text-gray-500">
                            {activeDaysCount === 0
                                ? "Sin disponibilidad configurada"
                                : `${activeDaysCount} día${activeDaysCount !== 1 ? "s" : ""} activo${activeDaysCount !== 1 ? "s" : ""} · ${totalRanges} bloque${totalRanges !== 1 ? "s" : ""} horario${totalRanges !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                </div>
                {expanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {/* Compact mini-bar preview (when collapsed) */}
            {!expanded && activeDaysCount > 0 && (
                <div className="px-2 space-y-1.5">
                    {schedule.filter((d) => d.active).map((day) => {
                        const cfg = getDayConfig(day.day);
                        return (
                            <div key={day.day} className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-gray-500 w-8 text-right">
                                    {cfg.short}
                                </span>
                                <div className="flex-1 h-4 bg-gray-100 rounded-full relative overflow-hidden">
                                    {day.timeRanges.map((range, i) => (
                                        <div
                                            key={i}
                                            className={cn("absolute top-0 h-full rounded-full opacity-80", cfg.color)}
                                            style={getBarStyle(range)}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-400 w-20 text-right tabular-nums">
                                    {day.timeRanges
                                        .map((r) => `${formatTime(r.startTime)}-${formatTime(r.endTime)}`)
                                        .join(", ")}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Expanded calendar */}
            {expanded && (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                    {/* Timeline header */}
                    <div className="flex items-center px-4 py-2 bg-gray-50">
                        <div className="w-32 shrink-0" />
                        <div className="flex-1 flex justify-between">
                            {HOUR_LABELS.filter((_, i) => i % 2 === 0).map((h) => (
                                <span key={h} className="text-[10px] text-gray-400 font-medium tabular-nums">
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Day rows */}
                    {schedule.map((day) => {
                        const cfg = getDayConfig(day.day);
                        const isExpanded = expandedDay === day.day;
                        const hasError = day.timeRanges.some(
                            (r) => r.endTime <= r.startTime
                        );

                        return (
                            <div key={day.day} className="group">
                                {/* Row: day toggle + timeline bar */}
                                <div className="flex items-center px-4 py-2 gap-3">
                                    {/* Day label + switch */}
                                    <div className="w-32 shrink-0 flex items-center gap-2">
                                        <Switch
                                            checked={day.active}
                                            onCheckedChange={() => toggleDay(day.day)}
                                            className="data-[state=checked]:bg-orange-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedDay(isExpanded ? null : day.day)
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            <span
                                                className={cn(
                                                    "text-sm font-medium transition-colors",
                                                    day.active
                                                        ? "text-gray-800"
                                                        : "text-gray-400"
                                                )}
                                            >
                                                {cfg.label}
                                            </span>
                                            {day.active && (
                                                <ChevronDown
                                                    className={cn(
                                                        "h-3.5 w-3.5 text-gray-400 transition-transform",
                                                        isExpanded && "rotate-180"
                                                    )}
                                                />
                                            )}
                                        </button>
                                    </div>

                                    {/* Timeline bar - click to expand/collapse time editor */}
                                    <div
                                        className="flex-1 h-7 bg-gray-50 rounded-lg relative overflow-hidden border border-gray-100 cursor-pointer hover:border-gray-300 transition-colors"
                                        onClick={() => {
                                            if (day.active) {
                                                setExpandedDay(isExpanded ? null : day.day);
                                            }
                                        }}
                                        title={day.active ? (isExpanded ? "Clic para contraer" : "Clic para editar horarios") : "Activa el día primero"}
                                    >
                                        {/* Hour grid lines */}
                                        {HOUR_LABELS.map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute top-0 h-full border-l border-gray-100"
                                                style={{
                                                    left: `${(i / (HOUR_LABELS.length - 1)) * 100}%`,
                                                }}
                                            />
                                        ))}
                                        {day.active &&
                                            day.timeRanges.map((range, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "absolute top-0.5 bottom-0.5 rounded-md transition-all",
                                                        hasError
                                                            ? "bg-red-400/80"
                                                            : `${cfg.color} opacity-80`
                                                    )}
                                                    style={getBarStyle(range)}
                                                    title={`${range.startTime} - ${range.endTime}`}
                                                />
                                            ))}
                                        {!day.active && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] text-gray-300 font-medium">
                                                    No disponible
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded time-range editors */}
                                {day.active && isExpanded && (
                                    <div className="px-4 pb-3 pl-[calc(8rem+1rem)] space-y-2">
                                        {day.timeRanges.map((range, idx) => {
                                            const rangeError =
                                                range.endTime <= range.startTime;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded-lg border",
                                                        rangeError
                                                            ? "border-red-200 bg-red-50"
                                                            : "border-gray-100 bg-gray-50"
                                                    )}
                                                >
                                                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />

                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="time"
                                                            value={range.startTime}
                                                            onChange={(e) =>
                                                                updateTimeRange(
                                                                    day.day,
                                                                    idx,
                                                                    "startTime",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="text-sm border border-gray-200 rounded-md px-2 py-1 w-[7rem] bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 tabular-nums"
                                                        />
                                                        <span className="text-gray-400 text-sm">
                                                            →
                                                        </span>
                                                        <input
                                                            type="time"
                                                            value={range.endTime}
                                                            onChange={(e) =>
                                                                updateTimeRange(
                                                                    day.day,
                                                                    idx,
                                                                    "endTime",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="text-sm border border-gray-200 rounded-md px-2 py-1 w-[7rem] bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 tabular-nums"
                                                        />
                                                    </div>

                                                    {rangeError && (
                                                        <span className="text-[11px] text-red-500 font-medium">
                                                            Hora fin debe ser mayor
                                                        </span>
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="ml-auto h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                                        onClick={() =>
                                                            removeTimeRange(day.day, idx)
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            );
                                        })}

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addTimeRange(day.day)}
                                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            Agregar bloque horario
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
