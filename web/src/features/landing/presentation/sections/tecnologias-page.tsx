"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Printer,
  Cpu,
  Wrench,
  Zap,
  Box,
  Layers,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { usePreloadImages } from "@/shared/hooks";

// ============================================================================
// TYPES
// ============================================================================

type NivelCertificacion = "Básico" | "Nivel 1" | "Nivel 2" | "Nivel 3" | "Especializado";
type CategoriaEquipo = 
  | "Fabricación Aditiva"
  | "Fabricación Sustractiva"
  | "Electrónica y Programación"
  | "Herramientas y Montaje";

interface Equipo {
  id: string;
  nombre: string;
  categoria: CategoriaEquipo;
  imagen: string;
  marca: string;
  modelo: string;
  areaTrabajo: string;
  materialesCompatibles: string[];
  certificacionRequerida: NivelCertificacion;
  descripcion: string;
  estado: "Disponible" | "En uso" | "Mantenimiento";
  caracteristicas?: string[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const categoriasEquipo: CategoriaEquipo[] = [
  "Fabricación Aditiva",
  "Fabricación Sustractiva",
  "Electrónica y Programación",
  "Herramientas y Montaje",
];

const iconosPorCategoria: Record<CategoriaEquipo, React.ComponentType<{ className?: string }>> = {
  "Fabricación Aditiva": Printer,
  "Fabricación Sustractiva": Layers,
  "Electrónica y Programación": Cpu,
  "Herramientas y Montaje": Wrench,
};

const coloresPorCategoria: Record<CategoriaEquipo, string> = {
  "Fabricación Aditiva": "from-blue-500 to-blue-600",
  "Fabricación Sustractiva": "from-red-500 to-red-600",
  "Electrónica y Programación": "from-green-500 to-green-600",
  "Herramientas y Montaje": "from-amber-500 to-amber-600",
};

const bgPorCategoria: Record<CategoriaEquipo, string> = {
  "Fabricación Aditiva": "bg-blue-50 border-blue-200",
  "Fabricación Sustractiva": "bg-red-50 border-red-200",
  "Electrónica y Programación": "bg-green-50 border-green-200",
  "Herramientas y Montaje": "bg-amber-50 border-amber-200",
};

const coloresCertificacion: Record<NivelCertificacion, string> = {
  "Básico": "bg-gray-100 text-gray-700",
  "Nivel 1": "bg-green-100 text-green-700",
  "Nivel 2": "bg-yellow-100 text-yellow-700",
  "Nivel 3": "bg-orange-100 text-orange-700",
  "Especializado": "bg-red-100 text-red-700",
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Hero Section
function HeroSection() {
  return (
    <section className="relative w-full min-h-[40vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative Icons */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute top-20 left-[10%]"
        >
          <Printer className="w-24 h-24 text-blue-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute top-32 right-[15%]"
        >
          <Cpu className="w-20 h-20 text-green-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-20 left-[20%]"
        >
          <Layers className="w-16 h-16 text-red-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="absolute bottom-32 right-[10%]"
        >
          <Wrench className="w-20 h-20 text-amber-400" />
        </motion.div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Nuestras{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Tecnologías
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Explora nuestro inventario completo de máquinas y equipos disponibles para 
            tus proyectos de fabricación digital, electrónica y prototipado.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Category Tabs
interface CategoryTabsProps {
  categoriaActiva: CategoriaEquipo | "Todos";
  setCategoriaActiva: (cat: CategoriaEquipo | "Todos") => void;
  conteosPorCategoria: Record<string, number>;
}

function CategoryTabs({ categoriaActiva, setCategoriaActiva, conteosPorCategoria }: CategoryTabsProps) {
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant={categoriaActiva === "Todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoriaActiva("Todos")}
            className={`rounded-full transition-all duration-300 ${
              categoriaActiva === "Todos"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-transparent"
                : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            Todos ({conteosPorCategoria["Todos"] || 0})
          </Button>
          {categoriasEquipo.map((cat) => {
            const Icon = iconosPorCategoria[cat];
            return (
              <Button
                key={cat}
                variant={categoriaActiva === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoriaActiva(cat)}
                className={`rounded-full transition-all duration-300 flex items-center gap-2 ${
                  categoriaActiva === cat
                    ? `bg-gradient-to-r ${coloresPorCategoria[cat]} text-white border-transparent`
                    : "border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat}</span>
                <span className="sm:hidden">{cat.split(" ")[0]}</span>
                <span className="text-xs opacity-70">({conteosPorCategoria[cat] || 0})</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Search Bar
interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  return (
    <div className="container mx-auto px-6 py-6">
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre, marca, modelo o material..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-10 py-3 w-full rounded-full border-gray-200 focus:border-orange-500 focus:ring-orange-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Category Section with image preloading
interface CategorySectionProps {
  categoria: CategoriaEquipo;
  equipos: Equipo[];
  onOpenDetail: (equipo: Equipo) => void;
}

function CategorySection({ categoria, equipos, onOpenDetail }: CategorySectionProps) {
  const [isHovering, setIsHovering] = useState(false);
  const Icon = iconosPorCategoria[categoria];

  // Recopilar todas las imágenes de los equipos en esta categoría
  const allCategoryImages = useMemo(() => {
    return equipos.map(e => e.imagen).filter(Boolean);
  }, [equipos]);

  // Precargar todas las imágenes cuando el usuario hace hover sobre la categoría
  usePreloadImages(allCategoryImages, isHovering);

  return (
    <div 
      className="mb-12"
      onMouseEnter={() => setIsHovering(true)}
    >
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${coloresPorCategoria[categoria]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{categoria}</h2>
          <p className="text-sm text-gray-500">{equipos.length} equipos disponibles</p>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {equipos.map((equipo, index) => (
          <EquipmentCard
            key={equipo.id}
            equipo={equipo}
            index={index}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
}

// Equipment Card
interface EquipmentCardProps {
  equipo: Equipo;
  index: number;
  onOpenDetail: (equipo: Equipo) => void;
}

function EquipmentCard({ equipo, index, onOpenDetail }: EquipmentCardProps) {
  const Icon = iconosPorCategoria[equipo.categoria];
  const [isHovering, setIsHovering] = useState(false);

  // Precargar la imagen del equipo cuando se hace hover
  usePreloadImages([equipo.imagen], isHovering);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={() => onOpenDetail(equipo)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border ${bgPorCategoria[equipo.categoria]}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={equipo.imagen}
            alt={equipo.nombre}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
              equipo.estado === "Disponible" 
                ? "bg-green-500 text-white" 
                : equipo.estado === "En uso" 
                  ? "bg-yellow-500 text-white" 
                  : "bg-red-500 text-white"
            }`}>
              {equipo.estado === "Disponible" && <CheckCircle className="w-3 h-3" />}
              {equipo.estado === "En uso" && <Info className="w-3 h-3" />}
              {equipo.estado === "Mantenimiento" && <AlertTriangle className="w-3 h-3" />}
              {equipo.estado}
            </span>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${coloresPorCategoria[equipo.categoria]} text-white`}>
              <Icon className="w-3 h-3" />
              {equipo.categoria.split(" ")[0]}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-sm font-medium flex items-center gap-1">
              Ver especificaciones <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {equipo.nombre}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{equipo.marca} • {equipo.modelo}</p>
          
          {/* Area de trabajo */}
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
            <Maximize2 className="w-4 h-4 text-gray-400" />
            <span>{equipo.areaTrabajo}</span>
          </div>

          {/* Certificación */}
          <div className="mt-4 flex items-center justify-between">
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${coloresCertificacion[equipo.certificacionRequerida]}`}>
              {equipo.certificacionRequerida === "Básico" ? "Sin requisito" : `Requiere ${equipo.certificacionRequerida}`}
            </span>
          </div>

          {/* Materiales Preview */}
          <div className="flex flex-wrap gap-1 mt-3">
            {equipo.materialesCompatibles.slice(0, 3).map((mat) => (
              <span key={mat} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">
                {mat}
              </span>
            ))}
            {equipo.materialesCompatibles.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-md">
                +{equipo.materialesCompatibles.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// Equipment Detail Modal
interface EquipmentDetailModalProps {
  equipo: Equipo;
  isOpen: boolean;
  onClose: () => void;
}

function EquipmentDetailModal({ equipo, isOpen, onClose }: EquipmentDetailModalProps) {
  const Icon = iconosPorCategoria[equipo.categoria];

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 xl:inset-24 bg-white rounded-3xl z-50 overflow-hidden shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="h-full overflow-y-auto">
              <div className="grid lg:grid-cols-2 min-h-full">
                {/* Left: Image */}
                <div className="relative h-[40vh] lg:h-full bg-gray-900">
                  <Image
                    src={equipo.imagen}
                    alt={equipo.nombre}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Category Badge on Image */}
                  <div className="absolute bottom-6 left-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r ${coloresPorCategoria[equipo.categoria]} text-white`}>
                      <Icon className="w-5 h-5" />
                      {equipo.categoria}
                    </span>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="p-6 lg:p-10 overflow-y-auto">
                  {/* Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full ${
                      equipo.estado === "Disponible" 
                        ? "bg-green-100 text-green-700" 
                        : equipo.estado === "En uso" 
                          ? "bg-yellow-100 text-yellow-700" 
                          : "bg-red-100 text-red-700"
                    }`}>
                      {equipo.estado === "Disponible" && <CheckCircle className="w-4 h-4" />}
                      {equipo.estado === "En uso" && <Info className="w-4 h-4" />}
                      {equipo.estado === "Mantenimiento" && <AlertTriangle className="w-4 h-4" />}
                      {equipo.estado}
                    </span>
                    <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full ${coloresCertificacion[equipo.certificacionRequerida]}`}>
                      {equipo.certificacionRequerida === "Básico" ? "Acceso libre" : `Requiere ${equipo.certificacionRequerida}`}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    {equipo.nombre}
                  </h2>
                  <p className="text-lg text-gray-500 mb-6">{equipo.marca} • {equipo.modelo}</p>

                  {/* Description */}
                  <p className="text-gray-700 mb-8 leading-relaxed">{equipo.descripcion}</p>

                  {/* Specifications Grid */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Box className="w-4 h-4" />
                        Área de Trabajo
                      </div>
                      <p className="text-gray-900 font-semibold">{equipo.areaTrabajo}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Zap className="w-4 h-4" />
                        Certificación
                      </div>
                      <p className="text-gray-900 font-semibold">{equipo.certificacionRequerida}</p>
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-orange-500" />
                      Materiales Compatibles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {equipo.materialesCompatibles.map((mat) => (
                        <span
                          key={mat}
                          className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  {equipo.caracteristicas && equipo.caracteristicas.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Características
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {equipo.caracteristicas.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-700">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            {feat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500 mb-4">
                      ¿Necesitas capacitación para usar este equipo? Contáctanos.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/contacto">
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700">
                          Solicitar Capacitación
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function TecnologiasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaEquipo | "Todos">("Todos");
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [equiposList, setEquiposList] = useState<Equipo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar equipos de la BD al montar el componente
  useEffect(() => {
    const loadEquipo = async () => {
      try {
        const { getEquipmentList } = await import('./tecnologias-actions');
        const data = await getEquipmentList();
        
        // Convertir datos de la BD al formato esperado
        const converted: Equipo[] = data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          categoria: mapCategory(item.categoria),
          imagen: item.imagen || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
          marca: item.marca,
          modelo: item.modelo,
          areaTrabajo: item.areaTrabajo,
          materialesCompatibles: item.materialesCompatibles,
          certificacionRequerida: 'Nivel 1',
          descripcion: item.descripcion,
          estado: 'Disponible' as const,
          caracteristicas: item.especificaciones?.map((e: any) => `${e.label}: ${e.value}`) || [],
        }));
        setEquiposList(converted);
      } catch (error) {
        console.error('Error loading equipment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEquipo();
  }, []);

  // Mapear categorías de Payload a categorías esperadas
  const mapCategory = (payloadCategory: string): CategoriaEquipo => {
    const mapping: Record<string, CategoriaEquipo> = {
      '3d-printer': 'Fabricación Aditiva',
      'laser-cutter': 'Fabricación Sustractiva',
      'cnc': 'Fabricación Sustractiva',
      'electronics': 'Electrónica y Programación',
      'hand-tools': 'Herramientas y Montaje',
      '3d-scanner': 'Fabricación Aditiva',
      'other': 'Herramientas y Montaje',
    };
    return mapping[payloadCategory] || 'Herramientas y Montaje';
  };

  // Filter equipment
  const equiposFiltrados = useMemo(() => {
    return equiposList.filter((equipo) => {
      const matchesSearch =
        searchQuery === "" ||
        equipo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipo.marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipo.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipo.materialesCompatibles.some((mat) =>
          mat.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategoria =
        categoriaActiva === "Todos" || equipo.categoria === categoriaActiva;

      return matchesSearch && matchesCategoria;
    });
  }, [searchQuery, categoriaActiva, equiposList]);

  // Count by category
  const conteosPorCategoria = useMemo(() => {
    const conteos: Record<string, number> = { Todos: equiposList.length };
    categoriasEquipo.forEach((cat) => {
      conteos[cat] = equiposList.filter((e) => e.categoria === cat).length;
    });
    return conteos;
  }, [equiposList]);

  // Group by category for display
  const equiposPorCategoria = useMemo(() => {
    if (categoriaActiva !== "Todos") {
      return { [categoriaActiva]: equiposFiltrados };
    }
    
    const grouped: Record<string, Equipo[]> = {};
    categoriasEquipo.forEach((cat) => {
      const equipos = equiposFiltrados.filter((e) => e.categoria === cat);
      if (equipos.length > 0) {
        grouped[cat] = equipos;
      }
    });
    return grouped;
  }, [equiposFiltrados, categoriaActiva]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <HeroSection />

      {/* Category Tabs */}
      <CategoryTabs
        categoriaActiva={categoriaActiva}
        setCategoriaActiva={setCategoriaActiva}
        conteosPorCategoria={conteosPorCategoria}
      />

      {/* Search */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Equipment Grid by Category */}
      <section className="container mx-auto px-6 pb-16">
        {Object.entries(equiposPorCategoria).length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No se encontraron equipos
            </h3>
            <p className="text-gray-500">
              Intenta con otros términos de búsqueda o cambia la categoría
            </p>
          </div>
        ) : (
          Object.entries(equiposPorCategoria).map(([categoria, equipos]) => (
            <CategorySection
              key={categoria}
              categoria={categoria as CategoriaEquipo}
              equipos={equipos}
              onOpenDetail={setSelectedEquipo}
            />
          ))
        )}
      </section>

      {/* Equipment Detail Modal */}
      {selectedEquipo && (
        <EquipmentDetailModal
          equipo={selectedEquipo}
          isOpen={!!selectedEquipo}
          onClose={() => setSelectedEquipo(null)}
        />
      )}
    </div>
  );
}
