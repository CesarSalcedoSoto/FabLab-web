"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CalendarClock,
    Plus,
    DoorOpen,
    Clock,
    Loader2,
    Users,
    Trash2,
    Edit,
    MapPin,
    AlertCircle,
    X,
    Package,
    UserPlus,
    Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Badge } from "@/shared/ui/badges/badge";
import { Input } from "@/shared/ui/inputs/input";
import { Label } from "@/shared/ui/labels/label";
import { Textarea } from "@/shared/ui/inputs/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/inputs/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/shared/ui/misc/dialog";
import { useAuth } from "@/features/auth";
import { DatePicker } from "@/shared/ui/inputs/date-picker";
import { toast } from "sonner";
import {
    getRooms,
    getReservations,
    createRoom as createRoomAction,
    updateRoom as updateRoomAction,
    deleteRoom as deleteRoomAction,
    createReservation as createReservationAction,
    deleteReservation as deleteReservationAction,
    type RoomDTO,
    type ReservationDTO,
    type RoomEquipmentDTO,
} from "./actions";

// ==================== TYPES ====================

interface RoomEquipment {
    id: string;
    name: string;
    category: "consumable" | "material" | "component" | "tool" | "supply" | "other";
    quantity: number;
}

type Room = RoomDTO;

type RoomReservation = ReservationDTO;

// ==================== CONSTANTS ====================

const EQUIPMENT_CATEGORIES: Record<RoomEquipment["category"], string> = {
    consumable: "Consumible",
    material: "Material",
    component: "Componente",
    tool: "Herramienta",
    supply: "Insumo",
    other: "Otro",
};

const EQUIPMENT_CATEGORY_COLORS: Record<RoomEquipment["category"], string> = {
    consumable: "bg-orange-100 text-orange-700",
    material: "bg-blue-100 text-blue-700",
    component: "bg-purple-100 text-purple-700",
    tool: "bg-yellow-100 text-yellow-700",
    supply: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-700",
};

const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00",
];

// ==================== COMPONENT ====================

