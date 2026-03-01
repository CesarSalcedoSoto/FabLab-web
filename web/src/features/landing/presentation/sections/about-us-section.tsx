"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Lightbulb, Rocket, Heart } from "lucide-react";
import DotGridBackground from "@/shared/ui/backgrounds/dot-grid";
import { TrapezoidDivider } from "@/shared/ui/decorations/trapezoid-divider";
import { getTeamMembersCount } from "./about-us-actions";

export function AboutUsSection() {
  const [teamCount, setTeamCount] = useState<number>(12);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTeamCount = async () => {
      try {
        const count = await getTeamMembersCount();
        if (mounted) {
          setTeamCount(count);
        }
      } catch (error) {
        console.error("Error loading team count:", error);
        // Keep default value of 12
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTeamCount();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="relative text-white overflow-hidden">
      {/* Trapecio superior como separador del hero */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <TrapezoidDivider color="#ffffff" />
      </div>

      {/* Fondo principal con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />

      {/* Puntitos de fondo */}
      <div className="absolute inset-0 opacity-20">
        <DotGridBackground gap={30} dotSize={2} />
      </div>

      {/* Fondo decorativo con blurs */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      {/* Contenido con padding */}
      <div className="pt-32 pb-24">

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Pregunta destacada */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
            >
              ¿Quiénes somos?
            </motion.h2>

            {/* Descripción inspiradora */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-12"
            >
              Somos un equipo de{" "}
              <span className="text-blue-400 font-semibold">
                {isLoading ? "..." : teamCount} personas
              </span>{" "}
              comprometidas con el desarrollo tecnológico y la fabricación digital en INACAP.
              Integramos disciplinas como ingeniería, diseño y desarrollo técnico, trabajando
              colaborativamente para generar soluciones con impacto real. Creemos que la innovación
              nace del talento individual y se potencia cuando se articula en equipo,{" "}
              <span className="text-purple-400 font-semibold">
                transformando ideas en soluciones concretas
              </span>{" "}
              para el entorno productivo y la sociedad.
            </motion.p>

            {/* Valores destacados */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
            >
              {[
                { icon: Users, label: "Colaboración", color: "text-blue-400" },
                { icon: Lightbulb, label: "Innovación", color: "text-yellow-400" },
                { icon: Rocket, label: "Creatividad", color: "text-purple-400" },
                { icon: Heart, label: "Pasión", color: "text-red-400" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="flex flex-col items-center gap-3 p-4"
                >
                  <div className={`p-3 rounded-full bg-white/10 ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* Frase de cierre */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-lg text-gray-400 mt-12 italic"
            >
              &quot;Donde la tecnología se encuentra con la creatividad, nacen proyectos extraordinarios.&quot;
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Trapecio inferior para transición a siguiente sección */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <TrapezoidDivider color="#1f2937" inverted />
      </div>
    </section>
  );
}
