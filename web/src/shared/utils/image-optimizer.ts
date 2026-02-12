/**
 * Image Optimization Utilities
 * 
 * Helpers para optimización de URLs de imágenes de Payload CMS.
 * Utiliza los tamaños predefinidos generados por Sharp.
 * 
 * @example
 * // Obtener URL optimizada para tarjeta
 * const url = getOptimizedImageUrl(imageDoc, 'card');
 * 
 * // Con fallback
 * const url = getOptimizedImageUrl(imageDoc, 'thumbnail', '/placeholder.jpg');
 */

export type ImageSize = 
  | 'thumbnail'   // 400x300 - previews pequeños
  | 'techBox'     // 600x400 - cajas de tecnologías
  | 'card'        // 768x576 - tarjetas
  | 'gallery'     // 800x600 - galerías
  | 'tablet'      // 1024xauto - tablet
  | 'hero'        // 1920x1080 - banners
  | 'og';         // 1200x630 - Open Graph

export interface PayloadImage {
  url?: string | null;
  sizes?: {
    thumbnail?: { url?: string | null };
    techBox?: { url?: string | null };
    card?: { url?: string | null };
    gallery?: { url?: string | null };
    tablet?: { url?: string | null };
    hero?: { url?: string | null };
    og?: { url?: string | null };
  } | null;
}

/**
 * Obtiene la URL optimizada de una imagen de Payload
 * @param image - Documento de imagen de Payload
 * @param size - Tamaño deseado (thumbnail, card, gallery, etc.)
 * @param fallback - URL de fallback si no hay imagen
 * @returns URL optimizada o fallback
 */
export function getOptimizedImageUrl(
  image: PayloadImage | null | undefined,
  size: ImageSize = 'card',
  fallback?: string
): string {
  if (!image) {
    return fallback ?? getPlaceholderUrl(size);
  }

  // Intentar obtener el tamaño específico
  const sizedUrl = image.sizes?.[size]?.url;
  if (sizedUrl) {
    return sizedUrl;
  }

  // Fallback a URL original
  if (image.url) {
    return image.url;
  }

  return fallback ?? getPlaceholderUrl(size);
}

/**
 * Obtiene URL de placeholder según tamaño
 */
function getPlaceholderUrl(size: ImageSize): string {
  const dimensions: Record<ImageSize, { w: number; h: number }> = {
    thumbnail: { w: 400, h: 300 },
    techBox: { w: 600, h: 400 },
    card: { w: 768, h: 576 },
    gallery: { w: 800, h: 600 },
    tablet: { w: 1024, h: 768 },
    hero: { w: 1920, h: 1080 },
    og: { w: 1200, h: 630 },
  };
  
  const { w, h } = dimensions[size];
  return `https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=${w}&h=${h}&fit=crop`;
}

/**
 * Obtiene múltiples URLs optimizadas para srcSet responsivo
 * @param image - Documento de imagen de Payload
 * @param sizes - Array de tamaños a incluir
 * @returns Objeto con URLs por tamaño
 */
export function getResponsiveImageUrls(
  image: PayloadImage | null | undefined,
  sizes: ImageSize[] = ['thumbnail', 'card', 'tablet']
): Record<ImageSize, string> {
  const result: Partial<Record<ImageSize, string>> = {};
  
  for (const size of sizes) {
    result[size] = getOptimizedImageUrl(image, size);
  }
  
  return result as Record<ImageSize, string>;
}

/**
 * Genera srcSet string para img tag o Next/Image
 * @param image - Documento de imagen de Payload
 * @returns srcSet string
 */
export function getImageSrcSet(
  image: PayloadImage | null | undefined
): string {
  if (!image?.sizes) {
    return '';
  }

  const entries: string[] = [];
  
  const sizeWidths: Record<string, number> = {
    thumbnail: 400,
    techBox: 600,
    card: 768,
    gallery: 800,
    tablet: 1024,
    hero: 1920,
    og: 1200,
  };

  for (const [sizeName, width] of Object.entries(sizeWidths)) {
    const sizeData = image.sizes[sizeName as keyof typeof image.sizes];
    if (sizeData?.url) {
      entries.push(`${sizeData.url} ${width}w`);
    }
  }

  // Agregar original como fallback máximo
  if (image.url) {
    entries.push(`${image.url} 2400w`);
  }

  return entries.join(', ');
}

/**
 * Obtiene URL optimizada para URLs externas (Unsplash, etc.)
 * Agrega parámetros de optimización según el servicio
 */
export function optimizeExternalUrl(
  url: string,
  width: number = 800,
  height?: number,
  quality: number = 80
): string {
  // Unsplash
  if (url.includes('unsplash.com')) {
    const params = new URLSearchParams();
    params.set('w', String(width));
    if (height) params.set('h', String(height));
    params.set('fit', 'crop');
    params.set('q', String(quality));
    params.set('auto', 'format');
    
    const base = url.split('?')[0];
    return `${base}?${params.toString()}`;
  }

  // Cloudinary
  if (url.includes('cloudinary.com')) {
    const transformations = [
      `w_${width}`,
      height ? `h_${height}` : '',
      'c_fill',
      `q_${quality}`,
      'f_auto',
    ].filter(Boolean).join(',');
    
    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  // Para otras URLs, retornar sin modificar
  return url;
}

/**
 * Verifica si una URL es una imagen válida
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  const imageExtensions = /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i;
  const imageDomains = ['unsplash.com', 'cloudinary.com', 'images.'];
  
  return imageExtensions.test(url) || 
    imageDomains.some(domain => url.includes(domain));
}
