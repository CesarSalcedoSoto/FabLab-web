import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import {
  Activity,
  Home,
  FileText,
  Wrench,
  Boxes,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/buttons/button";
import Link from "next/link";
import {
  getPublicDashboardMetrics,
  getPublicRecentActivity,
} from "./actions";
import { PanelCalendarWidget } from "./calendar-widget";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de Control - FabLab INACAP",
  description: "Visualización en tiempo real del estado del FabLab: proyectos, equipos, calendario y actividad.",
};

export default async function PanelPage() {
  noStore();
  const [metrics, recentActivities] = await Promise.all([
    getPublicDashboardMetrics(),
    getPublicRecentActivity(),
  ]);

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

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="h-full">
          <CardHeader className="p-3 sm:pb-2 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Proyectos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{metrics.activeProjects}</div>
            <div className="flex items-center text-xs text-green-600">
              {metrics.projectsTrend > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">+{metrics.projectsTrend} nuevo{metrics.projectsTrend !== 1 ? "s" : ""} este mes</span>
                  <span className="sm:hidden">+{metrics.projectsTrend} este mes</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 mr-1" />
                  <span>Sin cambios este mes</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="p-3 sm:pb-2 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-purple-500" />
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{metrics.totalEquipment}</div>
            <div className="flex items-center text-xs text-purple-600">
              <Activity className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">{metrics.equipmentInUse} en uso actualmente</span>
              <span className="sm:hidden">{metrics.equipmentInUse} en uso</span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="p-3 sm:pb-2 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-orange-500" />
              Insumos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{metrics.totalInventoryItems}</div>
            <div className="flex items-center text-xs text-orange-600">
              {metrics.lowStockItems > 0 ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{metrics.lowStockItems} con bajo stock</span>
                  <span className="sm:hidden">{metrics.lowStockItems} bajo stock</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">{metrics.totalInventoryStock} unidades en stock</span>
                  <span className="sm:hidden">{metrics.totalInventoryStock} uds.</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="p-3 sm:pb-2 sm:p-6">
            <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {metrics.activeSpecialists}<span className="text-base sm:text-lg text-gray-400 font-normal">/{metrics.totalSpecialists}</span>
            </div>
            <div className="flex items-center text-xs text-green-600">
              <Users className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Miembros visibles en web</span>
              <span className="sm:hidden">Visibles</span>
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
          {/* Widget: Actividades del Día */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Actividades del Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin actividades registradas hoy</p>
              ) : (
                <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                  {recentActivities.map((act) => (
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
