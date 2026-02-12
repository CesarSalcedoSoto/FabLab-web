import type { Metadata } from "next";
import { GalleryPageClient } from "./gallery-page-client";

export const metadata: Metadata = {
  title: "Galería | FabLab INACAP Los Ángeles",
  description: "Explora fotos y videos de proyectos, eventos y actividades del FabLab INACAP Los Ángeles.",
  keywords: ["galería FabLab", "fotos impresión 3D", "proyectos fabricación digital", "videos FabLab"],
  openGraph: {
    title: "Galería | FabLab INACAP Los Ángeles",
    description: "Fotos y videos del FabLab INACAP Los Ángeles.",
    type: "website",
    locale: "es_CL",
  },
};

export default function GaleriaPage() {
  return <GalleryPageClient />;
}
