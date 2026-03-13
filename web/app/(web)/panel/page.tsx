import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import {
  Activity,
  Home,
} from "lucide-react";
import { Button } from "@/shared/ui/buttons/button";
import Link from "next/link";
import {
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
  const recentActivities = await getPublicRecentActivity();

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
