"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    Eye,
    Tag,
    ArrowLeft,
    ArrowRight,
    User,
    Share2,
    Facebook,
    Twitter,
    Linkedin,
    Link as LinkIcon,
    BookOpen,
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
    const wordCount = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(wordCount / 200));
}

// ============================================================================
// COMPONENTS
// ============================================================================

function PostHero({ post }: { post: Post }) {
    const imageUrl = typeof post.imagenDestacada === 'string'
        ? post.imagenDestacada
        : post.imagenDestacada?.url;

    return (
        <section className="relative min-h-[60vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden flex items-end">
            {/* Background Image */}
            {imageUrl && (
                <div className="absolute inset-0">
                    <Image
                        src={imageUrl}
                        alt={post.titulo}
                        fill
                        sizes="100vw"
                        quality={75}
                        className="object-cover opacity-30"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
                </div>
            )}

            {/* Decorative elements */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-6 relative z-10 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl"
                >
                    {/* Breadcrumb */}
                    <nav className="mb-6">
                        <ol className="flex items-center gap-2 text-sm text-gray-400">
                            <li>
                                <Link href="/" className="hover:text-white transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>/</li>
                            <li>
                                <Link href="/blog" className="hover:text-white transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>/</li>
                            <li className="text-orange-400 truncate max-w-[200px]">
                                {post.titulo}
                            </li>
                        </ol>
                    </nav>

                    {/* Category */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-6"
                    >
                        {post.categorias?.[0]?.nombre || "Blog"}
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                        {post.titulo}
                    </h1>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-6 text-gray-300">
                        {/* Author */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                <User className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">
                                    {typeof post.autor === 'object' ? post.autor?.name : 'FabLab'}
                                </p>
                                <p className="text-sm text-gray-400">Autor</p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-gray-700" />

                        {/* Date */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-400" />
                            <span>{formatDate(post.fechaPublicacion || post.createdAt || new Date().toISOString())}</span>
                        </div>

                        {/* Read time */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-400" />
                            <span>{estimateReadTime(post.extracto || '')} min lectura</span>
                        </div>

                        {/* Views */}
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-orange-400" />
                            <span>{formatViews(post.vistas || 0)} vistas</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function ShareButtons({ post }: { post: Post }) {
    const shareUrl = typeof window !== 'undefined'
        ? window.location.href
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        // TODO: Show toast notification
    };

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Compartir
            </span>
            <div className="flex items-center gap-2">
                <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-full transition-colors"
                >
                    <Facebook className="w-4 h-4" />
                </a>
                <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.titulo)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-sky-100 text-gray-600 hover:text-sky-500 rounded-full transition-colors"
                >
                    <Twitter className="w-4 h-4" />
                </a>
                <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.titulo)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded-full transition-colors"
                >
                    <Linkedin className="w-4 h-4" />
                </a>
                <button
                    onClick={copyToClipboard}
                    className="p-2 bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 rounded-full transition-colors"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function PostContent({ post }: { post: Post }) {
    // Handle rich text content from Payload (Lexical editor)
    const renderContent = () => {
        if (!post.contenido) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Este artículo aún no tiene contenido.</p>
                </div>
            );
        }

        // If content is a string (plain text or HTML)
        if (typeof post.contenido === 'string') {
            return (
                <div
                    className="prose prose-lg prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.contenido }}
                />
            );
        }

        // If content is Lexical format (rich text object)
        // For now, show a placeholder - in production you'd use the Lexical renderer
        return (
            <div className="prose prose-lg prose-gray max-w-none">
                <p className="text-gray-600 text-lg leading-relaxed">
                    {post.extracto}
                </p>
                <div className="mt-8 p-6 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-orange-800 text-sm">
                        💡 Para ver el contenido completo, visita el CMS de Payload y edita este post.
                    </p>
                </div>
            </div>
        );
    };

    return (
        <article className="py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Excerpt */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 leading-relaxed mb-8 font-medium"
                    >
                        {post.extracto}
                    </motion.p>

                    {/* Share buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="pb-8 mb-8 border-b border-gray-200"
                    >
                        <ShareButtons post={post} />
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {renderContent()}
                    </motion.div>

                    {/* Tags */}
                    {post.etiquetas && post.etiquetas.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-12 pt-8 border-t border-gray-200"
                        >
                            <div className="flex items-center gap-3 flex-wrap">
                                <Tag className="w-5 h-5 text-gray-400" />
                                {post.etiquetas.map((tag) => {
                                    const tagValue = typeof tag === 'string' ? tag : tag.tag;
                                    return (
                                        <Link
                                            key={tagValue}
                                            href={`/blog?tag=${encodeURIComponent(tagValue || '')}`}
                                            className="px-4 py-2 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full text-sm text-gray-600 transition-colors"
                                        >
                                            #{tagValue}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Author card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12 p-6 bg-gray-50 rounded-2xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">
                                    {typeof post.autor === 'object' ? post.autor?.name : 'FabLab INACAP'}
                                </h3>
                                <p className="text-gray-500 text-sm mb-3">
                                    Equipo FabLab INACAP Los Ángeles
                                </p>
                                <p className="text-gray-600 text-sm">
                                    Apasionados por la fabricación digital, la innovación y la tecnología.
                                    Compartimos conocimiento para inspirar a la próxima generación de makers.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </article>
    );
}

function NavigationButtons() {
    return (
        <section className="py-8 border-t border-gray-200">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver al Blog
                    </Link>
                    <Link
                        href="/contacto"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors"
                    >
                        Sugerir tema
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

function RelatedPosts({ currentPostId }: { currentPostId: string }) {
    const { posts, cargarPosts } = useBlog();

    useEffect(() => {
        cargarPosts({ limite: 4 });
    }, [cargarPosts]);

    const relatedPosts = posts.filter((p) => p.id !== currentPostId).slice(0, 3);

    if (relatedPosts.length === 0) return null;

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                    Artículos Relacionados
                </h2>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {relatedPosts.map((post) => {
                        const imageUrl = typeof post.imagenDestacada === 'string'
                            ? post.imagenDestacada
                            : post.imagenDestacada?.url;

                        return (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="relative h-40 bg-gray-200">
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={post.titulo}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            quality={75}
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <BookOpen className="w-10 h-10 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                        {post.titulo}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {formatDate(post.fechaPublicacion || post.createdAt || new Date().toISOString())}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface PostDetailPageProps {
    slug: string;
}

export function PostDetailPage({ slug }: PostDetailPageProps) {
    const { postActual, cargando, error, cargarPost, registrarVista } = useBlog();

    useEffect(() => {
        if (slug) {
            cargarPost(slug);
        }
    }, [slug, cargarPost]);

    useEffect(() => {
        if (postActual?.id) {
            registrarVista(postActual.id);
        }
    }, [postActual?.id, registrarVista]);

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Cargando artículo...</p>
                </div>
            </div>
        );
    }

    if (error || !postActual) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Artículo no encontrado
                    </h1>
                    <p className="text-gray-500 mb-6">
                        {error || "El artículo que buscas no existe o ha sido eliminado."}
                    </p>
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver al Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <PostHero post={postActual} />
            <PostContent post={postActual} />
            <NavigationButtons />
            <RelatedPosts currentPostId={postActual.id} />
        </div>
    );
}
