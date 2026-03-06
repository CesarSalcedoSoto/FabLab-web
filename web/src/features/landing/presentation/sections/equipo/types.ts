/**
 * Types - Equipo Page
 */

import type { LucideIcon } from "lucide-react";

export interface TeamMember {
  id: string;
  nombre: string;
  cargo: string;
  especialidad: string;
  imagen: string;
  imagePosition?: string;
  bio: string;
  experiencia: string;
  logros: string[];
  proyectos?: number;
  social: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    email: string;
  };
  esDirectivo: boolean;
  category?: 'leadership' | 'specialist' | 'collaborator' | 'docente';
  habilidadesPersonales?: string[];
  dominioTecnico?: string[];
  modalidad?: string;
  docenteResponsable?: string;
  disponibilidadSemanal?: {
    day: string;
    enabled: boolean;
    timeSlots: { start: string; end: string }[];
  }[];
}

export interface MiembroDestacado {
  id: string;
  nombre: string;
  imagen: string;
  especialidad: string;
  proyectoDestacado: string;
  testimonio: string;
  miembroDesde: string;
}

export interface ValorLab {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  color: string;
}

export interface BeneficioMembresia {
  titulo: string;
  descripcion: string;
  icono: string;
}
