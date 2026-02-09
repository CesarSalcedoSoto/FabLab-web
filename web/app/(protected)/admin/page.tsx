import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { 
  Package, 
  Users, 
  Activity, 
  FileText, 
  Wrench,
  Clock,
  CloudUpload,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileIcon,
  BookOpenIcon,
  PrinterIcon,
  UploadIcon
} from "lucide-react";
import Link from "next/link";
import { getDashboardMetrics, getActiveProjects } from "./actions";

// Formateador de bytes a formato legible
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default async function AdminDashboardPage() {
  // Obtener métricas reales de la base de datos
  const metrics = await getDashboardMetrics();
  const activeProjectsList = await getActiveProjects();

  // Calcular porcentajes
  const equipmentUsagePercent = metrics.totalEquipment > 0 
    ? Math.round((metrics.equipmentInUse / metrics.totalEquipment) * 100) 
    : 0;

  const storageUsagePercent = metrics.storageTotal > 0
    ? Math.round((metrics.storageUsed / metrics.storageTotal) * 100)
    : 0;

  const recentActivities = [
    {
      id: 1,
      title: "Proyecto Prototipo PCB iniciado",
      user: "Ana García",
      time: "Hace 2 horas",
      icon: FileIcon,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: 2,
      title: "Impresora 3D Prusa reservada",
      user: "Carlos López",
      time: "Hace 3 horas",
      icon: PrinterIcon,
      color: "bg-purple-100 text-purple-600"
    },
    {
      id: 3,
      title: "Filamento PLA reabastecido",
      user: "Admin",
      time: "Hace 5 horas",
      icon: CheckCircle,
      color: "bg-green-100 text-green-600"
    },
    {
      id: 4,
      title: "Archivo Design_v3.pdf subido",
      user: "María Rodríguez",
      time: "Hace 1 día",
      icon: UploadIcon,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-600 font-medium">Sistema Operativo</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Proyectos Activos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{metrics.activeProjects}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{metrics.projectsTrend}% vs. mes anterior
            </div>
          </CardContent>
        </Card>

        {/* Equipos en Inventario */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Equipos en Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {metrics.equipmentInUse}/{metrics.totalEquipment}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300" 
                style={{ width: `${equipmentUsagePercent}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{equipmentUsagePercent}% activos</div>
          </CardContent>
        </Card>

        {/* Items Bajo Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Items Bajo Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{metrics.lowStockItems}</div>
            <div className="flex items-center text-xs text-orange-600">
              {metrics.lowStockItems > 0 ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requiere atención
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Stock adecuado
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Especialistas Activos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Especialistas Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {metrics.activeSpecialists}/{metrics.totalSpecialists}
            </div>
            <div className="flex items-center text-xs text-green-600">
              {metrics.teamImprovement > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{metrics.teamImprovement}% mejora del equipo
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Equipo completo
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Almacenamiento en Nube */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Almacenamiento en Nube</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{metrics.storageFiles}</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  storageUsagePercent > 90 ? 'bg-red-500' : 
                  storageUsagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${storageUsagePercent}%` }}
              ></div>
            </div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <CloudUpload className="h-3 w-3 mr-1" />
              {formatBytes(metrics.storageUsed)} de {formatBytes(metrics.storageTotal)}
            </div>
          </CardContent>
        </Card>

        {/* Actividad del Mes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Actividad del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {metrics.activeProjects + metrics.activeSpecialists}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <Activity className="h-3 w-3 mr-1" />
              Proyectos + Especialistas activos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proyectos Activos List */}
      {activeProjectsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Proyectos en Curso</CardTitle>
            <p className="text-sm text-gray-500">Proyectos actualmente activos</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjectsList.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{project.title}</p>
                      {project.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Activo
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
          <p className="text-sm text-gray-500">Últimas acciones en el sistema</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.user}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Acciones Rápidas</CardTitle>
          <p className="text-sm text-gray-500">Accesos directos a funciones comunes</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/content/projects">
                <FileText className="h-4 w-4 mr-2" />
                Ver Proyectos
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/inventory/items">
                <Wrench className="h-4 w-4 mr-2" />
                Ver Equipos
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/content/team">
                <Users className="h-4 w-4 mr-2" />
                Ver Especialistas
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <Link href="/admin/inventory">
                <Package className="h-4 w-4 mr-2" />
                Ver Inventario
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
