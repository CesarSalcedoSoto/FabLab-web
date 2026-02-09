"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Box } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/buttons/button";
import { getEquipmentByCategory, type LandingTechCategory, type LandingTechBox } from "./tecnologias-actions";

interface TechCardProps {
  tech: LandingTechBox;
  index: number;
}

// TechCard optimizado - solo cambia imagen en hover
const TechCard = memo(function TechCard({ tech, index }: TechCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const hasImages = tech.imagenes.length > 0;

  // Cambiar imagen solo cuando está en hover
  useEffect(() => {
    if (!isHovering || tech.imagenes.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % tech.imagenes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovering, tech.imagenes.length]);

  const handleMouseLeave = () => {
    setIsHovering(false);
    setCurrentImageIndex(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex-shrink-0 w-56 sm:w-64 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative h-36 overflow-hidden bg-gray-100">
        {hasImages ? (
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
                src={tech.imagenes[currentImageIndex]}
                alt={`${tech.titulo} - imagen ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover"
                quality={75}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Box className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Indicadores */}
        {tech.imagenes.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {tech.imagenes.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3">
        <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {tech.titulo}
        </h4>
        {tech.descripcion && (
          <p className="text-xs text-gray-600 line-clamp-1">{tech.descripcion}</p>
        )}
      </div>
    </motion.div>
  );
});

interface CategoryCarouselProps {
  category: LandingTechCategory;
  categoryIndex: number;
}

function CategoryCarousel({ category, categoryIndex }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
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

  const totalTechs = category.tecnologias.length;
  const maxIndex = Math.max(0, totalTechs - visibleCount);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: categoryIndex * 0.2 }}
      className="mb-12"
    >
      {/* Label de categoría */}
      <div className={`flex items-center gap-4 mb-6 ${categoryIndex % 2 === 1 ? 'flex-row-reverse' : ''}`}>
        <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${category.color}`} />
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">{category.label}</h3>
        <div className={`h-1 flex-1 rounded-full bg-gradient-to-r ${category.color} opacity-30`} />
      </div>

      {/* Carrusel */}
      <div className="relative flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-0 z-10 h-10 w-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 -translate-x-1/2 disabled:opacity-50"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="w-full overflow-hidden mx-6">
          <motion.div
            className="flex gap-4"
            animate={{ x: -currentIndex * (256 + 16) }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {category.tecnologias.map((tech, index) => (
              <TechCard key={tech.id} tech={tech} index={index} />
            ))}
          </motion.div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          className="absolute right-0 z-10 h-10 w-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-gray-50 translate-x-1/2 disabled:opacity-50"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function TechCategoriesSection() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<LandingTechCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar equipos de la BD
  useEffect(() => {
    let isMounted = true;

    const loadEquipment = async () => {
      try {
        const data = await getEquipmentByCategory();
        if (isMounted) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Error loading equipment categories:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEquipment();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Tecnologías</h2>
          <div className="space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="flex gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="w-64 bg-gray-100 rounded-2xl h-48 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <Link href="/tecnologias" className="inline-block">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors cursor-pointer">
              Tecnologías
            </h2>
          </Link>
          <p className="text-lg text-gray-600">
            Próximamente se mostrarán las tecnologías disponibles.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Link href="/tecnologias" className="inline-block">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors cursor-pointer">
              Tecnologías
            </h2>
          </Link>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Herramientas y equipamiento que utilizamos para hacer realidad tus proyectos
          </p>
        </motion.div>

        {/* Categorías con carruseles */}
        {categories.map((category, index) => (
          <CategoryCarousel key={category.id} category={category} categoryIndex={index} />
        ))}
      </div>
    </section>
  );
}
