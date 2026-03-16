"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { PublicSpecialist } from "./actions";

interface TeamMembersCarouselWidgetProps {
  members: PublicSpecialist[];
}

function getCategoryLabel(category?: string): string {
  if (!category) return "Colaborador";

  const normalized = category.toLowerCase();
  if (normalized === "leadership") return "Directivo";
  if (normalized === "specialist") return "Especialista";
  return "Colaborador";
}

function getCategoryClasses(category?: string): string {
  if (!category) return "bg-green-100 text-green-700";

  const normalized = category.toLowerCase();
  if (normalized === "leadership") return "bg-purple-100 text-purple-700";
  if (normalized === "specialist") return "bg-blue-100 text-blue-700";
  return "bg-green-100 text-green-700";
}

export function TeamMembersCarouselWidget({ members }: TeamMembersCarouselWidgetProps) {
  const activeMembers = useMemo(
    () => members.filter((member) => member.active),
    [members],
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeMembers.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeMembers.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [activeMembers.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeMembers.length]);

  if (activeMembers.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Sin miembros visibles en el organigrama</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeMembers.map((member) => {
            const roleText = member.role || member.specialty || "Especialista";
            const categoryLabel = getCategoryLabel(member.category);
            const categoryClasses = getCategoryClasses(member.category);
            const imageSrc = member.image || "/images/placeholders/facebook-avatar.svg";

            return (
              <div key={String(member.id)} className="w-full shrink-0">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-16 h-16 sm:w-10 sm:h-10 rounded-full bg-white ring-1 ring-gray-200 overflow-hidden flex-shrink-0">
                    <Image
                      src={imageSrc}
                      alt={member.name || "Especialista"}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="w-full min-w-0 text-center sm:text-left">
                    <p className="font-medium text-xs sm:text-sm truncate px-1">{member.name}</p>
                    <p className="hidden sm:block text-xs text-gray-500 truncate">{roleText}</p>
                  </div>

                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${categoryClasses}`}>
                    {categoryLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeMembers.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {activeMembers.map((member, index) => (
            <button
              key={String(member.id)}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ver miembro ${member.name}`}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? "w-5 bg-blue-500" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
