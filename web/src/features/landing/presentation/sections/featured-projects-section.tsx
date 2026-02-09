"use client";

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/shared/ui/buttons/button";
import { getFeaturedProjects } from "./featured-projects-actions";

interface ProjectBox {
  id: string;
  titulo: string;
  imagenes: string[];
  descripcion?: string;
}

interface ProjectCardProps {
  proyecto: ProjectBox;
  index: number;
  onOpenDetail: (proyecto: ProjectBox) => void;
}

// Componente memorizado - cambia imagen en hover o manualmente
const ProjectCard = memo(function ProjectCard({ proyecto, index, onOpenDetail }: ProjectCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Cambiar imagen automáticamente cuando está en hover
  useEffect(() => {
    if (!isHovering || proyecto.imagenes.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % proyecto.imagenes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovering, proyecto.imagenes.length]);

  // Reset al salir del hover
  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Navegar manualmente las imágenes
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? proyecto.imagenes.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      (prev + 1) % proyecto.imagenes.length
    );
  };

  // Click en indicador
  const handleIndicatorClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrentImageIndex(idx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex-shrink-0 w-64 sm:w-72 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpenDetail(proyecto)}
    >
      {/* Imagen con transición */}
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={proyecto.imagenes[currentImageIndex] || "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=400&h=300&fit=crop"}
              alt={`${proyecto.titulo} - imagen ${currentImageIndex + 1}`}
              fill
              sizes="(max-width: 640px) 256px, 288px"
              className="object-cover"
              priority={index < 4}
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Flechas de navegación manual */}
        {proyecto.imagenes.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        
        {/* Indicadores de imagen clickeables */}
        {proyecto.imagenes.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {proyecto.imagenes.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => handleIndicatorClick(e, idx)}
                className={`h-1.5 rounded-full transition-all duration-300 hover:scale-125 ${
                  idx === currentImageIndex ? "bg-white w-4" : "bg-white/50 w-1.5 hover:bg-white/80"
                }`}
                aria-label={`Ver imagen ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Contador de imágenes */}
        {proyecto.imagenes.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {currentImageIndex + 1}/{proyecto.imagenes.length}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {proyecto.titulo}
        </h3>
        {proyecto.descripcion && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {proyecto.descripcion}
          </p>
        )}
        <p className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Click para ver más →
        </p>
      </div>
    </motion.div>
  );
});

// Modal de detalle del proyecto
function ProjectDetailModal({ 
  proyecto, 
  isOpen, 
  onClose 
}: { 
  proyecto: ProjectBox | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset imagen al abrir
  useEffect(() => {
    if (isOpen) setCurrentImageIndex(0);
  }, [isOpen]);

  if (!isOpen || !proyecto) return null;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? proyecto.imagenes.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      (prev + 1) % proyecto.imagenes.length
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Galería de imágenes */}
            <div className="relative aspect-video bg-gray-100">
              {proyecto.imagenes.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={proyecto.imagenes[currentImageIndex]}
                        alt={`${proyecto.titulo} - imagen ${currentImageIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={75}
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Controles de navegación */}
                  {proyecto.imagenes.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="Imagen siguiente"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Indicadores */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {proyecto.imagenes.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              idx === currentImageIndex ? "bg-white w-8" : "bg-white/50 w-2 hover:bg-white/80"
                            }`}
                            aria-label={`Ver imagen ${idx + 1}`}
                          />
                        ))}
                      </div>

                      {/* Contador */}
                      <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                        {currentImageIndex + 1} / {proyecto.imagenes.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-gray-400">Sin imágenes</span>
                </div>
              )}

              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{proyecto.titulo}</h2>
              
              {proyecto.descripcion && (
                <p className="text-gray-600 mb-6 leading-relaxed">{proyecto.descripcion}</p>
              )}

              {/* Miniaturas de la galería */}
              {proyecto.imagenes.length > 1 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Galería</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {proyecto.imagenes.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex 
                            ? "border-blue-500 ring-2 ring-blue-200" 
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Miniatura ${idx + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón ver más */}
              <Link
                href={`/proyectos`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver todos los proyectos
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


export function FeaturedProjectsSection() {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [proyectos, setProyectos] = useState<ProjectBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar proyectos desde la BD
  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        const projects = await getFeaturedProjects();
        if (isMounted) {
          setProyectos(projects);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setMounted(true);

    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleCount(1);
      else if (width < 768) setVisibleCount(2);
      else if (width < 1024) setVisibleCount(3);
      else setVisibleCount(4);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const totalProjects = proyectos.length;
  const maxIndex = Math.max(0, totalProjects - visibleCount);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  // Estado de carga o no montado
  if (!mounted || isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Proyectos</h2>
          <div className="flex gap-6 justify-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 bg-white rounded-2xl shadow-lg h-56 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Si no hay proyectos después de cargar, no mostrar la sección
  if (proyectos.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Link href="/proyectos" className="inline-block">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors cursor-pointer">
              Proyectos
            </h2>
          </Link>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora nuestras áreas de innovación y fabricación digital
          </p>
        </motion.div>

        {/* Carrusel horizontal */}
        <div className="relative flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute left-0 z-10 h-12 w-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 -translate-x-1/2 disabled:opacity-50"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div ref={containerRef} className="w-full overflow-hidden mx-8">
            <motion.div
              className="flex gap-6"
              animate={{ x: -currentIndex * (288 + 24) }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {proyectos.map((proyecto, index) => (
                <ProjectCard 
                  key={proyecto.id} 
                  proyecto={proyecto} 
                  index={index} 
                  onOpenDetail={setSelectedProject}
                />
              ))}
            </motion.div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 z-10 h-12 w-12 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 translate-x-1/2 disabled:opacity-50"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Indicadores de posición */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === currentIndex ? "bg-gray-900 w-8" : "bg-gray-300 w-2 hover:bg-gray-400"
              }`}
              aria-label={`Ir a página ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Modal de detalle */}
      <ProjectDetailModal
        proyecto={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
