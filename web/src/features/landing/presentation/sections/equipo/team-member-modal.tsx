"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Linkedin, Github, Mail, Twitter, Award, Calendar, X, Briefcase } from "lucide-react";
import type { TeamMember } from "./types";

interface TeamMemberModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamMemberModal({ member, isOpen, onClose }: TeamMemberModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!member || !isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />
      <div className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-3xl z-50 overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="h-full overflow-y-auto">
          <div className="grid md:grid-cols-2 min-h-full">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 md:p-12 flex flex-col justify-center items-center text-white">
              <div className="w-48 h-48 rounded-3xl overflow-hidden ring-4 ring-white/30 mb-6 relative">
                {member.imagen ? (
                  <Image
                    src={member.imagen}
                    alt={member.nombre}
                    fill
                    className="object-cover"
                    style={{ objectPosition: member.imagePosition || '50% 50%' }}
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white/60">
                      {member.nombre.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">{member.nombre}</h2>
              <p className="text-orange-100 font-medium mb-1">{member.cargo}</p>
              <p className="text-orange-200 text-sm mb-6">{member.especialidad}</p>

              <div className="flex gap-3">
                {member.social.linkedin && (
                  <a href={member.social.linkedin} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {member.social.github && (
                  <a href={member.social.github} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {member.social.twitter && (
                  <a href={member.social.twitter} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                <a href={`mailto:${member.social.email}`} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Biografía</h3>
                <p className="text-gray-600 leading-relaxed">{member.bio}</p>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Logros Destacados</h3>
                <ul className="space-y-3">
                  {member.logros.map((logro, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Award className="w-3 h-3 text-orange-600" />
                      </div>
                      <span className="text-gray-700">{logro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {member.habilidadesPersonales && member.habilidadesPersonales.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Habilidades personales</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.habilidadesPersonales.map((skill) => (
                      <span key={skill} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {member.dominioTecnico && member.dominioTecnico.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dominio técnico</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.dominioTecnico.map((domain) => (
                      <span key={domain} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">{domain}</span>
                    ))}
                  </div>
                </div>
              )}

              {(member.modalidad || member.disponibilidadSemanal?.length) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Disponibilidad</h3>
                  {member.modalidad && (
                    <p className="text-sm text-gray-600 mb-2">
                      Modalidad: <span className="font-medium text-gray-900 capitalize">{member.modalidad}</span>
                    </p>
                  )}
                  <div className="space-y-2">
                    {(member.disponibilidadSemanal || []).filter((day) => day.enabled).map((day) => (
                      <div key={day.day} className="text-sm text-gray-700">
                        <span className="font-medium">{day.day}:</span>{' '}
                        {day.timeSlots.map((slot) => `${slot.start}-${slot.end}`).join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {member.proyectos !== undefined && (
                <div className="mb-8 p-4 bg-orange-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Proyectos Completados</p>
                      <p className="text-2xl font-bold text-orange-600">{member.proyectos}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experiencia</p>
                  <p className="text-xl font-bold text-gray-900">{member.experiencia}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
