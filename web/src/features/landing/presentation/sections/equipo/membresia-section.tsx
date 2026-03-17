"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/buttons/button";

export function MembresiaSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-orange-100/50">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-4 py-2 bg-orange-500/20 text-orange-600 rounded-full text-sm font-semibold mb-4">
              Forma Parte del Equipo
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Criterios para formar parte de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                FabLab INACAP
              </span>
            </h2>
            {/* Criterios en grid 2x2 */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {/* Box 1 - Estudiantes: Proyecto */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎓</span>
                  <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Estudiantes INACAP</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Proyecto demostrativo</h4>
                <p className="text-sm text-gray-600">Presentar un proyecto que demuestre habilidad o talento.</p>
              </div>

              {/* Box 2 - Estudiantes: Asistencia */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎓</span>
                  <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Estudiantes INACAP</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Asistencia mínima</h4>
                <p className="text-sm text-gray-600">Asistencia superior al 65%.</p>
              </div>

              {/* Box 3 - Estudiantes: Rendimiento */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎓</span>
                  <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Estudiantes INACAP</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Rendimiento académico</h4>
                <p className="text-sm text-gray-600">Al menos 80% de asignaturas aprobadas con nota superior a 5.</p>
              </div>

              {/* Box 4 - Externos */}
              <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🌐</span>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Externos</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Propuesta técnica</h4>
                <p className="text-sm text-gray-600">Presentar proyecto o propuesta técnica para evaluación.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/contacto">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg rounded-full">
                  Únete Ahora
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/tecnologias">
                <Button variant="outline" className="px-8 py-6 text-lg rounded-full border-2">
                  Ver Equipamiento
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop"
                    alt="FabLab workspace"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-64 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop"
                    alt="3D printing"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative h-64 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop"
                    alt="Electronics lab"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop"
                    alt="Fabricación digital"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl p-6 flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">+45</p>
                <p className="text-sm text-gray-500">Especialistas</p>
              </div>
              <div className="text-center border-l border-gray-200 pl-8">
                <p className="text-3xl font-bold text-orange-600">+8</p>
                <p className="text-sm text-gray-500">Proyectos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
