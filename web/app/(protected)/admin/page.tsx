import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
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
  FileIcon,
  PrinterIcon,
  UserCircle,
  UserPlus,
  Play,
  Mail,
  ClipboardList,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getDashboardMetrics, getActiveProjects, getActiveSpecialists, getRecentActivity, type RecentActivityItem } from "./actions";

// Marcar como página dinámica para evitar pre-renderizado
export const dynamic = 'force-dynamic';

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
  const activeSpecialistsList = await getActiveSpecialists();
  const recentActivities = await getRecentActivity();

  // Calcular porcentajes
  const storageUsagePercent = metrics.storageTotal > 0
    ? Math.round((metrics.storageUsed / metrics.storageTotal) * 100)
    : 0;

  // Función para obtener el ícono según el tipo de actividad
  function getActivityIcon(activity: RecentActivityItem) {
    switch (activity.type) {
      case "equipment_usage":
        return activity.metadata?.isActive ? Play : PrinterIcon;
      case "new_member":
        return UserPlus;
      case "project":
        return FileIcon;
      default:
        return Activity;
    }
  }

  // Función para obtener el color según el tipo de actividad
  function getActivityColor(activity: RecentActivityItem) {
    switch (activity.type) {
      case "equipment_usage":
        return activity.metadata?.isActive 
          ? "bg-green-100 text-green-600" 
          : "bg-purple-100 text-purple-600";
      case "new_member":
        return "bg-blue-100 text-blue-600";
      case "project":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-green-600 font-medium hidden sm:inline">Sistema Operativo</span>
          <span className="text-green-600 font-medium sm:hidden">Online</span>
        </div>
      </div>

      {/* Stats Grid - 4 columns on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Proyectos Activos */}
        <Link href="/admin/content/projects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
                    <span className="hidden sm:inline">+{metrics.projectsTrend} nuevo{metrics.projectsTrend !== 1 ? 's' : ''} este mes</span>
                    <span className="sm:hidden">+{metrics.projectsTrend} este mes</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{metrics.activeProjects} publicado{metrics.activeProjects !== 1 ? 's' : ''} en total</span>
                    <span className="sm:hidden">Publicados</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Equipos */}
        <Link href="/admin/inventory/items">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
        </Link>

        {/* Insumos / Inventario */}
        <Link href="/admin/inventory/items?tab=inventory">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
                    <span className="hidden sm:inline">{metrics.lowStockItems} con bajo stock · {metrics.totalInventoryStock} uds. total</span>
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
        </Link>

        {/* Equipo / Especialistas */}
        <Link href="/admin/content/team">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
                <span className="sm:hidden">En equipo</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Contacto - con punto de alerta si hay mensajes nuevos */}
        <Link href="/admin/contacto">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="relative">
                  <Mail className="h-4 w-4 text-sky-500" />
                  {metrics.newContactMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold mb-1">{metrics.newContactMessages}</div>
              <div className="flex items-center text-xs text-sky-600">
                {metrics.newContactMessages > 0 ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{metrics.newContactMessages === 1 ? 'Mensaje nuevo por leer' : 'Mensajes nuevos por leer'}</span>
                    <span className="sm:hidden">Nuevos</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Todo al día</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Solicitudes - con punto de alerta si hay pendientes */}
        <Link href="/admin/solicitudes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="relative">
                  <ClipboardList className="h-4 w-4 text-yellow-500" />
                  {metrics.pendingSolicitudes > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                Solicitudes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold mb-1">{metrics.pendingSolicitudes}</div>
              <div className="flex items-center text-xs text-yellow-600">
                {metrics.pendingSolicitudes > 0 ? (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{metrics.pendingSolicitudes === 1 ? 'Solicitud pendiente' : 'Solicitudes pendientes'}</span>
                    <span className="sm:hidden">Pendientes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Sin pendientes</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Reservas Salas */}
        <Link href="/admin/reservas-salas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-500" />
                Reservas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold mb-1">Salas</div>
              <div className="flex items-center text-xs text-teal-600">
                <Clock className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Reservar salas del FabLab</span>
                <span className="sm:hidden">Reservar</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Almacenamiento */}
        <Link href="/admin/media">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="p-3 sm:pb-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 flex items-center gap-2">
                <CloudUpload className="h-4 w-4 text-indigo-500" />
                Archivos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-bold mb-1">{metrics.storageFiles}</div>
              <div className="flex items-center text-xs text-indigo-600">
                <CloudUpload className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Imágenes y archivos subidos</span>
                <span className="sm:hidden">Subidos</span>
              </div>
            </CardContent>
          </Card>
        </Link>

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

      {/* Especialistas Activos List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Especialistas en el Equipo</CardTitle>
            <p className="text-sm text-gray-500">Miembros visibles en /equipo</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/content/team">
              <Users className="h-4 w-4 mr-2" />
              Gestionar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activeSpecialistsList.length === 0 ? (
            <div className="text-center py-8">
              <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay especialistas activos</p>
              <p className="text-gray-400 text-xs mt-1">Agrega miembros desde la sección de Equipo</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/admin/content/team">
                  Agregar especialista
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {activeSpecialistsList.slice(0, 6).map((specialist) => (
                <div key={specialist.id} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {specialist.image ? (
                    <Image
                      src={specialist.image}
                      alt={specialist.name || 'Especialista'}
                      width={64}
                      height={64}
                      className="w-16 h-16 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm sm:text-sm flex-shrink-0">
                      {specialist.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                  )}
                  <div className="w-full min-w-0 text-center sm:text-left">
                    <p className="font-medium text-xs sm:text-sm truncate px-1">{specialist.name}</p>
                    <p className="hidden sm:block text-xs text-gray-500 truncate">{specialist.role || specialist.specialty || 'Especialista'}</p>
                  </div>
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    specialist.category === 'leadership' 
                      ? 'bg-purple-100 text-purple-700'
                      : specialist.category === 'specialist'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {specialist.category === 'leadership' ? 'Directivo' : 
                     specialist.category === 'specialist' ? 'Especialista' : 'Colaborador'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeSpecialistsList.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/content/team">
                  Ver todos ({activeSpecialistsList.length})
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
            <p className="text-sm text-gray-500">Últimas acciones en el sistema</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/equipment-usage">
              <Clock className="h-4 w-4 mr-2" />
              Ver todo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay actividad reciente</p>
              <p className="text-gray-400 text-xs mt-1">Las acciones del sistema aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity);
                const activityColor = getActivityColor(activity);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    {/* Avatar del usuario o ícono */}
                    <div className="relative">
                      {activity.userAvatar ? (
                        <Image
                          src={activity.userAvatar}
                          alt={activity.user}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                          {activity.user?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                      )}
                      {/* Badge de tipo de actividad */}
                      <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${activityColor}`}>
                        <ActivityIcon className="h-3 w-3" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{activity.user}</p>
                        {activity.metadata?.isActive && activity.metadata?.duration && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {activity.metadata.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
