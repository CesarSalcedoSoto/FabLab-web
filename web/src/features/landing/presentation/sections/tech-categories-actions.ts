"use server";

import { getPayload } from "payload";
import config from "@payload-config";

export interface TechBox {
  id: string;
  titulo: string;
  imagenes: string[];
  descripcion?: string;
}

export interface TechCategory {
  id: string;
  label: string;
  color: string;
  tecnologias: TechBox[];
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  "3d-printer": { label: "Impresión 3D", color: "from-blue-500 to-cyan-500" },
  "laser-cutter": { label: "Corte Láser", color: "from-red-500 to-orange-500" },
  "cnc": { label: "CNC & Fresado", color: "from-amber-500 to-yellow-500" },
  "electronics": { label: "Electrónica", color: "from-green-500 to-emerald-500" },
  "hand-tools": { label: "Herramientas", color: "from-purple-500 to-pink-500" },
  "3d-scanner": { label: "Escaneo 3D", color: "from-indigo-500 to-blue-500" },
  "other": { label: "Otros Equipos", color: "from-gray-500 to-slate-500" },
};

export async function getTechCategories(): Promise<TechCategory[]> {
  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: 'equipment',
      limit: 100,
      depth: 2,
      overrideAccess: true,
      where: {
        showInTecnologias: {
          equals: true,
        },
      },
    });

    // Agrupar por categoría
    const grouped: Record<string, TechBox[]> = {};
    
    for (const doc of result.docs as any[]) {
      const category = doc.category || 'other';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      // Construir imágenes array
      const imagenes: string[] = [];
      if (doc.featuredImage?.url) {
        imagenes.push(doc.featuredImage.url);
      }
      if (doc.gallery?.length > 0) {
        for (const item of doc.gallery) {
          if (item.image?.url) {
            imagenes.push(item.image.url);
          }
        }
      }
      // Imagen placeholder si no hay ninguna
      if (imagenes.length === 0) {
        imagenes.push("https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=400&h=300&fit=crop");
      }
      
      grouped[category].push({
        id: String(doc.id),
        titulo: doc.name,
        imagenes,
        descripcion: doc.brand && doc.model ? `${doc.brand} ${doc.model}` : doc.description?.slice(0, 50),
      });
    }

    // Convertir a array de categorías
    const categories: TechCategory[] = [];
    
    for (const [categoryKey, tecnologias] of Object.entries(grouped)) {
      if (tecnologias.length > 0) {
        const config = categoryConfig[categoryKey] || categoryConfig['other'];
        categories.push({
          id: categoryKey,
          label: config.label,
          color: config.color,
          tecnologias,
        });
      }
    }

    return categories;
  } catch (error) {
    console.error('Error fetching tech categories:', error);
    return [];
  }
}
