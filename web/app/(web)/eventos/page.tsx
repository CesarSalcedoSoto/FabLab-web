import type { Metadata } from "next";
import { EventsPageClient } from "./events-page-client";

export const metadata: Metadata = {
  title: "Eventos | FabLab INACAP Los Ángeles",
  description: "Talleres, cursos, charlas y actividades del FabLab INACAP Los Ángeles. ¡Inscríbete y aprende fabricación digital!",
  keywords: ["eventos FabLab", "talleres impresión 3D", "cursos fabricación digital", "INACAP Los Ángeles"],
  openGraph: {
    title: "Eventos | FabLab INACAP Los Ángeles",
    description: "Talleres, cursos y actividades del FabLab INACAP Los Ángeles.",
    type: "website",
    locale: "es_CL",
  },
};

export default function EventosPage() {
  return <EventsPageClient />;
}
