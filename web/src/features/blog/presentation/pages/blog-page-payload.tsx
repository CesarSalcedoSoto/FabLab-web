"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Calendar,
    Clock,
    Eye,
    Tag,
    ChevronRight,
    ArrowRight,
    User,
    BookOpen,
    Newspaper,
    X,
    Loader2,
    Mail,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useBlog } from "../hooks/use-blog";
import type { Post } from "../../domain/entities";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatViews(views: number): string {
    if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
}

function estimateReadTime(content: string): number {
    // Aproximadamente 200 palabras por minuto
    const wordCount = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(wordCount / 200));
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SearchBar({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                type="text"
                placeholder="Buscar artículos..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100/50 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-gray-900 transition-all"
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                >
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            )}
        </div>
    );
}

function CategoryFilter({
    categoriaActiva,
    onCategoriaChange,
}: {
    categoriaActiva: string | null;
    onCategoriaChange: (slug: string | null) => void;
}) {
    const categorias = [
        { id: "1", nombre: "Tutoriales", slug: "tutoriales" },
        { id: "2", nombre: "Proyectos", slug: "proyectos" },
        { id: "3", nombre: "Noticias", slug: "noticias" },
        { id: "4", nombre: "Eventos", slug: "eventos" },
        { id: "5", nombre: "Tecnología", slug: "tecnologia" },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => onCategoriaChange(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categoriaActiva === null
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
            >
                Todos
            </button>
            {categorias.map((categoria) => (
                <button
                    key={categoria.id}
                    onClick={() => onCategoriaChange(categoria.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${categoriaActiva === categoria.slug
                        ? "bg-orange-500 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    {categoria.nombre}
                </button>
            ))}
        </div>
    );
}

function PostCardFeatured({ post }: { post: Post }) {
    const imageUrl = typeof post.imagenDestacada === 'string'
        ? post.imagenDestacada
        : post.imagenDestacada?.url;

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
        >
            <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" aria-label={post.titulo} />
            <div className="grid md:grid-cols-5 gap-0 h-full">
                {/* Image */}
                <div className="md:col-span-3 relative h-64 md:h-full min-h-[300px] overflow-hidden">
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                    </div>
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={post.titulo}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    )}
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-orange-600 shadow-sm">
                            Destacado
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center bg-white relative">
                    <div className="mb-4">
                        <span className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-2 block">
                            {post.categorias?.[0]?.nombre || "Blog"}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors tight-leading">
                            {post.titulo}
                        </h2>
                    </div>

                    <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed">
                        {post.extracto}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                {post.autor?.avatar ? (
                                    <Image src={post.autor.avatar} alt={post.autor.nombre || ''} width={32} height={32} />
                                ) : (
                                    <User className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-900">
                                    {typeof post.autor === 'object' ? post.autor?.name : 'FabLab'}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    {formatDate(post.fechaPublicacion || post.createdAt || new Date().toISOString())}
                                </span>
                            </div>
                        </div>

                        <span
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

function PostCard({ post, index }: { post: Post; index: number }) {
    const imageUrl = typeof post.imagenDestacada === 'string'
        ? post.imagenDestacada
        : post.imagenDestacada?.url;

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
        >
            <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" aria-label={post.titulo} />
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-gray-50">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={post.titulo}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
                        {post.categorias?.[0]?.nombre || "Artículo"}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-gray-500 mb-3 font-medium">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.fechaPublicacion || post.createdAt || new Date().toISOString())}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {estimateReadTime(post.extracto || '')} min
                    </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                    {post.titulo}
                </h3>

                <p className="text-gray-600 text-xs mb-4 line-clamp-3 leading-relaxed">
                    {post.extracto}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            <User className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                            {typeof post.autor === 'object' ? post.autor?.name?.split(' ')[0] : 'FabLab'}
                        </span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {formatViews(post.vistas || 0)}
                    </span>
                </div>
            </div>
        </motion.article>
    );
}

function PostsGrid({ posts, cargando }: { posts: Post[]; cargando: boolean }) {
    if (cargando) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200"
            >
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    No encontramos resultados
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                    Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-orange-600 font-medium hover:underline"
                >
                    Limpiar filtros
                </button>
            </motion.div>
        );
    }

    // El primer post destacado (o el primero si no hay destacados)
    const destacado = posts[0];
    const regulares = posts.slice(1);

    return (
        <div className="space-y-8">
            {/* Featured Post */}
            {destacado && <PostCardFeatured post={destacado} />}

            {/* Regular Posts Grid */}
            {regulares.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {regulares.map((post, index) => (
                        <PostCard key={post.id} post={post} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
}

function Sidebar({ postsRecientes }: { postsRecientes: Post[] }) {
    const etiquetasPopulares = [
        "impresión 3D",
        "arduino",
        "corte láser",
        "electrónica",
        "IoT",
        "PLA",
        "robótica",
        "prototipado",
    ];

    return (
        <aside className="space-y-6">
            {/* Recent Posts - Minimal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Clock className="w-3 h-3 text-orange-500" />
                    Recientes
                </h3>
                <div className="space-y-4">
                    {postsRecientes.length > 0 ? (
                        postsRecientes.slice(0, 4).map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group flex gap-3 items-start"
                            >
                                <div className="w-12 h-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                    {(post.imagenDestacada as any)?.url || typeof post.imagenDestacada === 'string' ? (
                                        <Image
                                            src={(post.imagenDestacada as any)?.url || post.imagenDestacada as string}
                                            alt={post.titulo}
                                            fill
                                            className="object-cover group-hover:opacity-80 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                                        {post.titulo}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
                                        {formatDate(post.fechaPublicacion || post.createdAt || "")}
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400">Sin actividad reciente.</p>
                    )}
                </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Tag className="w-3 h-3 text-orange-500" />
                    Etiquetas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {etiquetasPopulares.map((tag) => (
                        <Link
                            key={tag}
                            href={`/blog?tag=${encodeURIComponent(tag)}`}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-100 rounded-md text-xs text-gray-600 transition-colors"
                        >
                            {tag}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Newsletter — Suscripción al Blog */}
            <NewsletterSubscribe />
        </aside>
    );
}

// ============================================================================
// NEWSLETTER SUBSCRIBE
// ============================================================================

function NewsletterSubscribe() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/blog/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setMessage(data.message || "¡Suscripción exitosa!");
                setEmail("");
            } else {
                setMessage(data.error || "Error al suscribirse");
            }
        } catch {
            setMessage("Error de conexión. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 rounded-xl p-6 text-white text-center">
            <Mail className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Newsletter</h3>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                Recibe lo último en fabricación digital en tu correo.
            </p>

            {success ? (
                <div className="flex items-center justify-center gap-2 text-green-400 text-xs py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{message}</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <input
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="w-full py-2 bg-orange-600 text-white rounded-lg font-medium text-xs hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-3 h-3 animate-spin" />Suscribiendo...</>
                        ) : (
                            "Suscribirse"
                        )}
                    </button>
                    {message && !success && (
                        <p className="text-red-400 text-xs">{message}</p>
                    )}
                </form>
            )}
        </div>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function BlogPagePayload() {
    const { posts, cargando, error, cargarPosts } = useBlog();
    const [busqueda, setBusqueda] = useState("");
    const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

    useEffect(() => {
        cargarPosts({ limite: 20 });
    }, [cargarPosts]);

    // Filter posts client-side for search
    const postsFiltrados = posts.filter((post) => {
        if (busqueda === "") return true;

        return (
            post.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
            post.extracto?.toLowerCase().includes(busqueda.toLowerCase()) ||
            post.etiquetas?.some((tag) => {
                const tagValue = typeof tag === 'string' ? tag : tag.tag;
                return tagValue?.toLowerCase().includes(busqueda.toLowerCase());
            })
        );
    });

    return (
        <div className="min-h-screen bg-white pt-32">

            {/* Header Clean & Simple */}
            <div className="border-b border-gray-100 bg-white">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="bg-orange-600 text-white p-1 rounded-md"><Newspaper className="w-4 h-4" /></span>
                                Blog FabLab
                            </h1>
                        </div>

                        <div className="flex-1 max-w-2xl flex flex-col md:flex-row gap-4 md:items-center justify-end">
                            <CategoryFilter
                                categoriaActiva={categoriaActiva}
                                onCategoriaChange={setCategoriaActiva}
                            />
                            <div className="hidden md:block w-px h-6 bg-gray-200"></div>
                            <SearchBar value={busqueda} onChange={setBusqueda} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <section className="container mx-auto px-6 py-8">
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm">
                        {error}
                    </div>
                )}

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Posts Column */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Title if filtered */}
                        {(busqueda || categoriaActiva) && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 pb-4 border-b border-gray-100">
                                <span>Resultados para:</span>
                                {busqueda && <span className="font-semibold text-gray-900">"{busqueda}"</span>}
                                {categoriaActiva && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs capitalize">{categoriaActiva}</span>}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            <PostsGrid
                                key={`${busqueda}-${categoriaActiva}`}
                                posts={postsFiltrados}
                                cargando={cargando}
                            />
                        </AnimatePresence>

                        {/* Load More */}
                        {postsFiltrados.length > 0 && !cargando && (
                            <div className="text-center pt-8 border-t border-gray-100">
                                <Link href="/blog/archivo" className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors">
                                    Ver archivo completo
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 pl-0 lg:pl-8 border-l border-transparent lg:border-gray-100">
                        <div>
                            <Sidebar postsRecientes={posts} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}







