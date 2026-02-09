"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
  ChevronLeft,
  ChevronRight,
  X,
  CalendarPlus,
} from "lucide-react";
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
  getReservationsForDate,
  getAllReservations,
  createReservation,
  cancelReservation,
  type EquipmentReservation,
} from "./actions";

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
  
  // Reservation state
  const [reservations, setReservations] = useState<EquipmentReservation[]>([]);
  const [allReservations, setAllReservations] = useState<EquipmentReservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEquipForReserve, setSelectedEquipForReserve] = useState<Equipment | null>(null);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    startTime: "09:00",
    endTime: "10:00",
    description: "",
  });
  
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [equipmentData, requestsData, historyData, userId, adminStatus, allRes] = await Promise.all([
        getActiveEquipment(),
        getEquipmentRequests(),
        getUsageHistory(),
        getCurrentUserId(),
        getCurrentUserIsAdmin(),
        getAllReservations(),
      ]);
      setEquipment(equipmentData);
      setRequests(requestsData);
      setUsageHistory(historyData);
      setCurrentUserId(userId);
      setIsAdmin(adminStatus);
      setAllReservations(allRes);
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

  // ===================== RESERVATION HANDLERS =====================
  
  const loadReservationsForDate = async (equipmentId: string, date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await getReservationsForDate(equipmentId, dateStr);
      setReservations(res);
    } catch {
      setReservations([]);
    }
  };

  const handleOpenReserveDialog = (item: Equipment) => {
    setSelectedEquipForReserve(item);
    setSelectedDate(new Date());
    setReserveForm({ startTime: "09:00", endTime: "10:00", description: "" });
    setIsReserveDialogOpen(true);
    loadReservationsForDate(item.id, new Date());
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (selectedEquipForReserve) {
      loadReservationsForDate(selectedEquipForReserve.id, date);
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedEquipForReserve) return;

    try {
      setIsSubmitting(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const result = await createReservation({
        equipmentId: selectedEquipForReserve.id,
        equipmentName: selectedEquipForReserve.name,
        date: dateStr,
        startTime: reserveForm.startTime,
        endTime: reserveForm.endTime,
        description: reserveForm.description || undefined,
      });

      if (result.success) {
        toast.success(`Reserva creada para ${selectedEquipForReserve.name}`);
        loadReservationsForDate(selectedEquipForReserve.id, selectedDate);
        loadData();
        setReserveForm({ startTime: "09:00", endTime: "10:00", description: "" });
      } else {
        toast.error(result.error || "Error al crear la reserva");
      }
    } catch {
      toast.error("Error al crear la reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      setIsSubmitting(true);
      const result = await cancelReservation(reservationId);
      if (result.success) {
        toast.success("Reserva cancelada");
        if (selectedEquipForReserve) {
          loadReservationsForDate(selectedEquipForReserve.id, selectedDate);
        }
        loadData();
      } else {
        toast.error(result.error || "Error al cancelar");
      }
    } catch {
      toast.error("Error al cancelar la reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTimeSlotOccupied = (slot: string) => {
    return reservations.some(r => slot >= r.startTime && slot < r.endTime);
  };

  const getSlotReservation = (slot: string) => {
    return reservations.find(r => slot >= r.startTime && slot < r.endTime);
  };

  const timeSlots = (() => {
    const slots: string[] = [];
    for (let h = 7; h <= 22; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 22) slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    slots.push('22:30');
    return slots;
  })();

  // ===================== END RESERVATION HANDLERS =====================

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

  const openUseDialog = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsUseDialogOpen(true);
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
            <CalendarPlus className="h-4 w-4" />
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
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                            quality={75}
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
                              <span className="hidden sm:inline">Usar Equipo</span>
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
                          {item.status === "in-use" && !isCurrentUserUsing && (
                            <p className="text-[9px] sm:text-xs text-gray-500 italic flex-1 text-center py-1 sm:py-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Equipment list for reserving */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  Seleccionar Equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {equipment.filter(e => e.status !== "maintenance").map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleOpenReserveDialog(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                      selectedEquipForReserve?.id === item.id 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" quality={70} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <CalendarPlus className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Right: Recent reservations / Activity */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-orange-500" />
                  Actividad Reciente de Reservas
                </CardTitle>
                <CardDescription>Últimas reservas realizadas en el FabLab</CardDescription>
              </CardHeader>
              <CardContent>
                {allReservations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay reservas todavía</p>
                    <p className="text-sm mt-1">Selecciona un equipo para reservar</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {allReservations.map((res) => {
                      const resDate = new Date(res.date);
                      const isPast = resDate < new Date(new Date().toDateString());
                      const isOwn = res.userId === currentUserId;

                      return (
                        <div 
                          key={res.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            res.status === "cancelled" 
                              ? "bg-gray-50 border-gray-200 opacity-60"
                              : isPast 
                              ? "bg-gray-50 border-gray-200"
                              : "bg-orange-50 border-orange-200"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            res.status === "cancelled" ? "bg-gray-200" : isPast ? "bg-gray-200" : "bg-orange-200"
                          }`}>
                            <Calendar className={`h-5 w-5 ${
                              res.status === "cancelled" ? "text-gray-500" : isPast ? "text-gray-600" : "text-orange-700"
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900">{res.userName}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-700">{res.equipmentName}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {resDate.toLocaleDateString('es-CL')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {res.startTime} - {res.endTime}
                              </span>
                            </div>
                            {res.description && (
                              <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{res.description}&rdquo;</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {res.status === "cancelled" ? (
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">Cancelada</span>
                            ) : !isPast && isOwn ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancelReservation(res.id)}
                                disabled={isSubmitting}
                                title="Cancelar reserva"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : !isPast && isAdmin ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancelReservation(res.id)}
                                disabled={isSubmitting}
                                title="Cancelar reserva (admin)"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <div className={`w-2 h-2 rounded-full ${
                              res.status === "cancelled" ? "bg-gray-400" : isPast ? "bg-gray-400" : "bg-orange-500"
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
              <Select
                value={useForm.estimatedDuration}
                onValueChange={(value) => setUseForm({ ...useForm, estimatedDuration: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona duración" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Reservation Dialog */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-orange-500" />
              Reservar Equipo
            </DialogTitle>
            <DialogDescription>
              {selectedEquipForReserve && (
                <span>Equipo: <strong>{selectedEquipForReserve.name}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Mini Calendar */}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <MiniCalendar 
                selectedDate={selectedDate} 
                onDateChange={handleDateChange} 
              />
            </div>

            {/* Time Slots Visual */}
            <div className="space-y-2">
              <Label>Horario disponible — {selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                {timeSlots.map((slot) => {
                  const occupied = isTimeSlotOccupied(slot);
                  const slotRes = getSlotReservation(slot);
                  const isSelected = slot >= reserveForm.startTime && slot < reserveForm.endTime;

                  return (
                    <button
                      key={slot}
                      disabled={occupied}
                      onClick={() => {
                        // Click to set start, shift end by 1 hour
                        const [h, m] = slot.split(':').map(Number);
                        const endH = h + 1;
                        const endTime = endH > 22 ? "22:30" : `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        setReserveForm(prev => ({ ...prev, startTime: slot, endTime }));
                      }}
                      className={`text-xs py-1.5 px-1 rounded-md border transition-all ${
                        occupied 
                          ? "bg-red-100 border-red-300 text-red-600 cursor-not-allowed line-through" 
                          : isSelected
                          ? "bg-orange-500 border-orange-600 text-white font-medium"
                          : "bg-white border-gray-200 text-gray-700 hover:border-orange-400 hover:bg-orange-50"
                      }`}
                      title={occupied && slotRes ? `Reservado por ${slotRes.userName}` : `Disponible: ${slot}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-200" /> Disponible</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Ocupado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> Selección</span>
              </div>
            </div>

            {/* Manual time selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Hora inicio</Label>
                <Select
                  value={reserveForm.startTime}
                  onValueChange={(v) => setReserveForm(prev => ({ ...prev, startTime: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hora fin</Label>
                <Select
                  value={reserveForm.endTime}
                  onValueChange={(v) => setReserveForm(prev => ({ ...prev, endTime: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeSlots.filter(s => s > reserveForm.startTime).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    <SelectItem value="22:30">22:30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción <span className="text-gray-400">(opcional)</span></Label>
              <Textarea
                placeholder="¿Para qué vas a usar el equipo? Ej: Proyecto final, práctica de impresión 3D..."
                value={reserveForm.description}
                onChange={(e) => setReserveForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Existing reservations for this day */}
            {reservations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Reservas existentes este día:</Label>
                <div className="space-y-1">
                  {reservations.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg border border-red-200 text-sm">
                      <span className="text-red-700 font-medium">{r.startTime} - {r.endTime}</span>
                      <span className="text-red-600 text-xs">{r.userName}</span>
                      {(r.userId === currentUserId || isAdmin) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleCancelReservation(r.id)}
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReserveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateReservation}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reservando...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4 mr-2" />
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

// ===================== MINI CALENDAR COMPONENT =====================

function MiniCalendar({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));
  
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  // Pad start
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{monthNames[month]} {year}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(d => (
          <span key={d} className="text-xs text-gray-500 font-medium py-1">{d}</span>
        ))}
        {days.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const date = new Date(year, month, day);
          const isToday = date.getTime() === today.getTime();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isPast = date < today;
          
          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => onDateChange(date)}
              className={`text-xs py-1.5 rounded-md transition-all ${
                isSelected
                  ? "bg-orange-500 text-white font-bold"
                  : isToday
                  ? "bg-orange-100 text-orange-700 font-semibold"
                  : isPast
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-orange-50"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}