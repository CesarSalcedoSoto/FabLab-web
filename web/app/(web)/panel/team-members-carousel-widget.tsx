"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/shared/ui/badges/badge";
import type { PublicSpecialist } from "./actions";

interface TeamMembersCarouselWidgetProps {
  members: PublicSpecialist[];
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "MI"
  );
}

function getCategoryLabel(category?: string): string {
  if (!category) return "Miembro";

  const normalized = category.toLowerCase();
  if (normalized === "leadership") return "Liderazgo";
  if (normalized === "specialist") return "Especialista";
  if (normalized === "teacher") return "Docente";
  return "Miembro";
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

  const current = activeMembers[currentIndex];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-slate-50 to-blue-50 p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {getInitials(current.name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{current.name}</p>
            <p className="text-xs text-gray-600 truncate">{current.role || "Rol no definido"}</p>
            <div className="mt-2">
              <Badge variant="outline" className="text-[10px] h-5 px-2">
                {getCategoryLabel(current.category)}
              </Badge>
            </div>
          </div>
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
