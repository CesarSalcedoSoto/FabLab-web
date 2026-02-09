"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    X,
    Github,
    ExternalLink,
    Users,
    Target,
    Wrench,
    Layers,
    ChevronLeft,
    ChevronRight,
    Play,
    FileCode
} from "lucide-react";
import { getCategoryStyles } from "./utils";
import type { Proyecto } from "./types";

interface ProjectDetailModalProps {
    proyecto: Proyecto;
    isOpen: boolean;
    onClose: () => void;
}

export function ProjectDetailModal({ proyecto, isOpen, onClose }: ProjectDetailModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentImageIndex(0);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % proyecto.imagenes.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + proyecto.imagenes.length) % proyecto.imagenes.length);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-3xl z-50 overflow-hidden shadow-2xl flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex-1 overflow-y-auto">
                    <div className="grid lg:grid-cols-2 min-h-full">
                        {/* Left: Image Gallery */}
                        <div className="relative bg-gray-900 lg:sticky lg:top-0 lg:h-screen">
                            <div className="relative h-[40vh] lg:h-full">
                                <Image
                                    src={proyecto.imagenes[currentImageIndex]}
                                    alt={`${proyecto.titulo} - Imagen ${currentImageIndex + 1}`}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    quality={80}
                                    className="object-cover"
                                />

                                {/* Navigation Arrows */}
                                {proyecto.imagenes.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                {/* Image Counter */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
                                    {currentImageIndex + 1} / {proyecto.imagenes.length}
                                </div>
                            </div>
                        </div>

                        {/* Right: Project Details */}
                        <div className="p-6 lg:p-10 overflow-y-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 ${getCategoryStyles(proyecto.categoria)}`}>
                                    {proyecto.categoria}
                                </span>
                                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                    {proyecto.titulo}
                                </h2>
                                <p className="text-gray-600 text-lg">{proyecto.descripcion}</p>
                                <p className="text-sm text-gray-400 mt-2">Año: {proyecto.fecha}</p>
                            </div>

                            {/* Creadores */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-lg font-semibold text-gray-900">Equipo Creador</h3>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {proyecto.creadores.map((creador, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 pr-5">
                                            {creador.avatar ? (
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                                    <Image src={creador.avatar} alt={creador.nombre} fill sizes="48px" className="object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                                    <span className="text-orange-600 font-semibold text-lg">
                                                        {creador.nombre.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{creador.nombre}</p>
                                                <p className="text-sm text-gray-500">{creador.rol}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Objetivo y Problema */}
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-orange-50 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target className="w-5 h-5 text-orange-600" />
                                        <h3 className="font-semibold text-gray-900">Objetivo</h3>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{proyecto.objetivo}</p>
                                </div>
                                <div className="bg-blue-50 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Layers className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-semibold text-gray-900">Problema Resuelto</h3>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{proyecto.problemaResuelto}</p>
                                </div>
                            </div>

                            {/* Tecnologías */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wrench className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-lg font-semibold text-gray-900">Tecnologías Utilizadas</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {proyecto.tecnologias.map((tech, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-full text-sm font-medium transition-colors"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Proceso de Fabricación */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Layers className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-lg font-semibold text-gray-900">Proceso de Fabricación</h3>
                                </div>
                                <div className="space-y-3">
                                    {proyecto.procesoFabricacion.map((paso, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                                                {idx + 1}
                                            </div>
                                            <p className="text-gray-700 pt-1">{paso}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Links Externos */}
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recursos y Enlaces</h3>
                                <div className="flex flex-wrap gap-3">
                                    {proyecto.githubUrl && (
                                        <a
                                            href={proyecto.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors"
                                        >
                                            <Github className="w-5 h-5" />
                                            Código Fuente
                                        </a>
                                    )}
                                    {proyecto.thingiverseUrl && (
                                        <a
                                            href={proyecto.thingiverseUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                                        >
                                            <FileCode className="w-5 h-5" />
                                            Archivos 3D
                                        </a>
                                    )}
                                    {proyecto.videoUrl && (
                                        <a
                                            href={proyecto.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                                        >
                                            <Play className="w-5 h-5" />
                                            Ver Video
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
