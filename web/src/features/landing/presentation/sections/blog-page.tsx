"use client";

import React, { useState } from "react";
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
  Filter,
  X,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// MOCK DATA - Preparado para Strapi
// ============================================================================

import { categoriasMock, postsMock } from "@/features/landing/domain/blog-mock";
import type { PostBlog, Categoria } from "@/features/landing/domain/blog-mock";

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

// ============================================================================
// COMPONENTS
// ============================================================================

function HeroBlog() {
  return (
    <section className="relative min-h-[50vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-6"
          >
            <Newspaper className="w-4 h-4" />
            Noticias y Tutoriales
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Blog{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              FabLab
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Descubre tutoriales, proyectos destacados, noticias del laboratorio
            y todo lo relacionado con la fabricación digital.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative max-w-xl mx-auto">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar artículos, tutoriales, proyectos..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-4 py-4 bg-white rounded-full border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

function CategoryFilter({
  categorias,
  categoriaActiva,
  onCategoriaChange,
}: {
  categorias: Categoria[];
  categoriaActiva: string | null;
  onCategoriaChange: (slug: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        onClick={() => onCategoriaChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${categoriaActiva === null
          ? "bg-orange-500 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
      >
        Todos
      </button>
      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          onClick={() => onCategoriaChange(categoria.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${categoriaActiva === categoria.slug
            ? "bg-orange-500 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          {categoria.nombre}
        </button>
      ))}
    </div>
  );
}

function PostCardFeatured({ post }: { post: PostBlog }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image */}
        <div className="relative h-64 md:h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20" />
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
          {post.imagenPortada && (
            <Image
              src={post.imagenPortada}
              alt={post.titulo}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              quality={75}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${post.categoria.color || "bg-orange-500"}`}
            >
              {post.categoria.nombre}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">
              ⭐ Destacado
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.fechaPublicacion)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.tiempoLectura} min
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {formatViews(post.vistas)}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
            <Link href={`/blog/${post.slug}`}>{post.titulo}</Link>
          </h2>

          <p className="text-gray-600 mb-6 line-clamp-3">{post.extracto}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {post.autor.avatar ? (
                  <Image
                    src={post.autor.avatar}
                    alt={post.autor.nombre}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {post.autor.nombre}
                </p>
                <p className="text-xs text-gray-500">{post.autor.rol}</p>
              </div>
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              Leer más
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function PostCard({ post, index }: { post: PostBlog; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-gray-400" />
        </div>
        {post.imagenPortada && (
          <Image
            src={post.imagenPortada}
            alt={post.titulo}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={75}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${post.categoria.color || "bg-orange-500"}`}
          >
            {post.categoria.nombre}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.fechaPublicacion)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.tiempoLectura} min
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
          <Link href={`/blog/${post.slug}`}>{post.titulo}</Link>
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {post.extracto}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {post.etiquetas.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {post.autor.avatar ? (
                <Image
                  src={post.autor.avatar}
                  alt={post.autor.nombre}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className="text-sm text-gray-600">{post.autor.nombre}</span>
          </div>

          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            {formatViews(post.vistas)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function PostsGrid({ posts }: { posts: PostBlog[] }) {
  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No se encontraron artículos
        </h3>
        <p className="text-gray-500">
          Intenta con otros términos de búsqueda o categorías
        </p>
      </motion.div>
    );
  }

  const destacados = posts.filter((p) => p.destacado);
  const regulares = posts.filter((p) => !p.destacado);

  return (
    <div className="space-y-12">
      {/* Featured Posts */}
      {destacados.length > 0 && (
        <div className="space-y-6">
          {destacados.map((post) => (
            <PostCardFeatured key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Regular Posts Grid */}
      {regulares.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regulares.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const postsRecientes = postsMock.slice(0, 4);
  const etiquetasPopulares = [
    "impresión 3D",
    "arduino",
    "corte láser",
    "electrónica",
    "IoT",
    "PLA",
    "robótica",
    "tutorial",
    "proyecto",
    "diseño",
  ];

  return (
    <aside className="space-y-8">
      {/* Recent Posts */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Artículos Recientes
        </h3>
        <div className="space-y-4">
          {postsRecientes.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden relative">
                  {post.imagenPortada ? (
                    <Image
                      src={post.imagenPortada}
                      alt={post.titulo}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {post.titulo}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(post.fechaPublicacion)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-orange-500" />
          Etiquetas Populares
        </h3>
        <div className="flex flex-wrap gap-2">
          {etiquetasPopulares.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="px-3 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full text-sm text-gray-600 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-2">¿Quieres más contenido?</h3>
        <p className="text-orange-100 text-sm mb-4">
          Suscríbete a nuestro newsletter y recibe los últimos artículos y
          tutoriales directamente en tu correo.
        </p>
        <Link
          href="/contacto"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-full font-semibold text-sm hover:bg-orange-50 transition-colors"
        >
          Suscribirse
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function BlogPage() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

  // Filter posts
  const postsFiltrados = postsMock.filter((post) => {
    const matchBusqueda =
      busqueda === "" ||
      post.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      post.extracto.toLowerCase().includes(busqueda.toLowerCase()) ||
      post.etiquetas.some((tag) =>
        tag.toLowerCase().includes(busqueda.toLowerCase())
      );

    const matchCategoria =
      categoriaActiva === null || post.categoria.slug === categoriaActiva;

    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <HeroBlog />

      {/* Search & Filters */}
      <section className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-6 space-y-6">
          <SearchBar value={busqueda} onChange={setBusqueda} />
          <CategoryFilter
            categorias={categoriasMock}
            categoriaActiva={categoriaActiva}
            onCategoriaChange={setCategoriaActiva}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Posts */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <PostsGrid key={`${busqueda}-${categoriaActiva}`} posts={postsFiltrados} />
            </AnimatePresence>

            {/* Load More */}
            {postsFiltrados.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-12"
              >
                <button className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors">
                  Cargar más artículos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Tienes un proyecto que compartir?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Si has desarrollado un proyecto en el FabLab y quieres compartir
              tu experiencia, contáctanos. Nos encantaría publicar tu historia.
            </p>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Proponer artículo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
