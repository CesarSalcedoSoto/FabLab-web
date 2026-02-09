"use client";

import React from "react";
import type { TeamSection as TeamSectionType } from "@/features/projecs/domain";
import { Linkedin, Github } from "lucide-react";
import Image from "next/image";

interface TeamSectionProps {
  section: TeamSectionType;
}

export function TeamSection({ section }: TeamSectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          {section.titulo || "Nuestro Equipo"}
        </h2>
        {section.contenido && (
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {section.contenido}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {section.miembros.map((miembro) => (
            <div
              key={miembro.id}
              className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow group"
            >
              {/* Avatar */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                {miembro.avatar ? (
                  <Image
                    src={miembro.avatar}
                    alt={miembro.nombre}
                    fill
                    sizes="96px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {miembro.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {miembro.nombre}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{miembro.rol}</p>

              {/* Social Links */}
              <div className="flex justify-center gap-3">
                {miembro.linkedin && (
                  <a
                    href={miembro.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-200 hover:bg-blue-500 hover:text-white transition-colors"
                    aria-label={`LinkedIn de ${miembro.nombre}`}
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {miembro.github && (
                  <a
                    href={miembro.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
                    aria-label={`GitHub de ${miembro.nombre}`}
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
