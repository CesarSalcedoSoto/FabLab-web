"use client";

import { useState } from "react";
import Image from "next/image";
import { HeroEquipo } from "./hero-equipo";
import { TeamMemberCard } from "./team-member-card";
import { TeamMemberModal } from "./team-member-modal";
import { ValoresSection } from "./valores-section";
import { MembresiaSection } from "./membresia-section";
import { heroStats as defaultHeroStats } from "./data";
import type { TeamMember } from "./types";

interface EquipoPageProps {
  heroStats?: any[];
  teamMembers?: TeamMember[];
}

export function EquipoPage({ heroStats = defaultHeroStats, teamMembers = [] }: EquipoPageProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const directivos = teamMembers.filter((m) => m.category === 'leadership' || (!m.category && m.esDirectivo));
  const docentes = teamMembers.filter((m) => m.category === 'docente');
  const specialists = teamMembers.filter((m) => m.category === 'specialist' || (!m.category && !m.esDirectivo));
  const collaborators = teamMembers.filter((m) => m.category === 'collaborator');

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroEquipo stats={heroStats} />

      {/* Directivos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              Liderazgo
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Equipo Directivo
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Los líderes que guían la visión y estrategia de FabLab INACAP.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {directivos.map((member, index) => (
              <div key={member.id} className="h-64">
                <TeamMemberCard
                  member={member}
                  index={index}
                  onSelect={setSelectedMember}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialists */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              Expertos
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nuestros Especialistas
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Profesionales apasionados que hacen posible cada proyecto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {specialists.map((member, index) => (
              <div key={member.id} className="h-80">
                <TeamMemberCard
                  member={member}
                  index={index}
                  onSelect={setSelectedMember}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaborators */}
      {docentes.length > 0 && (
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-semibold mb-4">
                Docencia
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Nuestros Docentes
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Profesores que forman a la próxima generación de makers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {docentes.map((member, index) => (
                <div key={member.id} className="h-80">
                  <TeamMemberCard
                    member={member}
                    index={index}
                    onSelect={setSelectedMember}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Collaborators */}
      {collaborators.length > 0 && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Otros Colaboradores</h3>
              <p className="text-gray-500 text-sm">Equipo de apoyo y colaboradores externos</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {collaborators.map((member) => (
                <div
                  key={member.id}
                  className="relative group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-orange-400 transition-all cursor-pointer relative">
                    <Image
                      src={member.imagen || "/images/placeholders/facebook-avatar.svg"}
                      alt={member.nombre}
                      fill
                      className="object-cover"
                      style={{ objectPosition: member.imagePosition || '50% 50%' }}
                    />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    {member.nombre}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ValoresSection />
      <MembresiaSection />

      <TeamMemberModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
