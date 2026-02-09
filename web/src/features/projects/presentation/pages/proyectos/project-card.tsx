"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getCategoryStyles } from "./utils";
import type { Proyecto } from "./types";

interface ProjectCardProps {
    proyecto: Proyecto;
    onOpenDetail: (proyecto: Proyecto) => void;
}

export function ProjectCard({ proyecto, onOpenDetail }: ProjectCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (proyecto.imagenes.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % proyecto.imagenes.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [proyecto.imagenes.length]);

    return (
        <article
            className="group cursor-pointer"
            onClick={() => onOpenDetail(proyecto)}
        >
            <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                        src={proyecto.imagenes[currentImageIndex]}
                        alt={proyecto.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        quality={75}
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white text-sm font-medium">Click para ver detalles</span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span
                            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getCategoryStyles(
                                proyecto.categoria
                            )}`}
                        >
                            {proyecto.categoria}
                        </span>
                    </div>

                    {/* Image indicators */}
                    {proyecto.imagenes.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                            {proyecto.imagenes.slice(0, 5).map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? "bg-white w-3" : "bg-white/50"
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1">
                        {proyecto.titulo}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{proyecto.descripcion}</p>

                    {/* Creadores Preview */}
                    <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                            {proyecto.creadores.slice(0, 3).map((creador, idx) => (
                                creador.avatar ? (
                                    <div key={idx} className="relative w-7 h-7 rounded-full border-2 border-white overflow-hidden">
                                        <Image src={creador.avatar} alt={creador.nombre} fill sizes="28px" className="object-cover" />
                                    </div>
                                ) : (
                                    <div key={idx} className="w-7 h-7 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center">
                                        <span className="text-orange-600 text-xs font-medium">{creador.nombre.charAt(0)}</span>
                                    </div>
                                )
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">
                            {proyecto.creadores.length} {proyecto.creadores.length === 1 ? "creador" : "creadores"}
                        </span>
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                        {proyecto.tecnologias.slice(0, 3).map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md"
                            >
                                {tech}
                            </span>
                        ))}
                        {proyecto.tecnologias.length > 3 && (
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-md">
                                +{proyecto.tecnologias.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
