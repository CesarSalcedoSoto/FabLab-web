"use client";

import Image from "next/image";
import { Linkedin, Github, Mail, Award } from "lucide-react";
import type { TeamMember } from "./types";

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  onSelect: (member: TeamMember) => void;
}

export function TeamMemberCard({ member, index, onSelect }: TeamMemberCardProps) {
  const isMiguelContreras = member.nombre.toLowerCase().includes("miguel angel contreras") || 
                            member.nombre.toLowerCase().includes("miguel ángel contreras");
  
  return (
    <article
      onClick={() => onSelect(member)}
      className="group cursor-pointer h-full"
    >
      <div className="relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 h-full flex flex-col items-center justify-between">
        {isMiguelContreras && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-semibold rounded-full shadow-sm">
              <Award className="w-3 h-3" />
              Líder
            </span>
          </div>
        )}

        <div className="w-full text-center">
          <div className="relative mb-3 inline-block">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all duration-500 relative">
              {member.imagen ? (
                <Image
                  src={member.imagen}
                  alt={member.nombre}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  style={{ objectPosition: member.imagePosition || '50% 50%' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {member.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-3">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">
              {member.nombre}
            </h3>
            <p className="text-orange-600 font-medium text-xs mt-1 line-clamp-1">{member.cargo}</p>
            <p className="text-gray-500 text-[10px] mt-1 line-clamp-1">{member.especialidad}</p>
          </div>

          <p className="text-gray-600/80 text-xs line-clamp-2 mb-3 px-2 font-light italic">"{member.bio}"</p>
        </div>

        <div className="flex justify-center gap-2 mt-auto pt-2 border-t border-gray-50 w-full">
          {member.social.linkedin && (
            <a
              href={member.social.linkedin}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
            >
              <Linkedin className="w-3 h-3" />
            </a>
          )}
          {member.social.github && (
            <a
              href={member.social.github}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all transform hover:scale-110"
            >
              <Github className="w-3 h-3" />
            </a>
          )}
          <a
            href={`mailto:${member.social.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
          >
            <Mail className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
