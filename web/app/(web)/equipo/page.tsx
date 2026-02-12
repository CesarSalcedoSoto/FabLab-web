import { EquipoPage } from "@/features/landing/presentation/sections/equipo-page";
import { Navbar } from "@/shared/layout/web/navbar";
import { Footer } from "@/shared/layout/web/footer";
import { getPayload } from 'payload';
import config from "@payload-config";

export const dynamic = 'force-dynamic';

export default async function EquipoPageRoute() {
  const payload = await getPayload({ config });

  // Fetch Global Page Data
  const pageData = await payload.findGlobal({
    slug: 'equipo-page',
  });

  // Fetch Team Members from Users collection (showInTeam = true)
  const { docs: members } = await payload.find({
    collection: 'users',
    sort: 'name',
    where: {
      showInTeam: {
        equals: true,
      },
    },
  });

  // Transform payload data to component types
  const teamMembers = members.map((doc: any) => ({
    id: doc.id,
    nombre: doc.name,
    cargo: doc.jobTitle || '',
    especialidad: doc.jobTitle || '',
    imagen: doc.avatar?.url || '', // avatar field in Users
    imagePosition: doc.imagePosition || '50% 50%',
    bio: doc.bio || '',
    experiencia: doc.experience || '',
    logros: doc.achievements?.map((a: any) => a.achievement) || [],
    social: {
      email: doc.email || '',
      linkedin: doc.linkedin,
      github: doc.github,
      twitter: undefined, // twitter not in Users schema
    },
    esDirectivo: doc.category === 'leadership', // derived
    category: doc.category,
  }));

  const heroStats = pageData.heroStats?.map((s: any) => ({
    text: s.text,
    icon: s.icon,
  })) || undefined;

  return (
    <>
      <EquipoPage
        heroStats={heroStats}
        teamMembers={teamMembers}
      />
    </>
  );
}