export default function ReservasSalasPage() {
    const { user } = useAuth();
    const userRole = user?.role;
    const roleCode = typeof userRole === "string"
        ? userRole
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : userRole?.code || (user as any)?.payloadRole;
    const isAdmin = roleCode === "super_admin" || roleCode === "admin" || roleCode === "editor";

    const [rooms, setRooms] = useState<Room[]>([]);
    const [reservations, setReservations] = useState<RoomReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"reservar" | "mis-reservas" | "salas">("reservar");

    const loadData = useCallback(async () => {
        try {
            const [roomsData, reservationsData] = await Promise.all([
                getRooms(),
                getReservations(),
            ]);
            setRooms(roomsData);
            setReservations(reservationsData);
        } catch (err) {
            console.error("Error loading data:", err);
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reserve form
    const [showReserveForm, setShowReserveForm] = useState(false);
    const [reserveForm, setReserveForm] = useState({
        roomId: "",
        date: "",
        startTime: "",
        endTime: "",
        purpose: "",
    });
    const [companions, setCompanions] = useState<string[]>([]);
    const [companionInput, setCompanionInput] = useState("");
    const [reserveErrors, setReserveErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Room management (admin)
    const [showRoomDialog, setShowRoomDialog] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [roomForm, setRoomForm] = useState({
        name: "",
        location: "",
        capacity: 10,
        description: "",
        amenities: "",
    });
    const [roomEquipment, setRoomEquipment] = useState<RoomEquipment[]>([]);
    const [showEquipmentForm, setShowEquipmentForm] = useState(false);
    const [equipmentForm, setEquipmentForm] = useState({
        name: "",
        category: "tool" as RoomEquipment["category"],
        quantity: 1,
    });
    const [deleteRoomConfirm, setDeleteRoomConfirm] = useState<Room | null>(null);

    // View equipment detail for a room
    const [viewEquipmentRoom, setViewEquipmentRoom] = useState<Room | null>(null);

    const totalEquipment = rooms.reduce((sum, r) => sum + r.equipment.length, 0);

    // ==================== HELPERS ====================

    /** Check if two time ranges overlap: [s1,e1) and [s2,e2) */
    const timesOverlap = (s1: string, e1: string, s2: string, e2: string) =>
        s1 < e2 && s2 < e1;

    /** Get the active reservation for a room right now (if any) */
    const getActiveReservation = (roomId: number): RoomReservation | undefined => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const nowTime = now.toTimeString().slice(0, 5);  // HH:MM
        return reservations.find(
            (r) => r.roomId === roomId && r.date === todayStr && r.startTime <= nowTime && nowTime < r.endTime
        );
    };

    /** Check if a proposed reservation conflicts with existing ones */
    const hasConflict = (roomId: number, date: string, startTime: string, endTime: string): RoomReservation | undefined =>
        reservations.find(
            (r) => r.roomId === roomId && r.date === date && timesOverlap(r.startTime, r.endTime, startTime, endTime)
        );

    const inUseCount = rooms.filter((r) => getActiveReservation(r.id)).length;

    // ==================== HANDLERS ====================

    const handleAddCompanion = () => {
        const name = companionInput.trim();
        if (name && !companions.includes(name)) {
            setCompanions((prev) => [...prev, name]);
            setCompanionInput("");
        }
    };

    const handleRemoveCompanion = (name: string) => {
        setCompanions((prev) => prev.filter((c) => c !== name));
    };

    // Compute available time slots based on selected date
    // Round down to current half-hour so e.g. 19:31 still allows 19:30
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = now.getMinutes() < 30 ? "00" : "30";
    const currentSlot = `${hh}:${mm}`;
    const isToday = reserveForm.date === todayStr;
    const availableStartSlots = isToday
        ? TIME_SLOTS.filter((t) => t >= currentSlot)
        : TIME_SLOTS;
    const availableEndSlots = isToday
        ? TIME_SLOTS.filter((t) => t > currentSlot)
        : TIME_SLOTS;

    const handleReserve = async () => {
        const errors: Record<string, string> = {};
        if (!reserveForm.roomId) errors.roomId = "Selecciona una sala";
        if (!reserveForm.date) {
            errors.date = "Selecciona una fecha";
        } else {
            if (reserveForm.date < todayStr) errors.date = "No se puede reservar en una fecha pasada";
        }
        if (!reserveForm.startTime) errors.startTime = "Selecciona hora inicio";
        if (!reserveForm.endTime) errors.endTime = "Selecciona hora fin";
        if (reserveForm.startTime && reserveForm.endTime && reserveForm.startTime >= reserveForm.endTime)
            errors.endTime = "La hora fin debe ser después del inicio";
        if (!reserveForm.purpose.trim()) errors.purpose = "Indica el motivo";

        // If booking for today, ensure times are not in the past (rounded to half-hour)
        if (isToday && reserveForm.startTime && reserveForm.startTime < currentSlot) {
            errors.startTime = "La hora de inicio ya pasó";
        }

        // Check for time conflict (client-side pre-check)
        if (reserveForm.roomId && reserveForm.date && reserveForm.startTime && reserveForm.endTime && reserveForm.startTime < reserveForm.endTime) {
            const conflict = hasConflict(Number(reserveForm.roomId), reserveForm.date, reserveForm.startTime, reserveForm.endTime);
            if (conflict) {
                errors.startTime = `Conflicto: ${conflict.startTime} - ${conflict.endTime} (${conflict.userName})`;
            }
        }

        if (Object.keys(errors).length > 0) {
            setReserveErrors(errors);
            return;
        }

        setSubmitting(true);

        const room = rooms.find((r) => r.id === Number(reserveForm.roomId));
        const result = await createReservationAction({
            roomId: Number(reserveForm.roomId),
            roomName: room?.name || "",
            userId: Number(user?.id) || 0,
            userName: user?.name || "Usuario",
            date: reserveForm.date,
            startTime: reserveForm.startTime,
            endTime: reserveForm.endTime,
            purpose: reserveForm.purpose,
            companions: [...companions],
        });

        setSubmitting(false);

        if (!result.success) {
            toast.error(result.error || "Error al crear reserva");
            return;
        }

        toast.success("Reserva creada exitosamente");
        await loadData();
        setShowReserveForm(false);
        setReserveForm({ roomId: "", date: "", startTime: "", endTime: "", purpose: "" });
        setCompanions([]);
        setCompanionInput("");
        setReserveErrors({});
        setActiveTab("mis-reservas");
    };

    const handleCancelReservation = async (resId: number) => {
        const result = await deleteReservationAction(resId);
        if (result.success) {
            toast.success("Reserva cancelada");
            await loadData();
        } else {
            toast.error(result.error || "Error al cancelar reserva");
        }
    };

    const handleAddEquipment = () => {
        if (!equipmentForm.name.trim()) return;
        const newEq: RoomEquipment = {
            id: `eq-${Date.now()}`,
            name: equipmentForm.name.trim(),
            category: equipmentForm.category,
            quantity: equipmentForm.quantity,
        };
        setRoomEquipment((prev) => [...prev, newEq]);
        setEquipmentForm({ name: "", category: "tool", quantity: 1 });
        setShowEquipmentForm(false);
    };

    const handleRemoveEquipment = (eqId: string) => {
        setRoomEquipment((prev) => prev.filter((e) => e.id !== eqId));
    };

    const handleSaveRoom = async () => {
        if (!roomForm.name.trim()) return;

        const roomData = {
            name: roomForm.name,
            location: roomForm.location,
            capacity: roomForm.capacity,
            description: roomForm.description,
            amenities: roomForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
            equipment: roomEquipment.map((e) => ({
                name: e.name,
                category: e.category,
                quantity: e.quantity,
            })) as RoomEquipmentDTO[],
        };

        if (editingRoom) {
            const result = await updateRoomAction(editingRoom.id, roomData);
            if (!result.success) {
                toast.error(result.error || "Error al actualizar sala");
                return;
            }
            toast.success("Sala actualizada");
        } else {
            const result = await createRoomAction(roomData);
            if (!result.success) {
                toast.error(result.error || "Error al crear sala");
                return;
            }
            toast.success("Sala creada");
        }

        await loadData();
        setShowRoomDialog(false);
        setEditingRoom(null);
        setRoomForm({ name: "", location: "", capacity: 10, description: "", amenities: "" });
        setRoomEquipment([]);
    };

    const handleDeleteRoom = async (room: Room) => {
        const result = await deleteRoomAction(room.id);
        if (result.success) {
            toast.success("Sala eliminada");
            await loadData();
        } else {
            toast.error(result.error || "Error al eliminar sala");
        }
        setDeleteRoomConfirm(null);
    };

    const openEditRoom = (room: Room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            location: room.location,
            capacity: room.capacity,
            description: room.description,
            amenities: room.amenities.join(", "),
        });
        setRoomEquipment((room.equipment || []).map((e) => ({
            id: e.id || String(Math.random()),
            name: e.name,
            category: e.category,
            quantity: e.quantity,
        })));
        setShowRoomDialog(true);
    };

    const openAddRoom = () => {
        setEditingRoom(null);
        setRoomForm({ name: "", location: "", capacity: 10, description: "", amenities: "" });
        setRoomEquipment([]);
        setShowRoomDialog(true);
    };

    const formatDate = (d: string) =>
        new Date(d + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <DoorOpen className="h-6 w-6 text-teal-600" />
                        Reservas de Salas
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Reserva salas y espacios del FabLab
                    </p>
                </div>
                <Button onClick={() => setShowReserveForm(true)} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Reserva
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    <span className="ml-3 text-muted-foreground">Cargando datos...</span>
                </div>
            ) : (
            <>
            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-100">
                            <DoorOpen className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{rooms.length}</p>
                            <p className="text-xs text-muted-foreground">Salas disponibles</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <CalendarClock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{reservations.length}</p>
                            <p className="text-xs text-muted-foreground">Total reservas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalEquipment}</p>
                            <p className="text-xs text-muted-foreground">Equipos asignados</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                            <Clock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{inUseCount}</p>
                            <p className="text-xs text-muted-foreground">En uso ahora</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                <button
                    onClick={() => setActiveTab("reservar")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "reservar"
                            ? "border-teal-600 text-teal-600"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <DoorOpen className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                    Salas
                </button>
                <button
                    onClick={() => setActiveTab("mis-reservas")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "mis-reservas"
                            ? "border-teal-600 text-teal-600"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <CalendarClock className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                    {isAdmin ? "Todas las Reservas" : "Salas Reservadas"}
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("salas")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "salas"
                                ? "border-teal-600 text-teal-600"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Wrench className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                        Gestionar Salas
                    </button>
                )}
            </div>

            {/* Tab Content: Salas (browse) */}
            {activeTab === "reservar" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => {
                        const activeRes = getActiveReservation(room.id);
                        return (
                        <Card key={room.id} className={`hover:shadow-md transition-shadow ${activeRes ? "border-red-200" : ""}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DoorOpen className={`h-5 w-5 ${activeRes ? "text-red-500" : "text-teal-500"}`} />
                                    {room.name}
                                    {activeRes && (
                                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[10px] ml-1">
                                            <Clock className="h-3 w-3 mr-1" />
                                            En uso
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {room.location}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {activeRes && (
                                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs space-y-1">
                                        <p className="font-semibold text-red-700 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            Actualmente en uso
                                        </p>
                                        <p className="text-red-600">
                                            {activeRes.startTime} - {activeRes.endTime} · {activeRes.userName}
                                        </p>
                                        <p className="text-red-600/80 italic">{activeRes.purpose}</p>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">{room.description}</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>Capacidad: <strong>{room.capacity}</strong> personas</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {room.amenities.map((a) => (
                                        <Badge key={a} variant="secondary" className="text-[10px]">
                                            {a}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Equipment summary */}
                                {room.equipment.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <button
                                            onClick={() => setViewEquipmentRoom(room)}
                                            className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
                                        >
                                            <Package className="h-3.5 w-3.5" />
                                            {room.equipment.length} equipo{room.equipment.length !== 1 ? "s" : ""} / insumo{room.equipment.length !== 1 ? "s" : ""} asignado{room.equipment.length !== 1 ? "s" : ""}
                                        </button>
                                    </div>
                                )}

                                <Button
                                    size="sm"
                                    className="w-full mt-2 bg-teal-600 hover:bg-teal-700"
                                    onClick={() => {
                                        setReserveForm((prev) => ({ ...prev, roomId: String(room.id) }));
                                        setShowReserveForm(true);
                                    }}
                                >
                                    <CalendarClock className="h-4 w-4 mr-1" />
                                    Reservar esta sala
                                </Button>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>
            )}

            {/* Tab Content: Reservations */}
            {activeTab === "mis-reservas" && (
                <div className="space-y-4">
                    {reservations.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center">
                                <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground font-medium">No hay reservas</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => setShowReserveForm(true)}
                                >
                                    Crear primera reserva
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0 divide-y">
                                {reservations.map((res) => {
                                    const now = new Date();
                                    const todayStr = now.toISOString().slice(0, 10);
                                    const nowTime = now.toTimeString().slice(0, 5);
                                    const isNow = res.date === todayStr && res.startTime <= nowTime && nowTime < res.endTime;
                                    const isPast = res.date < todayStr || (res.date === todayStr && res.endTime <= nowTime);
                                    return (
                                    <div key={res.id} className={`p-4 hover:bg-muted/50 transition-colors ${isNow ? "bg-red-50/50" : ""}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <DoorOpen className={`h-4 w-4 flex-shrink-0 ${isNow ? "text-red-500" : "text-teal-500"}`} />
                                                    <span className="font-medium">{res.roomName}</span>
                                                    {isNow ? (
                                                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            En uso ahora
                                                        </Badge>
                                                    ) : isPast ? (
                                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                                                            Finalizada
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                                            Confirmada
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarClock className="h-3.5 w-3.5" />
                                                        {formatDate(res.date)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {res.startTime} - {res.endTime}
                                                    </span>
                                                    {isAdmin && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3.5 w-3.5" />
                                                            {res.userName}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 italic">{res.purpose}</p>
                                                {res.companions.length > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs text-muted-foreground">Acompañantes:</span>
                                                        {res.companions.map((c) => (
                                                            <Badge key={c} variant="secondary" className="text-[10px]">
                                                                {c}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {!isPast && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 h-8 flex-shrink-0"
                                                    onClick={() => handleCancelReservation(res.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Tab Content: Manage Rooms (admin only) */}
            {activeTab === "salas" && isAdmin && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={openAddRoom} className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar Sala
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <Card key={room.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{room.name}</CardTitle>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditRoom(room)}
                                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteRoomConfirm(room)}
                                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        <MapPin className="h-3.5 w-3.5 inline mr-1" />
                                        {room.location}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground">{room.description}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        Capacidad: {room.capacity}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {room.amenities.map((a) => (
                                            <Badge key={a} variant="secondary" className="text-[10px]">
                                                {a}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Equipment list */}
                                    {room.equipment.length > 0 && (
                                        <div className="pt-2 border-t space-y-1.5">
                                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                <Package className="h-3.5 w-3.5" />
                                                Equipos e Insumos ({room.equipment.length})
                                            </p>
                                            {room.equipment.slice(0, 3).map((eq, idx) => (
                                                <div key={eq.id || idx} className="flex items-center justify-between text-xs">
                                                    <span className="truncate">{eq.name}</span>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${EQUIPMENT_CATEGORY_COLORS[eq.category]}`}>
                                                            {EQUIPMENT_CATEGORIES[eq.category]}
                                                        </Badge>
                                                        <span className="text-muted-foreground">×{eq.quantity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {room.equipment.length > 3 && (
                                                <button
                                                    onClick={() => setViewEquipmentRoom(room)}
                                                    className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                                                >
                                                    Ver todos ({room.equipment.length})
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            </>
            )}

            {/* Reserve Dialog */}
            <Dialog open={showReserveForm} onOpenChange={(open) => { if (!open) { setShowReserveForm(false); setReserveErrors({}); setCompanions([]); setCompanionInput(""); } }}>
                <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-teal-500" />
                            Nueva Reserva de Sala
                        </DialogTitle>
                        <DialogDescription>Selecciona una sala, fecha y horario</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Sala *</Label>
                            <Select
                                value={reserveForm.roomId}
                                onValueChange={(v) => {
                                    setReserveForm((prev) => ({ ...prev, roomId: v }));
                                    setReserveErrors((prev) => { const n = { ...prev }; delete n.roomId; return n; });
                                }}
                            >
                                <SelectTrigger className={reserveErrors.roomId ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Selecciona una sala" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map((room) => (
                                        <SelectItem key={room.id} value={String(room.id)}>
                                            {room.name} (Cap. {room.capacity})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {reserveErrors.roomId && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{reserveErrors.roomId}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Fecha *</Label>
                            <DatePicker
                                value={reserveForm.date}
                                onChange={(d) => {
                                    setReserveForm((prev) => ({ ...prev, date: d, startTime: "", endTime: "" }));
                                    setReserveErrors((prev) => { const n = { ...prev }; delete n.date; delete n.startTime; delete n.endTime; return n; });
                                }}
                                placeholder="Seleccionar fecha"
                                disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                }}
                            />
                            {reserveErrors.date && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{reserveErrors.date}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hora inicio *</Label>
                                <Select
                                    value={reserveForm.startTime}
                                    onValueChange={(v) => {
                                        setReserveForm((prev) => ({ ...prev, startTime: v }));
                                        setReserveErrors((prev) => { const n = { ...prev }; delete n.startTime; return n; });
                                    }}
                                >
                                    <SelectTrigger className={reserveErrors.startTime ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Inicio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStartSlots.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {reserveErrors.startTime && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />{reserveErrors.startTime}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Hora fin *</Label>
                                <Select
                                    value={reserveForm.endTime}
                                    onValueChange={(v) => {
                                        setReserveForm((prev) => ({ ...prev, endTime: v }));
                                        setReserveErrors((prev) => { const n = { ...prev }; delete n.endTime; return n; });
                                    }}
                                >
                                    <SelectTrigger className={reserveErrors.endTime ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Fin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEndSlots.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {reserveErrors.endTime && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />{reserveErrors.endTime}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo de la reserva *</Label>
                            <Textarea
                                placeholder="Describe el propósito de la reserva..."
                                value={reserveForm.purpose}
                                onChange={(e) => {
                                    setReserveForm((prev) => ({ ...prev, purpose: e.target.value }));
                                    setReserveErrors((prev) => { const n = { ...prev }; delete n.purpose; return n; });
                                }}
                                rows={3}
                                className={reserveErrors.purpose ? "border-red-500" : ""}
                            />
                            {reserveErrors.purpose && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{reserveErrors.purpose}
                                </p>
                            )}
                        </div>

                        {/* Companions */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <UserPlus className="h-3.5 w-3.5" />
                                Acompañantes
                                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nombre del acompañante"
                                    value={companionInput}
                                    onChange={(e) => setCompanionInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddCompanion();
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddCompanion}
                                    disabled={!companionInput.trim()}
                                    className="px-3"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {companions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {companions.map((c) => (
                                        <Badge key={c} variant="secondary" className="gap-1 pr-1">
                                            {c}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCompanion(c)}
                                                className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {companions.length === 0 && (
                                <p className="text-[11px] text-muted-foreground">
                                    Si no agregas acompañantes, la sala se reservará solo para ti.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReserveForm(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleReserve} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                            {submitting ? (
                                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Reservando...</>
                            ) : (
                                <><CalendarClock className="h-4 w-4 mr-1" />Confirmar Reserva</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Room Add/Edit Dialog (admin) */}
            <Dialog open={showRoomDialog} onOpenChange={(open) => { if (!open) { setShowRoomDialog(false); setEditingRoom(null); setShowEquipmentForm(false); } }}>
                <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRoom ? "Editar Sala" : "Agregar Sala"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRoom ? "Modifica los datos de la sala y sus equipos" : "Completa la información de la nueva sala"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="room-name">Nombre *</Label>
                            <Input
                                id="room-name"
                                placeholder="Ej: Sala de Reuniones B"
                                value={roomForm.name}
                                onChange={(e) => setRoomForm((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-location">Ubicación</Label>
                            <Input
                                id="room-location"
                                placeholder="Ej: Edificio Principal, Piso 2"
                                value={roomForm.location}
                                onChange={(e) => setRoomForm((prev) => ({ ...prev, location: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-capacity">Capacidad</Label>
                            <Input
                                id="room-capacity"
                                type="number"
                                min={1}
                                value={roomForm.capacity}
                                onChange={(e) => setRoomForm((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-desc">Descripción</Label>
                            <Textarea
                                id="room-desc"
                                placeholder="Descripción del espacio..."
                                value={roomForm.description}
                                onChange={(e) => setRoomForm((prev) => ({ ...prev, description: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-amenities">Comodidades (separado por comas)</Label>
                            <Input
                                id="room-amenities"
                                placeholder="Ej: Proyector, WiFi, Pizarra"
                                value={roomForm.amenities}
                                onChange={(e) => setRoomForm((prev) => ({ ...prev, amenities: e.target.value }))}
                            />
                        </div>

                        {/* Equipment section */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Package className="h-4 w-4 text-teal-600" />
                                    Equipos e Insumos
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEquipmentForm(!showEquipmentForm)}
                                    className="h-7 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Agregar
                                </Button>
                            </div>

                            {/* Add equipment inline form */}
                            {showEquipmentForm && (
                                <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Nombre del equipo / insumo</Label>
                                        <Input
                                            placeholder="Ej: Impresora 3D Ender 3"
                                            value={equipmentForm.name}
                                            onChange={(e) => setEquipmentForm((prev) => ({ ...prev, name: e.target.value }))}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Categoría</Label>
                                            <Select
                                                value={equipmentForm.category}
                                                onValueChange={(v: string) => setEquipmentForm((prev) => ({ ...prev, category: v as RoomEquipment["category"] }))}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(EQUIPMENT_CATEGORIES).map(([val, label]) => (
                                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Cantidad</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={equipmentForm.quantity}
                                                onChange={(e) => setEquipmentForm((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowEquipmentForm(false)}>
                                            Cancelar
                                        </Button>
                                        <Button type="button" size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700" onClick={handleAddEquipment} disabled={!equipmentForm.name.trim()}>
                                            Añadir
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Equipment list */}
                            {roomEquipment.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2 text-center">
                                    Sin equipos ni insumos asignados
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {roomEquipment.map((eq) => (
                                        <div key={eq.id} className="flex items-center justify-between p-2 rounded-md border bg-background text-sm">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="truncate font-medium">{eq.name}</span>
                                                <Badge variant="outline" className={`text-[9px] px-1 py-0 flex-shrink-0 ${EQUIPMENT_CATEGORY_COLORS[eq.category]}`}>
                                                    {EQUIPMENT_CATEGORIES[eq.category]}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                <span className="text-xs text-muted-foreground">×{eq.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEquipment(eq.id)}
                                                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRoomDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveRoom} className="bg-teal-600 hover:bg-teal-700">
                            {editingRoom ? "Guardar Cambios" : "Agregar Sala"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Equipment Dialog */}
            <Dialog open={!!viewEquipmentRoom} onOpenChange={(open) => !open && setViewEquipmentRoom(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-teal-500" />
                            Equipos — {viewEquipmentRoom?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Equipos e insumos asignados a esta sala
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2 max-h-[400px] overflow-y-auto">
                        {viewEquipmentRoom?.equipment.map((eq, idx) => (
                            <div key={eq.id || idx} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="min-w-0">
                                    <p className="font-medium text-sm">{eq.name}</p>
                                    <Badge variant="outline" className={`text-[10px] mt-1 ${EQUIPMENT_CATEGORY_COLORS[eq.category]}`}>
                                        {EQUIPMENT_CATEGORIES[eq.category]}
                                    </Badge>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <p className="text-lg font-bold">{eq.quantity}</p>
                                    <p className="text-[10px] text-muted-foreground">unidades</p>
                                </div>
                            </div>
                        ))}
                        {(!viewEquipmentRoom?.equipment || viewEquipmentRoom.equipment.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-8">Sin equipos asignados</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewEquipmentRoom(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Room Confirm */}
            <Dialog open={!!deleteRoomConfirm} onOpenChange={(open) => !open && setDeleteRoomConfirm(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar Sala</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar <strong>{deleteRoomConfirm?.name}</strong>? Las reservas existentes no se eliminarán.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteRoomConfirm(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteRoomConfirm && handleDeleteRoom(deleteRoomConfirm)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
