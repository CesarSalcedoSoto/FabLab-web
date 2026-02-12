"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook para precargar imágenes de una galería
 * 
 * Precarga las siguientes imágenes cuando se cambia de imagen,
 * mejorando la experiencia de navegación en galerías.
 * 
 * @param images - Array de URLs de imágenes
 * @param currentIndex - Índice de la imagen actual
 * @param preloadCount - Cantidad de imágenes a precargar adelante y atrás (default: 2)
 * @param enabled - Si está habilitado el preloading (default: true)
 * 
 * @example
 * const { preloadNext, preloadPrev, preloadAll } = useImagePreloader(images, currentIndex);
 * 
 * // Precargar manualmente
 * preloadNext();
 * preloadPrev();
 * 
 * // Precargar todas al abrir modal
 * useEffect(() => { if (isOpen) preloadAll(); }, [isOpen]);
 */
export function useImagePreloader(
  images: string[],
  currentIndex: number = 0,
  preloadCount: number = 2,
  enabled: boolean = true
) {
  const preloadedImages = useRef<Set<string>>(new Set());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  /**
   * Precarga una imagen individual
   */
  const preloadImage = useCallback((src: string): Promise<void> => {
    if (!src || preloadedImages.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        imageCache.current.set(src, img);
        resolve();
      };
      img.onerror = () => {
        // Marcar como procesada aunque falle para no reintentar
        preloadedImages.current.add(src);
        resolve();
      };
      img.src = src;
    });
  }, []);

  /**
   * Precarga múltiples imágenes en paralelo
   */
  const preloadImages = useCallback(async (sources: string[]) => {
    const toPreload = sources.filter(
      (src) => src && !preloadedImages.current.has(src)
    );
    await Promise.all(toPreload.map(preloadImage));
  }, [preloadImage]);

  /**
   * Precarga las siguientes N imágenes
   */
  const preloadNext = useCallback(() => {
    if (!enabled || images.length <= 1) return;

    const nextIndices: number[] = [];
    for (let i = 1; i <= preloadCount; i++) {
      nextIndices.push((currentIndex + i) % images.length);
    }
    
    const nextImages = nextIndices.map((idx) => images[idx]).filter(Boolean);
    preloadImages(nextImages);
  }, [enabled, images, currentIndex, preloadCount, preloadImages]);

  /**
   * Precarga las anteriores N imágenes
   */
  const preloadPrev = useCallback(() => {
    if (!enabled || images.length <= 1) return;

    const prevIndices: number[] = [];
    for (let i = 1; i <= preloadCount; i++) {
      const idx = (currentIndex - i + images.length) % images.length;
      prevIndices.push(idx);
    }
    
    const prevImages = prevIndices.map((idx) => images[idx]).filter(Boolean);
    preloadImages(prevImages);
  }, [enabled, images, currentIndex, preloadCount, preloadImages]);

  /**
   * Precarga todas las imágenes del array
   */
  const preloadAll = useCallback(() => {
    if (!enabled || images.length === 0) return;
    preloadImages(images);
  }, [enabled, images, preloadImages]);

  /**
   * Precarga imágenes adyacentes (siguiente y anterior)
   */
  const preloadAdjacent = useCallback(() => {
    preloadNext();
    preloadPrev();
  }, [preloadNext, preloadPrev]);

  // Precargar automáticamente cuando cambia el índice
  useEffect(() => {
    if (!enabled || images.length <= 1) return;
    
    // Precargar siguiente y anterior automáticamente
    preloadAdjacent();
  }, [currentIndex, enabled, preloadAdjacent, images.length]);

  // Verificar si una imagen ya está en caché
  const isPreloaded = useCallback((src: string): boolean => {
    return preloadedImages.current.has(src);
  }, []);

  // Limpiar caché (útil si las imágenes cambian)
  const clearCache = useCallback(() => {
    preloadedImages.current.clear();
    imageCache.current.clear();
  }, []);

  return {
    preloadImage,
    preloadImages,
    preloadNext,
    preloadPrev,
    preloadAll,
    preloadAdjacent,
    isPreloaded,
    clearCache,
    cachedCount: preloadedImages.current.size,
  };
}

/**
 * Hook simplificado que precarga todas las imágenes al montar
 * Útil para modales que se abren con todas las imágenes visibles
 * 
 * @param images - Array de URLs de imágenes
 * @param shouldPreload - Condición para activar preload (ej: isModalOpen)
 */
export function usePreloadImages(
  images: string[],
  shouldPreload: boolean = true
) {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!shouldPreload || images.length === 0) return;

    const toPreload = images.filter(
      (src) => src && !preloadedRef.current.has(src)
    );

    toPreload.forEach((src) => {
      const img = new window.Image();
      img.onload = () => preloadedRef.current.add(src);
      img.onerror = () => preloadedRef.current.add(src);
      img.src = src;
    });
  }, [images, shouldPreload]);

  return {
    isPreloaded: (src: string) => preloadedRef.current.has(src),
    preloadedCount: preloadedRef.current.size,
  };
}

export default useImagePreloader;
