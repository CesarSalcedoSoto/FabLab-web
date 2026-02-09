"use client";

import React from "react";
import Image from "next/image";
import type { TechnologiesSection as TechnologiesSectionType } from "@/features/projecs/domain";

interface TechnologiesSectionProps {
  section: TechnologiesSectionType;
}

const categoriasConfig: Record<string, { label: string; bgColor: string }> = {
  frontend: { label: "Frontend", bgColor: "bg-blue-500" },
  backend: { label: "Backend", bgColor: "bg-green-500" },
  database: { label: "Base de Datos", bgColor: "bg-purple-500" },
  devops: { label: "DevOps", bgColor: "bg-orange-500" },
  design: { label: "Diseño", bgColor: "bg-pink-500" },
  hardware: { label: "Hardware", bgColor: "bg-gray-700" },
  other: { label: "Otros", bgColor: "bg-gray-500" },
};

export function TechnologiesSection({ section }: TechnologiesSectionProps) {
  // Agrupar tecnologías por categoría
  const tecnologiasPorCategoria = section.tecnologias.reduce(
    (acc, tech) => {
      const categoria = tech.categoria || "other";
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(tech);
      return acc;
    },
    {} as Record<string, typeof section.tecnologias>
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          {section.titulo || "Tecnologías Utilizadas"}
        </h2>
        {section.contenido && (
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {section.contenido}
          </p>
        )}

        <div className="max-w-5xl mx-auto space-y-10">
          {Object.entries(tecnologiasPorCategoria).map(([categoria, techs]) => {
            const config = categoriasConfig[categoria] || categoriasConfig.other;
            
            return (
              <div key={categoria}>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`w-3 h-3 rounded-full ${config.bgColor}`}
                  />
                  <h3 className="text-xl font-semibold text-gray-800">
                    {config.label}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {techs.map((tech) => (
                    <div
                      key={tech.id}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
                    >
                      <div className="flex flex-col items-center text-center">
                        {tech.icono ? (
                          <div className="w-12 h-12 mb-3 flex items-center justify-center relative">
                            <Image
                              src={tech.icono}
                              alt={tech.nombre}
                              width={40}
                              height={40}
                              className="object-contain"
                              quality={75}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-12 h-12 mb-3 rounded-lg ${config.bgColor} flex items-center justify-center text-white font-bold text-lg`}
                          >
                            {tech.nombre.charAt(0)}
                          </div>
                        )}
                        <h4 className="font-medium text-gray-900 text-sm">
                          {tech.nombre}
                        </h4>
                        {tech.descripcion && (
                          <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {tech.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
