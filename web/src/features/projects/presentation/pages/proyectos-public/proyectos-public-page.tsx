"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Cpu, Code, Palette, Radio, ExternalLink, X, ChevronRight, ChevronLeft, ImageIcon } from "lucide-react";
import { motion as framerMotion } from "framer-motion";
import { Input } from "@/shared/ui/inputs/input";
import { Button } from "@/shared/ui/buttons/button";
import { useImagePreloader } from "@/shared/hooks";
import type { ProjectPublic } from "./types";
import { CATEGORY_LABELS } from "./types";

interface ProyectosPublicPageProps {
    projects: ProjectPublic[];
    featuredProjects?: ProjectPublic[];
}

export function ProyectosPublicPage({ projects, featuredProjects = [] }: ProyectosPublicPageProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectPublic | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Memoizar array de imágenes del proyecto seleccionado
    const selectedProjectImages = useMemo(() => {
        if (!selectedProject) return [];
        return [selectedProject.featuredImage, ...selectedProject.gallery].filter(Boolean) as string[];
    }, [selectedProject]);
    
    // Precargar imágenes cuando se abre el modal
    useImagePreloader(selectedProjectImages, currentImageIndex, 3, !!selectedProject);

    // Filter projects
    const filteredProjects = projects.filter((project) => {
        const matchesSearch = !searchQuery ||
            project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || project.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [
        { value: null, label: 'Todos', icon: null },
        { value: 'Hardware', label: 'Hardware', icon: Cpu },
        { value: 'Software', label: 'Software', icon: Code },
        { value: 'Diseño', label: 'Diseño', icon: Palette },
        { value: 'IoT', label: 'IoT', icon: Radio },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <section className="relative w-full min-h-[40vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden flex items-center justify-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <framerMotion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                            Proyectos del <span className="text-orange-500">FabLab</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                            Explora los proyectos desarrollados por nuestra comunidad.
                            Desde prototipos IoT hasta diseños 3D innovadores.
                        </p>
                    </framerMotion.div>
                </div>
            </section>

            {/* Featured Projects */}
            {featuredProjects.length > 0 && (
                <section className="py-16 bg-white border-b">
                    <div className="container mx-auto px-6">
                        <framerMotion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                            className="flex items-center justify-between mb-8"
                        >
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Proyectos Destacados</h2>
                                <p className="text-gray-600 mt-2">Los proyectos más relevantes de nuestra comunidad</p>
                            </div>
                        </framerMotion.div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredProjects.slice(0, 3).map((project, idx) => (
                                <framerMotion.div
                                    key={project.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    onClick={() => setSelectedProject(project)}
                                    className="group cursor-pointer"
                                >
                                    <div className="relative h-full bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl overflow-hidden border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-xl">
                                        <div className="aspect-video relative">
                                            {project.featuredImage ? (
                                                <Image
                                                    src={project.featuredImage}
                                                    alt={project.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                                                    <Cpu className="w-12 h-12 text-orange-600" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_LABELS[project.category]?.bgColor} ${CATEGORY_LABELS[project.category]?.color}`}>
                                                    {CATEGORY_LABELS[project.category]?.label}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                                                {project.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description}</p>
                                            <div className="text-xs text-gray-500">👥 {project.creators.length} {project.creators.length === 1 ? 'creador' : 'creadores'}</div>
                                        </div>
                                    </div>
                                </framerMotion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Filters & Search */}
            <section className="py-8 bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar proyectos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = selectedCategory === cat.value;
                                return (
                                    <button
                                        key={cat.value || 'all'}
                                        onClick={() => setSelectedCategory(cat.value)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {Icon && <Icon className="w-4 h-4" />}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Projects Grid */}
            <section className="py-16 bg-gradient-to-b from-white to-gray-50">
                <div className="container mx-auto px-6">
                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron proyectos</h3>
                            <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map((project, idx) => (
                                <framerMotion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    onClick={() => setSelectedProject(project)}
                                    className="group cursor-pointer h-full"
                                >
                                    <div className="relative h-full bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all duration-300 hover:shadow-2xl">
                                        {/* Card Image */}
                                        <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                            {project.featuredImage ? (
                                                <Image
                                                    src={project.featuredImage}
                                                    alt={project.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Cpu className="w-12 h-12 text-gray-300" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                                <div className="flex gap-2">
                                                    {project.technologies.slice(0, 2).map((tech, idx) => (
                                                        <span key={idx} className="text-xs px-2 py-1 bg-orange-500 text-white rounded-full font-medium">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute top-3 left-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_LABELS[project.category]?.bgColor} ${CATEGORY_LABELS[project.category]?.color}`}>
                                                    {CATEGORY_LABELS[project.category]?.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5 h-full flex flex-col">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-orange-600 transition-colors flex-1">
                                                    {project.title}
                                                </h3>
                                                <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                                                    {project.year}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                                                {project.description}
                                            </p>

                                            {/* Creators Count */}
                                            {project.creators.length > 0 && (
                                                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                                    <span className="inline-block">👥</span>
                                                    {project.creators.length} {project.creators.length === 1 ? 'creador' : 'creadores'}
                                                </div>
                                            )}

                                            {/* Expand Button */}
                                            <Button
                                                variant="outline"
                                                className="w-full mt-auto group/btn border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                                            >
                                                <span>Ver detalles</span>
                                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>

                                        {/* Hover Indicator */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                    </div>
                                </framerMotion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Project Modal - Optimized */}
            {selectedProject && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => { setSelectedProject(null); setCurrentImageIndex(0); }}
                >
                    <div
                        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Image with Gallery */}
                        <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                            {(() => {
                                const allImages = [selectedProject.featuredImage, ...selectedProject.gallery].filter(Boolean) as string[];
                                const currentImage = allImages[currentImageIndex] || null;
                                
                                return (
                                    <>
                                        {currentImage ? (
                                            <Image
                                                src={currentImage}
                                                alt={selectedProject.title}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Cpu className="w-20 h-20 text-orange-400" />
                                            </div>
                                        )}
                                        
                                        {/* Gallery Navigation */}
                                        {allImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i > 0 ? i - 1 : allImages.length - 1); }}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i < allImages.length - 1 ? i + 1 : 0); }}
                                                    className="absolute right-14 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 rounded-full text-white text-sm flex items-center gap-1.5">
                                                    <ImageIcon className="w-4 h-4" />
                                                    {currentImageIndex + 1} / {allImages.length}
                                                </div>
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                            <button
                                onClick={() => { setSelectedProject(null); setCurrentImageIndex(0); }}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-4 left-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${CATEGORY_LABELS[selectedProject.category]?.bgColor} ${CATEGORY_LABELS[selectedProject.category]?.color}`}>
                                    {CATEGORY_LABELS[selectedProject.category]?.label}
                                </span>
                            </div>
                        </div>

                        {/* Gallery Thumbnails */}
                        {(() => {
                            const allImages = [selectedProject.featuredImage, ...selectedProject.gallery].filter(Boolean) as string[];
                            if (allImages.length <= 1) return null;
                            return (
                                <div className="px-8 pt-4 pb-2 overflow-x-auto">
                                    <div className="flex gap-2">
                                        {allImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent hover:border-gray-300'}`}
                                            >
                                                <Image src={img} alt="" fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal Content */}
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedProject.title}</h2>
                                    <div className="flex items-center gap-4 text-gray-600">
                                        <span className="text-sm">📅 {selectedProject.year}</span>
                                        {selectedProject.creators.length > 0 && (
                                            <span className="text-sm">👥 {selectedProject.creators.length} {selectedProject.creators.length === 1 ? 'creador' : 'creadores'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-lg text-gray-700 mb-8 leading-relaxed">{selectedProject.description}</p>

                            {selectedProject.objective && (
                                <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="text-2xl">🎯</span> Objetivo
                                    </h4>
                                    <p className="text-gray-700">{selectedProject.objective}</p>
                                </div>
                            )}

                            {selectedProject.problemSolved && (
                                <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="text-2xl">✓</span> Problema que Resuelve
                                    </h4>
                                    <p className="text-gray-700">{selectedProject.problemSolved}</p>
                                </div>
                            )}

                            {/* Technologies */}
                            {selectedProject.technologies.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="text-2xl">⚙️</span> Tecnologías Utilizadas
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedProject.technologies.map((tech, idx) => (
                                            <span key={idx} className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Creators */}
                            {selectedProject.creators.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="text-2xl">👥</span> Equipo del Proyecto
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedProject.creators.map((creator, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {creator.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{creator.name}</p>
                                                    {creator.role && <p className="text-xs text-gray-500 truncate">{creator.role}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            {selectedProject.links && selectedProject.links.length > 0 && (
                                <div className="pt-6 border-t">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="text-2xl">🔗</span> Enlaces
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedProject.links.map((link, idx) => (
                                            <a 
                                                key={idx} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-gray-900/50 transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {link.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
