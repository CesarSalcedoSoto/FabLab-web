import { getPayload } from 'payload';
import config from "@payload-config";
import { ProyectosPublicPage } from "@/features/projects/presentation/pages/proyectos-public";
import type { ProjectPublic } from "@/features/projects/presentation/pages/proyectos-public";

export const dynamic = 'force-dynamic';

export default async function ProyectosPageRoute() {
  const payload = await getPayload({ config });

  // Fetch published projects
  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-featured,order,-createdAt',
    limit: 100,
    depth: 2, // Para obtener los datos del teamMember
  });

  // Transform to component types
  const projects: ProjectPublic[] = docs.map((doc: any) => ({
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    category: doc.category,
    description: doc.description,
    featuredImage: typeof doc.featuredImage === 'object' ? doc.featuredImage?.url : null,
    gallery: doc.gallery?.map((g: any) => typeof g.image === 'object' ? g.image?.url : null).filter(Boolean) || [],
    technologies: doc.technologies?.map((t: any) => t.name) || [],
    creators: doc.creators?.map((c: any) => {
      // Si hay un teamMember (usuario), usamos sus datos
      const member = c.teamMember;
      if (member && typeof member === 'object') {
        return {
          name: member.name || 'Sin nombre',
          role: c.role || member.jobTitle || '',
          avatar: typeof member.avatar === 'object' ? member.avatar?.url : undefined,
        };
      }
      // Si no, usamos el nombre externo
      return {
        name: c.externalName || 'Anónimo',
        role: c.role || '',
      };
    }) || [],
    year: doc.year || new Date().getFullYear(),
    featured: doc.featured || false,
    objective: doc.objective || '',
    problemSolved: doc.problemSolved || '',
    links: doc.links?.map((link: any) => ({
      label: link.label || 'Enlace',
      url: link.url || '#',
    })) || [],
  }));

  // Separate featured projects
  const featuredProjects = projects.filter(p => p.featured);

  return (
    <ProyectosPublicPage
      projects={projects}
      featuredProjects={featuredProjects}
    />
  );
}
