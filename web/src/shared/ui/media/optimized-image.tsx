"use client";

/**
 * Componente OptimizedImage - Wrapper optimizado sobre next/image
 * 
 * Beneficios:
 * - Conversión automática a WebP/AVIF vía Next.js
 * - Lazy loading por defecto
 * - Placeholder blur mientras carga
 * - Tamaños responsive automáticos
 * - Soporte para imágenes de Payload CMS (/media/*)
 */

import Image from "next/image";
import { cn } from "@/shared/utils";
import { useState } from "react";

// Placeholder blur base64 mínimo (gris claro)
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

interface OptimizedImageProps {
  /** URL de la imagen (puede ser /media/*, /api/payload/media/*, URL absoluta) */
  src: string;
  alt: string;
  /** Ancho en píxeles (para imágenes con dimensiones conocidas) */
  width?: number;
  /** Alto en píxeles (para imágenes con dimensiones conocidas) */
  height?: number;
  /** Usar fill mode (la imagen llena el contenedor padre position:relative) */
  fill?: boolean;
  /** Clases CSS */
  className?: string;
  /** Cargar con prioridad (above-the-fold) */
  priority?: boolean;
  /** Calidad de optimización (1-100, default 80) */
  quality?: number;
  /** Responsive sizes hint para el navegador */
  sizes?: string;
  /** object-fit */
  objectFit?: "cover" | "contain" | "fill" | "none";
  /** Mostrar fallback si falla la carga */
  fallback?: React.ReactNode;
  /** Callback on load */
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 80,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  objectFit = "cover",
  fallback,
  onLoad,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  // Para URLs externas o data URIs, no optimizar
  const isExternal = src.startsWith("http") && !src.includes("localhost");
  const isDataUri = src.startsWith("data:");

  if (isDataUri) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    );
  }

  const imageProps = {
    src,
    alt,
    quality,
    priority,
    sizes: fill ? sizes : undefined,
    placeholder: "blur" as const,
    blurDataURL: BLUR_PLACEHOLDER,
    onError: () => setHasError(true),
    onLoad: () => {
      setIsLoaded(true);
      onLoad?.();
    },
    className: cn(
      `object-${objectFit}`,
      !isLoaded && !priority && "animate-pulse bg-gray-200",
      className
    ),
    ...(isExternal ? { unoptimized: true } : {}),
  };

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  return (
    <Image
      {...imageProps}
      width={width || 800}
      height={height || 600}
    />
  );
}

/**
 * Componente para imágenes de Payload CMS
 * Selecciona automáticamente el tamaño óptimo según el contexto
 */
interface PayloadImageProps extends Omit<OptimizedImageProps, "src"> {
  /** Objeto media de Payload con URLs de diferentes tamaños */
  media: {
    url?: string;
    sizes?: {
      thumbnail?: { url?: string };
      card?: { url?: string };
      tablet?: { url?: string };
      og?: { url?: string };
    };
  };
  /** Tamaño preferido */
  preferredSize?: "thumbnail" | "card" | "tablet" | "og" | "original";
}

export function PayloadImage({
  media,
  preferredSize = "card",
  ...props
}: PayloadImageProps) {
  // Seleccionar la mejor URL disponible según el tamaño preferido
  const sizeUrl = media.sizes?.[preferredSize]?.url;
  const finalUrl = sizeUrl || media.url || "";

  if (!finalUrl) return null;

  return <OptimizedImage src={finalUrl} {...props} />;
}
