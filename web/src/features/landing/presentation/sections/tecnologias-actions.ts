"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export interface EquipmentItem {
  id: string;
  nombre: string;
  categoria: string;
  imagen: string | null;
  marca: string;
  modelo: string;
  areaTrabajo: string;
  materialesCompatibles: string[];
  estado: "Disponible" | "En uso" | "Mantenimiento";
  descripcion: string;
  especificaciones: { label: string; value: string }[];
}

// Formato para el carrusel de la landing
export interface LandingTechBox {
  id: string;
  titulo: string;
  imagenes: string[];
  descripcion?: string;
}

export interface LandingTechCategory {
  id: string;
  label: string;
  color: string;
  tecnologias: LandingTechBox[];
}

const categoryConfig: Record<string, { label: string; color: string; order: number }> = {
  '3d-printer':   { label: 'Impresoras 3D',          color: 'from-blue-500 to-cyan-500',     order: 1 },
  'laser-cutter': { label: 'Cortadoras Láser',        color: 'from-red-500 to-orange-500',    order: 2 },
  'cnc':          { label: 'CNC',                     color: 'from-green-500 to-emerald-500', order: 3 },
  'electronics':  { label: 'Electrónica',             color: 'from-purple-500 to-pink-500',   order: 4 },
  'hand-tools':   { label: 'Herramientas Manuales',   color: 'from-amber-500 to-yellow-500',  order: 5 },
  '3d-scanner':   { label: 'Escáner 3D',              color: 'from-teal-500 to-cyan-500',     order: 6 },
  'other':        { label: 'Otros',                   color: 'from-gray-500 to-slate-500',    order: 7 },
};

/**
 * Obtiene equipos agrupados por categoría para el carrusel de la landing
 */
export async function getEquipmentByCategory(): Promise<LandingTechCategory[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'equipment',
      limit: 100,
      depth: 2,
      overrideAccess: true,
      where: {
        status: { equals: 'available' },
        showInTecnologias: { equals: true },
      },
      sort: 'order',
    });

    // Agrupar por categoría
    const grouped: Record<string, LandingTechBox[]> = {};

    for (const doc of result.docs as any[]) {
      const cat = doc.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];

      // Recolectar imágenes: featuredImage + gallery
      const imagenes: string[] = [];
      if (typeof doc.featuredImage === 'object' && doc.featuredImage?.url) {
        imagenes.push(doc.featuredImage.url);
      }
      if (doc.gallery && Array.isArray(doc.gallery)) {
        for (const item of doc.gallery) {
          const url = typeof item.image === 'object' ? item.image?.url : null;
          if (url && !imagenes.includes(url)) {
            imagenes.push(url);
          }
        }
      }

      grouped[cat].push({
        id: String(doc.id),
        titulo: doc.name,
        imagenes,
        descripcion: [doc.brand, doc.model].filter(Boolean).join(' ') || doc.description,
      });
    }

    // Convertir a array de categorías, ordenadas
    return Object.entries(grouped)
      .map(([catKey, tecnologias]) => {
        const cfg = categoryConfig[catKey] || categoryConfig['other'];
        return {
          id: catKey,
          label: cfg.label,
          color: cfg.color,
          order: cfg.order,
          tecnologias,
        };
      })
      .sort((a, b) => a.order - b.order)
      .map(({ order, ...rest }) => rest); // quitar order del resultado final
  } catch (error) {
    console.error('Error fetching equipment by category:', error);
    return [];
  }
}

/**
 * Obtiene lista plana de equipos para la página /tecnologías
 */
export async function getEquipmentList(): Promise<EquipmentItem[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'equipment',
      limit: 100,
      depth: 2,
      overrideAccess: true,
      where: {
        status: { equals: 'available' },
        showInTecnologias: { equals: true },
      },
      sort: 'order',
    });

    return result.docs.map((doc: any) => ({
      id: String(doc.id),
      nombre: doc.name,
      categoria: doc.category,
      imagen: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : null,
      marca: doc.brand || '',
      modelo: doc.model || '',
      areaTrabajo: doc.specifications?.find((s: any) => s.label?.toLowerCase().includes('área'))?.value || 'N/A',
      materialesCompatibles: doc.materials?.map((m: any) => m.material) || [],
      estado: doc.status === 'available' ? 'Disponible' : doc.status === 'maintenance' ? 'Mantenimiento' : 'En uso',
      descripcion: doc.description,
      especificaciones: doc.specifications?.map((s: any) => ({ label: s.label, value: s.value })) || [],
    }));
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }
}
