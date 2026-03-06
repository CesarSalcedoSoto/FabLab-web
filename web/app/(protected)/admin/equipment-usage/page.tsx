"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Textarea } from "@/shared/ui/inputs/textarea";
import { Label } from "@/shared/ui/labels/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/misc/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/tables/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/misc/tabs";
import {
  Monitor,
  Cpu,
  Printer,
  Wrench,
  Package,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  Loader2,
  Search,
  Play,
  Square,
  Clock,
  User,
  History,
  CalendarClock,
  Calendar,
  Settings,
  CalendarCheck,
  X,
} from "lucide-react";
import { Badge } from "@/shared/ui/badges/badge";
import { toast } from "sonner";
import { 
  getActiveEquipment, 
  submitEquipmentRequest, 
  getEquipmentRequests,
  startEquipmentUsage,
  releaseEquipment,
  getCurrentUserId,
  getUsageHistory,
  getCurrentUserIsAdmin,
  toggleEquipmentMaintenance,
  getEquipmentReservations,
  createEquipmentReservation,
  cancelEquipmentReservation,
  getEquipmentBusySlots,
  getMaxUsageMinutes,
  type EquipmentReservation,
} from "./actions";
import { DatePicker } from "@/shared/ui/inputs/date-picker";

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: "available" | "in-use" | "maintenance";
  quantity: number;
  location: string;
  image?: string;
  currentUserId?: string;
  currentUserName?: string;
  estimatedEndTime?: string;
}

interface EquipmentRequest {
  id: string;
  equipmentName: string;
  description: string;
  quantity: number;
  justification: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  requestedByAvatar?: string;
  requestedById?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface UsageRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  startTime: string;
  endTime?: string;
  estimatedDuration: string;
  description?: string;
  status: "active" | "completed";
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Computación": Monitor,
  "Electrónica": Cpu,
  "Impresión 3D": Printer,
  "Herramientas": Wrench,
  "Otros": Package,
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700 border-green-200",
  "in-use": "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const statusLabels: Record<string, string> = {
  available: "Disponible",
  "in-use": "En uso",
  maintenance: "Mantenimiento",
};

const requestStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const requestStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const durationOptions = [
  { value: "30min", label: "30 minutos" },
  { value: "1h", label: "1 hora" },
  { value: "2h", label: "2 horas" },
  { value: "4h", label: "4 horas" },
  { value: "8h", label: "8 horas (1 día)" },
  { value: "1d", label: "1 día completo" },
  { value: "2d", label: "2 días" },
  { value: "1w", label: "1 semana" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00",
];

export default function EquipmentUsagePage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("equipment");
  
  const [requestForm, setRequestForm] = useState({
    equipmentName: "",
    description: "",
    quantity: 1,
    justification: "",
  });

  const [useForm, setUseForm] = useState({
    estimatedDuration: "1h",
    description: "",
  });

  // Reservation state
  const [reservations, setReservations] = useState<EquipmentReservation[]>([]);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [reserveEquipment, setReserveEquipment] = useState<Equipment | null>(null);
  const [reserveForm, setReserveForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    description: "",
  });
  const [busySlots, setBusySlots] = useState<{ startTime: string; endTime: string; type: "reservation" | "in-use"; userName: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [maxUsageMinutes, setMaxUsageMinutes] = useState<number | null>(null);
  const [loadingMaxUsage, setLoadingMaxUsage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [equipmentData, requestsData, historyData, userId, adminStatus, reservationsData] = await Promise.all([
        getActiveEquipment(),
        getEquipmentRequests(),
        getUsageHistory(),
        getCurrentUserId(),
        getCurrentUserIsAdmin(),
        getEquipmentReservations(),
      ]);
      setEquipment(equipmentData);
      setRequests(requestsData);
      setUsageHistory(historyData);
      setCurrentUserId(userId);
      setIsAdmin(adminStatus);
      setReservations(reservationsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseEquipment = async () => {
    if (!selectedEquipment) return;

    try {
      setIsSubmitting(true);
      const result = await startEquipmentUsage({
        equipmentId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        estimatedDuration: useForm.estimatedDuration,
        description: useForm.description || undefined,
      });
      
      if (result.success) {
        toast.success(`Ahora estás usando: ${selectedEquipment.name}`);
        setIsUseDialogOpen(false);
        setSelectedEquipment(null);
        setUseForm({ estimatedDuration: "1h", description: "" });
        loadData();
      } else {
        toast.error(result.error || "Error al registrar el uso");
      }
    } catch (error) {
      toast.error("Error al registrar el uso del equipo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseEquipment = async (equipmentId: string) => {
    try {
      setIsSubmitting(true);
      const result = await releaseEquipment(equipmentId);
      
      if (result.success) {
        toast.success("Equipo liberado correctamente");
        loadData();
      } else {
        toast.error(result.error || "Error al liberar el equipo");
      }
    } catch (error) {
      toast.error("Error al liberar el equipo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (equipmentId: string, currentStatus: string) => {
    try {
      setIsSubmitting(true);
      const setMaintenance = currentStatus !== "maintenance";
      const result = await toggleEquipmentMaintenance(equipmentId, setMaintenance);
      
      if (result.success) {
        toast.success(setMaintenance ? "Equipo puesto en mantenimiento" : "Equipo disponible nuevamente");
        loadData();
      } else {
        toast.error(result.error || "Error al cambiar el estado");
      }
    } catch (error) {
      toast.error("Error al cambiar el estado del equipo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.equipmentName.trim() || !requestForm.justification.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitEquipmentRequest(requestForm);
      
      if (result.success) {
        toast.success("Solicitud enviada correctamente");
        setIsRequestDialogOpen(false);
        setRequestForm({
          equipmentName: "",
          description: "",
          quantity: 1,
          justification: "",
        });
        loadData();
      } else {
        toast.error(result.error || "Error al enviar la solicitud");
      }
    } catch (error) {
      toast.error("Error al enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUseDialog = async (item: Equipment) => {
    setSelectedEquipment(item);
    setUseForm({ estimatedDuration: "1h", description: "" });
    setMaxUsageMinutes(null);
    setIsUseDialogOpen(true);
    // Fetch max usage time considering upcoming reservations
    try {
      setLoadingMaxUsage(true);
      const maxMin = await getMaxUsageMinutes(item.id);
      setMaxUsageMinutes(maxMin);
      // Auto-select a valid duration if default exceeds max
      if (maxMin !== null && maxMin < 60) {
        setUseForm(prev => ({ ...prev, estimatedDuration: "30min" }));
      }
    } catch {
      setMaxUsageMinutes(null);
    } finally {
      setLoadingMaxUsage(false);
    }
  };

  const openReserveDialog = (item: Equipment) => {
    setReserveEquipment(item);
    setReserveForm({ date: "", startTime: "", endTime: "", description: "" });
    setBusySlots([]);
    setIsReserveDialogOpen(true);
  };

  // Load busy slots when equipment + date change
  const loadBusySlots = async (equipmentId: string, date: string) => {
    if (!equipmentId || !date) {
      setBusySlots([]);
      return;
    }
    try {
      setLoadingSlots(true);
      const slots = await getEquipmentBusySlots(equipmentId, date);
      setBusySlots(slots);
    } catch {
      setBusySlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReserveDateChange = (date: string) => {
    setReserveForm(prev => ({ ...prev, date, startTime: "", endTime: "" }));
    if (reserveEquipment) {
      loadBusySlots(reserveEquipment.id, date);
    }
  };

  /**
   * Check if a time slot is occupied by an existing reservation or active usage
   */
  const isSlotBusy = (slot: string): { busy: boolean; reason?: string } => {
    for (const b of busySlots) {
      // A slot is busy if it falls within [startTime, endTime)
      if (slot >= b.startTime && slot < b.endTime) {
        const label = b.type === "in-use"
          ? `En uso por ${b.userName}`
          : `Reservado por ${b.userName}`;
        return { busy: true, reason: label };
      }
    }
    return { busy: false };
  };

  /**
   * Check if a time slot is too close (less than 1 hour from now)
   */
  const isSlotTooSoon = (slot: string): boolean => {
    if (!reserveForm.date) return false;
    const now = new Date();
    const slotDate = new Date(`${reserveForm.date}T${slot}:00`);
    const diffMs = slotDate.getTime() - now.getTime();
    return diffMs < 60 * 60 * 1000; // Less than 1 hour
  };

  /**
   * Get available start time slots (exclude busy and too-soon)
   */
  const getAvailableStartSlots = () => {
    return TIME_SLOTS.map(slot => {
      const busyCheck = isSlotBusy(slot);
      const tooSoon = isSlotTooSoon(slot);
      return {
        value: slot,
        disabled: busyCheck.busy || tooSoon,
        reason: busyCheck.busy ? busyCheck.reason : tooSoon ? "Menos de 1h de anticipación" : undefined,
      };
    });
  };

  /**
   * Get available end time slots (after start, exclude busy between start-end)
   */
  const getAvailableEndSlots = () => {
    if (!reserveForm.startTime) return [];
    return TIME_SLOTS
      .filter(t => t > reserveForm.startTime)
      .map(slot => {
        // Check if any busy slot overlaps between startTime and this end slot
        const wouldConflict = busySlots.some(b =>
          b.startTime < slot && reserveForm.startTime < b.endTime
        );
        return {
          value: slot,
          disabled: wouldConflict,
          reason: wouldConflict ? "Conflicto con reserva/uso existente" : undefined,
        };
      });
  };

  const handleReserveEquipment = async () => {
    if (!reserveEquipment) return;

    if (!reserveForm.description.trim()) {
      toast.error("La descripción es obligatoria para reservar un equipo");
      return;
    }

    if (!reserveForm.date || !reserveForm.startTime || !reserveForm.endTime) {
      toast.error("Completa la fecha, hora de inicio y hora de fin");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createEquipmentReservation({
        equipmentId: reserveEquipment.id,
        equipmentName: reserveEquipment.name,
        date: reserveForm.date,
        startTime: reserveForm.startTime,
        endTime: reserveForm.endTime,
        description: reserveForm.description.trim(),
      });

      if (result.success) {
        toast.success(`Reserva creada para: ${reserveEquipment.name}`);
        setIsReserveDialogOpen(false);
        setReserveEquipment(null);
        setReserveForm({ date: "", startTime: "", endTime: "", description: "" });
        loadData();
      } else {
        toast.error(result.error || "Error al crear la reserva");
      }
    } catch (error) {
      toast.error("Error al crear la reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      setIsSubmitting(true);
      const result = await cancelEquipmentReservation(reservationId);

      if (result.success) {
        toast.success("Reserva cancelada");
        loadData();
      } else {
        toast.error(result.error || "Error al cancelar la reserva");
      }
    } catch (error) {
      toast.error("Error al cancelar la reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["all", ...new Set(equipment.map(e => e.category))];
  
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter(e => e.status === "available").length;
  const inUseEquipment = equipment.filter(e => e.status === "in-use").length;
  const maintenanceEquipment = equipment.filter(e => e.status === "maintenance").length;

  const formatDuration = (duration: string) => {
    const found = durationOptions.find(d => d.value === duration);
    return found?.label || duration;
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays} días`;
  };

  const getTimeRemaining = (endTime?: string) => {
    if (!endTime) return null;
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Tiempo excedido";
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins} min restantes`;
    return `${diffHours}h ${diffMins % 60}min restantes`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Usos de Equipos</h1>
        <Button 
          onClick={() => setIsRequestDialogOpen(true)}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm h-8 sm:h-9"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Solicitar Equipo Nuevo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Stats Cards - 4 columns on mobile, square on mobile */}
      <div className="grid grid-cols-4 gap-1 sm:gap-4">
        <Card className="border-l-2 sm:border-l-4 border-l-gray-500 aspect-square sm:aspect-auto">
          <CardContent className="p-1 sm:pt-6 sm:p-6 h-full flex items-center justify-center sm:block">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0 sm:gap-1">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight">Total</p>
                <p className="text-base sm:text-3xl font-bold text-gray-900">{totalEquipment}</p>
              </div>
              <div className="hidden sm:block p-3 bg-gray-100 rounded-full order-1 sm:order-2">
                <Package className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-2 sm:border-l-4 border-l-green-500 aspect-square sm:aspect-auto">
          <CardContent className="p-1 sm:pt-6 sm:p-6 h-full flex items-center justify-center sm:block">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0 sm:gap-1">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight">Disp.</p>
                <p className="text-base sm:text-3xl font-bold text-green-600">{availableEquipment}</p>
              </div>
              <div className="hidden sm:block p-3 bg-green-100 rounded-full order-1 sm:order-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-2 sm:border-l-4 border-l-blue-500 aspect-square sm:aspect-auto">
          <CardContent className="p-1 sm:pt-6 sm:p-6 h-full flex items-center justify-center sm:block">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0 sm:gap-1">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight">En Uso</p>
                <p className="text-base sm:text-3xl font-bold text-blue-600">{inUseEquipment}</p>
              </div>
              <div className="hidden sm:block p-3 bg-blue-100 rounded-full order-1 sm:order-2">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-2 sm:border-l-4 border-l-yellow-500 aspect-square sm:aspect-auto">
          <CardContent className="p-1 sm:pt-6 sm:p-6 h-full flex items-center justify-center sm:block">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-0 sm:gap-1">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-[9px] sm:text-sm text-gray-500 font-medium leading-tight">Mant.</p>
                <p className="text-base sm:text-3xl font-bold text-yellow-600">{maintenanceEquipment}</p>
              </div>
              <div className="hidden sm:block p-3 bg-yellow-100 rounded-full order-1 sm:order-2">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            <span className="hidden xs:inline">Equipos</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden xs:inline">Reservas</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">Historial</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Send className="h-4 w-4" />
            <span className="hidden xs:inline">Solicitudes</span>
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-3 sm:space-y-4">
          {/* Filters - Search first on mobile */}
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Search bar - Always on top on mobile */}
            <div className="relative w-full md:order-1 md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar equipos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 sm:h-10 text-sm"
              />
            </div>
            {/* Category filters */}
            <div className="flex gap-1 sm:gap-2 flex-wrap md:order-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`text-[10px] sm:text-sm px-2 sm:px-3 h-7 sm:h-9 ${selectedCategory === category ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                >
                  {category === "all" ? "Todos" : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Equipment Grid - 2 columns on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {filteredEquipment.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No se encontraron equipos
              </div>
            ) : (
              filteredEquipment.map((item) => {
                const Icon = categoryIcons[item.category] || Package;
                const isCurrentUserUsing = item.currentUserId === currentUserId;
                const canRelease = item.status === "in-use" && isCurrentUserUsing;
                const canUse = item.status === "available";
                
                return (
                  <Card key={item.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    item.status === "in-use" && isCurrentUserUsing ? "ring-2 ring-orange-500" : ""
                  }`}>
                    {/* Status Badge */}
                    <div className={`absolute top-0 right-0 px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-bl-lg ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </div>
                    
                    <CardContent className="p-0 sm:p-0">
                      {/* Equipment image or icon fallback */}
                      {item.image ? (
                        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-full aspect-[4/3] flex items-center justify-center ${
                          item.status === "available" ? "bg-green-50" :
                          item.status === "in-use" ? "bg-blue-50" : "bg-yellow-50"
                        }`}>
                          <Icon className={`h-10 w-10 sm:h-14 sm:w-14 ${
                            item.status === "available" ? "text-green-300" :
                            item.status === "in-use" ? "text-blue-300" : "text-yellow-300"
                          }`} />
                        </div>
                      )}
                      <div className="p-2 sm:p-4">
                        <h3 className="font-semibold text-gray-900 truncate text-xs sm:text-base">{item.name}</h3>
                        <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">{item.category}</p>
                        <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{item.location}</p>

                      {/* In-use info */}
                      {item.status === "in-use" && item.currentUserName && (
                        <div className="mt-2 sm:mt-3 p-1.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-blue-700">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="font-medium truncate">{item.currentUserName}</span>
                          </div>
                          {item.estimatedEndTime && (
                            <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs text-blue-600 mt-0.5 sm:mt-1">
                              <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                              <span className="truncate">{getTimeRemaining(item.estimatedEndTime)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-2 sm:mt-3 flex flex-col gap-1 sm:gap-2">
                        <div className="flex gap-1 sm:gap-2">
                          {canUse && (
                              <Button 
                                size="sm" 
                                className="flex-1 bg-green-600 hover:bg-green-700 text-[10px] sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
                                onClick={() => openUseDialog(item)}
                              >
                                <Play className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Usar</span>
                                <span className="sm:hidden ml-0.5">Usar</span>
                              </Button>
                          )}
                          {canRelease && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 text-[10px] sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
                              onClick={() => handleReleaseEquipment(item.id)}
                              disabled={isSubmitting}
                            >
                              <Square className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Dejar Disponible</span>
                              <span className="sm:hidden ml-0.5">Dejar</span>
                            </Button>
                          )}
                          {item.status !== "maintenance" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 text-[10px] sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
                              onClick={() => openReserveDialog(item)}
                            >
                              <CalendarCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Reservar</span>
                              <span className="sm:hidden ml-0.5">Reservar</span>
                            </Button>
                          )}
                        </div>
                        {item.status === "in-use" && !isCurrentUserUsing && !canRelease && (
                          <p className="text-[9px] sm:text-xs text-gray-500 italic text-center py-0.5">
                            <span className="hidden sm:inline">En uso por otra persona</span>
                            <span className="sm:hidden">En uso</span>
                          </p>
                        )}
                          {item.status === "maintenance" && !isAdmin && (
                            <p className="text-[9px] sm:text-xs text-yellow-600 italic flex-1 text-center py-1 sm:py-2">
                              <span className="hidden sm:inline">En mantenimiento</span>
                              <span className="sm:hidden">Mant.</span>
                            </p>
                          )}
                        </div>
                        
                        {/* Botón de mantenimiento - Solo para administradores */}
                        {isAdmin && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className={`w-full text-[8px] sm:text-sm h-6 sm:h-9 px-1 sm:px-3 ${
                              item.status === "maintenance" 
                                ? "border-green-500 text-green-600 hover:bg-green-50" 
                                : "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                            }`}
                            onClick={() => handleToggleMaintenance(item.id, item.status)}
                            disabled={isSubmitting || item.status === "in-use"}
                            title={item.status === "in-use" ? "No se puede poner en mantenimiento un equipo en uso" : ""}
                          >
                            <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="ml-0.5 sm:ml-1 truncate">{item.status === "maintenance" ? "Quitar Mant." : "Mantenimiento"}</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-blue-500" />
                Reservas de Equipos
              </CardTitle>
              <CardDescription>
                Reservas programadas de equipos. Selecciona un equipo disponible en la pestaña &quot;Equipos&quot; y presiona &quot;Reservar&quot;.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.filter(r => r.status === "pending" || r.status === "active").length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay reservas activas</p>
                  <p className="text-sm mt-1">Ve a la pestaña &quot;Equipos&quot; y presiona &quot;Reservar&quot; en un equipo disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations
                    .filter(r => r.status === "pending" || r.status === "active")
                    .map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{reservation.equipmentName}</span>
                          <Badge variant="outline" className={
                            reservation.status === "active"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }>
                            {reservation.status === "active" ? "Activa" : "Pendiente"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{reservation.description}&rdquo;</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {reservation.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {reservation.startTime} - {reservation.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {reservation.userName}
                          </span>
                        </div>
                      </div>
                      {(reservation.userId === currentUserId || isAdmin) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 flex-shrink-0"
                          onClick={() => handleCancelReservation(reservation.id)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reservas pasadas/canceladas */}
              {reservations.filter(r => r.status === "completed" || r.status === "cancelled").length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Historial de Reservas</h4>
                  <div className="space-y-2">
                    {reservations
                      .filter(r => r.status === "completed" || r.status === "cancelled")
                      .slice(0, 10)
                      .map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border bg-gray-50 border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">{reservation.equipmentName}</span>
                            <Badge variant="outline" className={
                              reservation.status === "completed"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }>
                              {reservation.status === "completed" ? "Completada" : "Cancelada"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{reservation.date}</span>
                            <span>{reservation.startTime} - {reservation.endTime}</span>
                            <span>{reservation.userName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                Historial de Uso de Equipos
              </CardTitle>
              <CardDescription>
                Registro completo de todos los usos de equipos en FabLab
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay registros de uso todavía</p>
                  <p className="text-sm mt-1">Los usos de equipos aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usageHistory.map((record) => (
                    <div 
                      key={record.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        record.status === "active" 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {/* Avatar/Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.status === "active" ? "bg-blue-200" : "bg-gray-200"
                      }`}>
                        <User className={`h-5 w-5 ${
                          record.status === "active" ? "text-blue-700" : "text-gray-600"
                        }`} />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{record.userName}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-700">{record.equipmentName}</span>
                          {record.status === "active" && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                              En uso
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {formatRelativeTime(record.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(record.estimatedDuration)}
                          </span>
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-600 mt-1 italic">&ldquo;{record.description}&rdquo;</p>
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className={`w-3 h-3 rounded-full ${
                        record.status === "active" ? "bg-blue-500 animate-pulse" : "bg-gray-400"
                      }`} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-orange-500" />
                Mis Solicitudes de Equipos
              </CardTitle>
              <CardDescription>
                Solicitudes de equipos que no están disponibles en FabLab
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes solicitudes de equipos</p>
                  <p className="text-sm mt-1">Tus solicitudes aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className={`flex flex-col p-4 rounded-lg border transition-colors space-y-2 ${
                        request.status === "approved" 
                          ? "border-green-200 bg-green-50/50" 
                          : request.status === "rejected"
                          ? "border-red-200 bg-red-50/50"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{request.equipmentName}</h4>
                          <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${requestStatusColors[request.status]}`}>
                          {requestStatusLabels[request.status]}
                        </span>
                      </div>
                      
                      {/* Notas de revisión si existen */}
                      {request.reviewNotes && (
                        <div className={`p-2 rounded text-sm ${
                          request.status === "approved" 
                            ? "bg-green-100 text-green-800" 
                            : request.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          <span className="font-medium">Nota del revisor: </span>
                          {request.reviewNotes}
                        </div>
                      )}
                      
                      {/* Revisado por */}
                      {request.reviewedBy && (
                        <p className="text-xs text-gray-500">
                          Revisado por: <span className="font-medium">{request.reviewedBy}</span>
                        </p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Cantidad: {request.quantity}
                        </span>
                        <span className="hidden sm:block">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(request.createdAt).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Use Equipment Dialog */}
      <Dialog open={isUseDialogOpen} onOpenChange={setIsUseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Usar Equipo
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment && (
                <span>Vas a usar: <strong>{selectedEquipment.name}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Tiempo estimado de uso *</Label>
              {loadingMaxUsage ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando disponibilidad...
                </div>
              ) : (
                <>
                  <Select
                    value={useForm.estimatedDuration}
                    onValueChange={(value) => setUseForm({ ...useForm, estimatedDuration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona duración" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => {
                        const durationMinMap: Record<string, number> = {
                          "30min": 30, "1h": 60, "2h": 120, "4h": 240,
                          "8h": 480, "1d": 1440, "2d": 2880, "1w": 10080,
                        };
                        const optionMin = durationMinMap[option.value] || 60;
                        const exceedsMax = maxUsageMinutes !== null && optionMin > maxUsageMinutes;
                        return (
                          <SelectItem key={option.value} value={option.value} disabled={exceedsMax}>
                            <span className="flex items-center gap-2">
                              {option.label}
                              {exceedsMax && (
                                <span className="text-[10px] text-red-500 font-medium">
                                  Reserva próxima
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {maxUsageMinutes !== null && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        Hay una reserva en {maxUsageMinutes < 60 ? `${maxUsageMinutes} min` : `${Math.floor(maxUsageMinutes / 60)}h${maxUsageMinutes % 60 > 0 ? ` ${maxUsageMinutes % 60}min` : ""}`}. 
                        El tiempo de uso está limitado.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="useDescription">
                Descripción del uso <span className="text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="useDescription"
                placeholder="¿Para qué vas a usar este equipo? Ej: Proyecto de IoT, práctica de soldadura..."
                value={useForm.description}
                onChange={(e) => setUseForm({ ...useForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUseDialogOpen(false);
                setSelectedEquipment(null);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUseEquipment}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Comenzar a Usar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Nuevo Equipo</DialogTitle>
            <DialogDescription>
              Solicita equipos tecnológicos que no están actualmente disponibles en FabLab
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentName">Nombre del Equipo *</Label>
              <Input
                id="equipmentName"
                placeholder="Ej: Arduino Mega 2560"
                value={requestForm.equipmentName}
                onChange={(e) => setRequestForm({ ...requestForm, equipmentName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Descripción breve del equipo"
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="justification">Justificación *</Label>
              <Textarea
                id="justification"
                placeholder="¿Por qué necesitas este equipo? ¿Para qué proyecto?"
                value={requestForm.justification}
                onChange={(e) => setRequestForm({ ...requestForm, justification: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRequestDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reserve Equipment Dialog */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              Reservar Equipo
            </DialogTitle>
            <DialogDescription>
              {reserveEquipment && (
                <span>Reservar: <strong>{reserveEquipment.name}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <DatePicker
                value={reserveForm.date}
                onChange={handleReserveDateChange}
                placeholder="Seleccionar fecha"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>

            {/* Busy slots indicator */}
            {reserveForm.date && busySlots.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-800 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Horarios ocupados este día:
                </p>
                <div className="space-y-1">
                  {busySlots.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-700">
                      <span className={`inline-block w-2 h-2 rounded-full ${b.type === "in-use" ? "bg-blue-500" : "bg-amber-500"}`} />
                      <span className="font-medium">{b.startTime} - {b.endTime}</span>
                      <span className="text-amber-600">
                        {b.type === "in-use" ? `En uso (${b.userName})` : `Reservado (${b.userName})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingSlots && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando disponibilidad...
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reserveStartTime">Hora Inicio *</Label>
                <Select
                  value={reserveForm.startTime}
                  onValueChange={(value) => setReserveForm({ ...reserveForm, startTime: value, endTime: "" })}
                  disabled={!reserveForm.date}
                >
                  <SelectTrigger id="reserveStartTime">
                    <SelectValue placeholder={reserveForm.date ? "Inicio" : "Elige fecha"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStartSlots().map((slot) => (
                      <SelectItem key={slot.value} value={slot.value} disabled={slot.disabled}>
                        <span className="flex items-center gap-2">
                          {slot.value}
                          {slot.disabled && (
                            <span className="text-[10px] text-red-500 font-medium">
                              {slot.reason === "Menos de 1h de anticipación" ? "⏱ Mín. 1h" : "🔴 Ocupado"}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserveEndTime">Hora Fin *</Label>
                <Select
                  value={reserveForm.endTime}
                  onValueChange={(value) => setReserveForm({ ...reserveForm, endTime: value })}
                  disabled={!reserveForm.startTime}
                >
                  <SelectTrigger id="reserveEndTime">
                    <SelectValue placeholder={reserveForm.startTime ? "Fin" : "Elige inicio"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableEndSlots().map((slot) => (
                      <SelectItem key={slot.value} value={slot.value} disabled={slot.disabled}>
                        <span className="flex items-center gap-2">
                          {slot.value}
                          {slot.disabled && (
                            <span className="text-[10px] text-red-500 font-medium">🔴 Conflicto</span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 1-hour anticipation warning */}
            {reserveForm.date && reserveForm.startTime && isSlotTooSoon(reserveForm.startTime) && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Debes reservar con al menos 1 hora de anticipación
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="reserveDescription">
                Descripción / Motivo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reserveDescription"
                placeholder="Describe para qué necesitas reservar este equipo (obligatorio)"
                value={reserveForm.description}
                onChange={(e) => setReserveForm({ ...reserveForm, description: e.target.value })}
                rows={3}
                className={!reserveForm.description.trim() ? "border-red-300 focus:border-red-500" : ""}
              />
              {!reserveForm.description.trim() && (
                <p className="text-xs text-red-500">La descripción es obligatoria</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReserveDialogOpen(false);
                setReserveEquipment(null);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReserveEquipment}
              disabled={isSubmitting || !reserveForm.description.trim() || !reserveForm.date || !reserveForm.startTime || !reserveForm.endTime}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reservando...
                </>
              ) : (
                <>
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}