"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Linkedin, Github, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTeamMembers } from "@/features/landing/infrastructure/team.service";
import type { TeamMemberUI } from "@/features/landing/domain/team.types";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  category?: "leadership" | "specialist" | "collaborator" | "docente";
  homeArea?: "coordinacion" | "docente" | "proyectos-digitales" | "proyectos-fisicos" | "diseno-animacion" | "legado";
  technicalDomain?: string[];
  imagePosition?: string;
  social?: {
    linkedin?: string;
    github?: string;
    email?: string;
  };
}

export function TeamSection() {
  const [members, setMembers] = useState<TeamMemberUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"liderazgo" | "equipo">("liderazgo");

  useEffect(() => {
    fetchTeamMembers()
      .then((data) => {
        setMembers(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const dataToRender: TeamMember[] = members.map((m) => ({
    id: String(m.id),
    name: m.name,
    role: m.role || "",
    image: m.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    bio: m.bio || "",
    category: m.category,
    homeArea: m.homeArea,
    technicalDomain: m.technicalDomain || [],
    social: {
      linkedin: m.linkedin,
      github: m.github,
      email: m.email,
    },
  }));

  const normalize = (value?: string) => (value || "").toLowerCase();

  const inferArea = (member: TeamMember): TeamMember["homeArea"] => {
    if (member.homeArea) return member.homeArea;
    if (member.category === "leadership") return "coordinacion";
    if (member.category === "docente") return "docente";

    const role = normalize(member.role);
    const domain = (member.technicalDomain || []).map(normalize).join(" ");
    const haystack = `${role} ${domain}`;

    if (haystack.includes("dise") || haystack.includes("anim") || haystack.includes("ux") || haystack.includes("ui")) {
      return "diseno-animacion";
    }
    if (haystack.includes("robot") || haystack.includes("electr") || haystack.includes("mecat") || haystack.includes("fabric") || haystack.includes("iot") || haystack.includes("impresi")) {
      return "proyectos-fisicos";
    }
    return "proyectos-digitales";
  };

  const leaders = dataToRender.filter((m) => inferArea(m) === "coordinacion");
  const mentors = dataToRender.filter((m) => inferArea(m) === "docente");
  const digital = dataToRender.filter((m) => inferArea(m) === "proyectos-digitales");
  const physical = dataToRender.filter((m) => inferArea(m) === "proyectos-fisicos");
  const design = dataToRender.filter((m) => inferArea(m) === "diseno-animacion");

  const legacy = dataToRender
    .filter((m) => m.category === "collaborator" || inferArea(m) === "legado")
    .slice(0, 12);

  const MemberCard = ({ member, accent }: { member: TeamMember; accent: string }) => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${accent} relative flex-shrink-0`}>
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
            style={{ objectPosition: member.imagePosition || "50% 50%" }}
          />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 leading-tight">{member.name}</p>
          <p className="text-sm text-orange-600 font-medium leading-tight mt-0.5">{member.role}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{member.bio}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {member.social?.linkedin && (
          <a href={member.social.linkedin} className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-600 hover:text-white transition-colors" aria-label={`LinkedIn de ${member.name}`}>
            <Linkedin className="w-3.5 h-3.5" />
          </a>
        )}
        {member.social?.github && (
          <a href={member.social.github} className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-900 hover:text-white transition-colors" aria-label={`GitHub de ${member.name}`}>
            <Github className="w-3.5 h-3.5" />
          </a>
        )}
        {member.social?.email && (
          <a href={`mailto:${member.social.email}`} className="p-1.5 rounded-full bg-gray-50 text-gray-500 hover:bg-orange-500 hover:text-white transition-colors" aria-label={`Email de ${member.name}`}>
            <Mail className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );

  // No mostrar la sección si no hay miembros
  if (!isLoading && dataToRender.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decoración de líneas naranjas */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4"
          >
            Nuestro Equipo
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Las mentes detrás de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              FabLab
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Un equipo multidisciplinario comprometido con la innovación,
            la educación y el desarrollo tecnológico de nuestra comunidad.
          </motion.p>
        </motion.div>

        {/* Organigrama con tabs */}
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab("liderazgo")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === "liderazgo" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Liderazgo ({leaders.length + mentors.length})
            </button>
            <button
              onClick={() => setActiveTab("equipo")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === "equipo" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Nuestro Equipo ({digital.length + physical.length + design.length + legacy.length})
            </button>
          </div>

          {activeTab === "liderazgo" && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Coordinadores</h3>
                  <span className="text-sm text-gray-500">{leaders.length} miembros</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaders.map((member) => (
                    <MemberCard key={member.id} member={member} accent="ring-orange-400" />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Docentes Mentores</h3>
                  <span className="text-sm text-gray-500">{mentors.length} miembros</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentors.map((member) => (
                    <MemberCard key={member.id} member={member} accent="ring-emerald-400" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "equipo" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Proyectos Digitales</h3>
                    <span className="text-xs text-gray-500">{digital.length}</span>
                  </div>
                  <div className="space-y-3">
                    {digital.slice(0, 6).map((member) => (
                      <MemberCard key={member.id} member={member} accent="ring-blue-400" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Proyectos Físicos</h3>
                    <span className="text-xs text-gray-500">{physical.length}</span>
                  </div>
                  <div className="space-y-3">
                    {physical.slice(0, 6).map((member) => (
                      <MemberCard key={member.id} member={member} accent="ring-emerald-400" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Diseño y Animación</h3>
                    <span className="text-xs text-gray-500">{design.length}</span>
                  </div>
                  <div className="space-y-3">
                    {design.slice(0, 6).map((member) => (
                      <MemberCard key={member.id} member={member} accent="ring-orange-400" />
                    ))}
                  </div>
                </div>
              </div>

              {legacy.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Legado por Generación</h3>
                    <span className="text-xs text-gray-500">{legacy.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {legacy.map((member) => (
                      <MemberCard key={member.id} member={member} accent="ring-amber-400" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-500 mb-6">
            ¿Quieres ser parte de nuestro equipo?
          </p>
          <a
            href="/contacto"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-lg hover:shadow-orange-300/50 hover:scale-105 transition-all duration-300"
          >
            Únete a FabLab
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
