import type { Metadata } from "next";
import { ResourcesPageClient } from "./resources-page-client";

export const metadata: Metadata = {
  title: "Recursos | FabLab INACAP Los Ángeles",
  description: "Descarga guías, documentos, plantillas y archivos útiles para tus proyectos de fabricación digital.",
  keywords: ["recursos FabLab", "guías impresión 3D", "plantillas diseño", "documentos fabricación digital"],
  openGraph: {
    title: "Recursos | FabLab INACAP Los Ángeles",
    description: "Guías, documentos y archivos descargables del FabLab INACAP.",
    type: "website",
    locale: "es_CL",
  },
};

export default function RecursosPage() {
  return <ResourcesPageClient />;
}
