export interface StrapiImageFormat {
  url: string;
  width?: number;
  height?: number;
}

export interface StrapiImage {
  url: string;
  formats?: {
    thumbnail?: StrapiImageFormat;
    small?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    large?: StrapiImageFormat;
  };
}

export interface StrapiTeamMemberAttr {
  nombre: string;
  slug: string;
  cargo?: string;
  especialidad?: string;
  bio?: string;
  experiencia?: string;
  email?: string;
  telefono?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  orden?: number;
  esDirectivo?: boolean;
  foto?: { data?: { attributes: StrapiImage } };
}

export interface StrapiTeamMember {
  id: number;
  attributes: StrapiTeamMemberAttr;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
}

export interface TeamMemberUI {
  id: number | string;
  name: string;
  role?: string;
  category?: 'leadership' | 'specialist' | 'collaborator' | 'docente';
  specialty?: string;
  bio?: string;
  experience?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  order?: number;
  isDirector?: boolean;
  image?: string;
  personalSkills?: string[];
  technicalDomain?: string[];
  homeArea?: 'coordinacion' | 'docente' | 'proyectos-digitales' | 'proyectos-fisicos' | 'diseno-animacion' | 'legado';
}
