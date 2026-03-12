import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import {
  Users,
  Activity,
  FileText,
  Wrench,
  Clock,
  CloudUpload,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Boxes,
  Mail,
  ClipboardList,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Zap,
  Home,
} from "lucide-react";
import { Button } from "@/shared/ui/buttons/button";
import Link from "next/link";
import {
  getPublicDashboardMetrics,
  getPublicActiveProjects,
  getPublicActiveSpecialists,
  getPublicRecentActivity,
} from "./actions";
import { PanelCalendarWidget } from "./calendar-widget";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de Control - FabLab INACAP",
  description: "Visualización en tiempo real del estado del FabLab: proyectos, equipos, calendario y actividad.",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default async function PanelPage() {
  const metrics = await getPublicDashboardMetrics();
  const activeProjectsList = await getPublicActiveProjects();
  const activeSpecialistsList = await getPublicActiveSpecialists();
  const recentActivities = await getPublicRecentActivity();

  const storageUsagePercent =
    metrics.storageTotal > 0
      ? Math.round((metrics.storageUsed / metrics.storageTotal) * 100)
      : 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 pt-28 sm:p-6 sm:pt-32 lg:p-8 lg:pt-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-sm text-gray-500 capitalize mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm bg-green-50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-700 font-medium">Sistema Operativo</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-1" />
              Ir al sitio
            </Link>
          </Button>
        </div>
      </div>

      {/* ============================================ */}
      {/* MÉTRICAS CLAVE - Primera fila (4 cards)     */}
      {/* ============================================ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Métricas Clave</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Proyectos Activos */}
          <Card className="h-full border-l-4 border-l-blue-500">
            <CardHeader className="p-3 sm:pb-2 sm:p-5">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                <FileText className="h-4 w-4 text-blue-500" />
                Proyectos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{metrics.activeProjects}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                {metrics.projectsTrend > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+{metrics.projectsTrend} este mes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Publicados</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipos */}
          <Card className="h-full border-l-4 border-l-purple-500">
            <CardHeader className="p-3 sm:pb-2 sm:p-5">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                <Wrench className="h-4 w-4 text-purple-500" />
                Equipos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{metrics.totalEquipment}</div>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <Activity className="h-3 w-3 mr-1" />
                <span>{metrics.equipmentInUse} en uso</span>
              </div>
            </CardContent>
          </Card>

          {/* Insumos */}
          <Card className="h-full border-l-4 border-l-orange-500">
            <CardHeader className="p-3 sm:pb-2 sm:p-5">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                <Boxes className="h-4 w-4 text-orange-500" />
                Insumos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{metrics.totalInventoryItems}</div>
              <div className="flex items-center text-xs mt-1">
                {metrics.lowStockItems > 0 ? (
                  <span className="text-orange-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {metrics.lowStockItems} bajo stock
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {metrics.totalInventoryStock} uds. en stock
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipo/Especialistas */}
          <Card className="h-full border-l-4 border-l-green-500">
            <CardHeader className="p-3 sm:pb-2 sm:p-5">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                <Users className="h-4 w-4 text-green-500" />
                Equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                {metrics.activeSpecialists}
                <span className="text-lg text-gray-400 font-normal">/{metrics.totalSpecialists}</span>
              </div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <Users className="h-3 w-3 mr-1" />
                <span>Visibles en web</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* SEGUNDA FILA: Alertas + Métricas secundarias */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Contacto */}
        <Card className="h-full">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${metrics.newContactMessages > 0 ? 'bg-red-100' : 'bg-sky-100'}`}>
              <Mail className={`h-5 w-5 ${metrics.newContactMessages > 0 ? 'text-red-600' : 'text-sky-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.newContactMessages}</p>
              <p className="text-xs text-gray-500">Mensajes nuevos</p>
            </div>
            {metrics.newContactMessages > 0 && (
              <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Solicitudes */}
        <Card className="h-full">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${metrics.pendingSolicitudes > 0 ? 'bg-amber-100' : 'bg-yellow-50'}`}>
              <ClipboardList className={`h-5 w-5 ${metrics.pendingSolicitudes > 0 ? 'text-amber-600' : 'text-yellow-500'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.pendingSolicitudes}</p>
              <p className="text-xs text-gray-500">Solicitudes pendientes</p>
            </div>
            {metrics.pendingSolicitudes > 0 && (
              <span className="ml-auto w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Reservas */}
        <Card className="h-full">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100">
              <Clock className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">Salas</p>
              <p className="text-xs text-gray-500">Reservar salas</p>
            </div>
          </CardContent>
        </Card>

        {/* Almacenamiento */}
        <Card className="h-full">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100">
              <CloudUpload className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.storageFiles}</p>
              <p className="text-xs text-gray-500">Archivos subidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* ZONA PRINCIPAL: Calendario + Widgets         */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendario - Ocupa 2 columnas */}
        <div className="lg:col-span-2">
          <PanelCalendarWidget />
        </div>

        {/* Widgets laterales */}
        <div className="space-y-4 sm:space-y-6">
          {/* Widget: Resumen Rápido */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{metrics.equipmentInUse}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Equipos en uso</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{metrics.activeProjects}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Proyectos</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{metrics.newContactMessages}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Mensajes</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{metrics.pendingSolicitudes}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Solicitudes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget: Estado del Inventario */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-orange-500" />
                Estado del Inventario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Barra de equipos en uso */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Equipos en uso</span>
                  <span className="font-medium">{metrics.equipmentInUse}/{metrics.totalEquipment}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.totalEquipment > 0 ? (metrics.equipmentInUse / metrics.totalEquipment) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {/* Barra de stock */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Stock disponible</span>
                  <span className="font-medium">{metrics.totalInventoryStock} uds.</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${metrics.lowStockItems > 0 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${metrics.lowStockItems > 0 ? Math.max(30, 100 - (metrics.lowStockItems / Math.max(metrics.totalInventoryItems, 1)) * 100) : 100}%` }}
                  />
                </div>
              </div>
              {/* Barra de almacenamiento */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Almacenamiento</span>
                  <span className="font-medium">{formatBytes(metrics.storageUsed)} / {formatBytes(metrics.storageTotal)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${storageUsagePercent > 80 ? 'bg-red-500' : storageUsagePercent > 60 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                    style={{ width: `${storageUsagePercent}%` }}
                  />
                </div>
              </div>
              {metrics.lowStockItems > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 mt-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-700">
                      <span className="font-medium">{metrics.lowStockItems} insumo{metrics.lowStockItems !== 1 ? 's' : ''}</span> con bajo stock
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Widget: Actividad Reciente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin actividad reciente</p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 mt-0.5">
                        {act.user?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{act.title}</p>
                        <p className="text-[10px] text-gray-400">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
