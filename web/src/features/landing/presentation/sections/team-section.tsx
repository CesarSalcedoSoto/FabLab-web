"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Linkedin, Github, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchTeamMembers } from "@/features/landing/infrastructure/team.service";
import type { TeamMemberUI } from "@/features/landing/domain/team.types";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
  imagePosition?: string;
  social?: {
    linkedin?: string;
    github?: string;
    email?: string;
  };
}

// Fallback estático. Se reemplaza al cargar desde Strapi.
const teamMembers: TeamMember[] = [
  {
    name: "Christian David Orellana Benner",
    role: "Ingeniería en Informática",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante de Ingeniería en Informática apasionado por el desarrollo de software y las tecnologías emergentes.",
    social: {
      email: "cesar.salcedo02@inacapmail.cl",
    },
  },
  {
    name: "Christian David Orellana Benner",
    role: "Ingeniería en Telecomunicaciones Conectividad y Redes",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante especializado en telecomunicaciones, conectividad y arquitectura de redes.",
    social: {
      email: "christian.orellana@inacapmail.cl",
    },
  },
  {
    name: "Juan Pablo Erices Fuentealba",
    role: "Ingeniería en Informática",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante de Ingeniería en Informática con interés en desarrollo de aplicaciones y sistemas.",
    social: {
      email: "juan.erices04@inacapmail.cl",
    },
  },
  {
    name: "María José Valenzuela Ulloa",
    role: "Diseño Digital y Web",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante de Diseño Digital y Web, creando experiencias visuales atractivas y funcionales.",
    social: {
      email: "maria.valenzuela61@inacapmail.cl",
    },
  },
  {
    name: "Matías Benjamín Labra Martínez",
    role: "Ingeniería en Automatización y Robótica",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante especializado en sistemas automatizados y robótica industrial.",
    social: {
      email: "matias.labra06@inacapmail.cl",
    },
  },
  {
    name: "Kristóbal Andrés Jesús Sánchez Lizama",
    role: "Analista Programador",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante de Analista Programador enfocado en el desarrollo y análisis de sistemas.",
    social: {
      email: "kristobal.sanchez@inacapmail.cl",
    },
  },
  {
    name: "Herno Cristóbal Vargas Ríos",
    role: "Ingeniería en Automatización y Robótica",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante con pasión por la automatización de procesos y sistemas robóticos.",
    social: {
      email: "Herno.vargas@inacapmail.cl",
    },
  },
  {
    name: "Jordy Brahian Zenteno Salazar",
    role: "Ingeniería en Informática",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante de Ingeniería en Informática con interés en desarrollo de software.",
    social: {
      email: "jordy.zenteno@inacapmail.cl",
    },
  },
  {
    name: "Dilan Sebastián Toledo Luengo",
    role: "Animación Digital y Videojuegos",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante creativo especializado en animación digital y desarrollo de videojuegos.",
    social: {
      email: "dilan.toledo@inacapmail.cl",
    },
  },
  {
    name: "Héctor Egidio Patricio Sanhueza Valdivia",
    role: "Ingeniería en Automatización y Robótica",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante dedicado a la automatización industrial y tecnologías robóticas.",
    social: {
      email: "hector.sanhueza13@inacapmail.cl",
    },
  },
  {
    name: "Benjamín Eduardo Coronado Sanzana",
    role: "Ingeniería en Automatización y Robótica",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante enfocado en sistemas automatizados y control de procesos robóticos.",
    social: {
      email: "benjamin.coronado02@inacapmail.cl",
    },
  },
  {
    name: "Allan Rodrigo Henriquez Ponce",
    role: "Ingeniería en Automatización y Robótica",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop&crop=face",
    bio: "Estudiante con interés en automatización de procesos y desarrollo de sistemas robóticos.",
    social: {
      email: "alan.henriquez02@inacapmail.cl",
    },
  },
];

export function TeamSection() {
  const [members, setMembers] = useState<TeamMemberUI[]>([]);

  useEffect(() => {
    fetchTeamMembers().then((data) => {
      if (data.length) {
        setMembers(data);
      }
    });
  }, []);

  const dataToRender = members.length
    ? members.map((m) => ({
      name: m.name,
      role: m.role || "",
      image: m.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: m.bio || "",
      social: {
        linkedin: m.linkedin,
        github: m.github,
        email: m.email,
      },
    }))
    : teamMembers;

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

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dataToRender.map((member, index) => (
            <motion.div
              key={`${member.name}-${member.role}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group h-80"
            >
              <div className="relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center justify-between">
                {/* Imagen del miembro */}
                <div className="relative mb-3 inline-block">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all duration-500 relative">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="80px"
                      quality={75}
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      style={{ objectPosition: member.imagePosition || '50% 50%' }}
                    />
                  </div>
                </div>

                {/* Información */}
                <div className="text-center mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">
                    {member.name}
                  </h3>
                  <p className="text-orange-600 font-medium text-xs mt-1 line-clamp-1">
                    {member.role}
                  </p>
                </div>

                <p className="text-gray-600/80 text-xs line-clamp-2 mb-3 px-2 font-light italic">
                  "{member.bio}"
                </p>

                {/* Social Links */}
                <div className="flex justify-center gap-2 mt-auto pt-2 border-t border-gray-50 w-full">
                  {member.social?.linkedin && (
                    <a
                      href={member.social.linkedin}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                      aria-label={`LinkedIn de ${member.name}`}
                    >
                      <Linkedin className="w-3 h-3" />
                    </a>
                  )}
                  {member.social?.github && (
                    <a
                      href={member.social.github}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all transform hover:scale-110"
                      aria-label={`GitHub de ${member.name}`}
                    >
                      <Github className="w-3 h-3" />
                    </a>
                  )}
                  {member.social?.email && (
                    <a
                      href={`mailto:${member.social.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
                      aria-label={`Email de ${member.name}`}
                    >
                      <Mail className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
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
