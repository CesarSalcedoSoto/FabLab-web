"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Search, X, Loader2, Star, Calendar } from "lucide-react";
import Image from "next/image";

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image?: { url?: string; alt?: string; width?: number; height?: number } | null;
  album?: string;
  date?: string;
  featured?: boolean;
  tags?: { tag: string }[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

export function GalleryPageClient() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/payload/gallery?where[status][equals]=published&sort=-date&limit=200&depth=1");
        const data = await res.json();
        setItems((data.docs || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          image: doc.image ? { url: doc.image.url, alt: doc.image.alt, width: doc.image.width, height: doc.image.height } : null,
          album: doc.album,
          date: doc.date,
          featured: doc.featured,
          tags: doc.tags,
        })));
      } catch (err) {
        console.error("Error cargando galería:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const albums = [...new Set(items.map(i => i.album).filter(Boolean))] as string[];

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase());
    const matchesAlbum = !albumFilter || i.album === albumFilter;
    return matchesSearch && matchesAlbum;
  });

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") {
        const idx = filteredItems.findIndex(i => i.id === lightbox.id);
        if (idx < filteredItems.length - 1) setLightbox(filteredItems[idx + 1]);
      }
      if (e.key === "ArrowLeft") {
        const idx = filteredItems.findIndex(i => i.id === lightbox.id);
        if (idx > 0) setLightbox(filteredItems[idx - 1]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, filteredItems]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-pink-600 to-rose-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Galería
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-pink-100 max-w-2xl mx-auto"
          >
            Fotos y momentos de nuestros proyectos, eventos y actividades
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar en galería..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {albums.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={() => setAlbumFilter(null)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!albumFilter ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Todos
            </button>
            {albums.map(a => (
              <button key={a} onClick={() => setAlbumFilter(a)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${albumFilter === a ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {a}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron imágenes</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => setLightbox(item)}
              >
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  {item.image?.url ? (
                    <Image
                      src={item.image.url} alt={item.title}
                      width={item.image.width || 600} height={item.image.height || 400}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div className="text-white">
                      <p className="font-semibold text-sm">{item.title}</p>
                      {item.album && <p className="text-xs text-white/70">{item.album}</p>}
                    </div>
                  </div>
                  {item.featured && (
                    <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full p-1">
                      <Star className="h-3 w-3 fill-current" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={() => setLightbox(null)}>
              <X className="h-8 w-8" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="max-w-5xl max-h-[90vh] relative"
              onClick={e => e.stopPropagation()}
            >
              {lightbox.image?.url && (
                <Image
                  src={lightbox.image.url} alt={lightbox.title}
                  width={lightbox.image.width || 1200} height={lightbox.image.height || 800}
                  className="max-h-[80vh] w-auto object-contain rounded-lg"
                  sizes="90vw"
                />
              )}
              <div className="mt-4 text-center text-white">
                <h3 className="text-lg font-semibold">{lightbox.title}</h3>
                {lightbox.description && <p className="text-sm text-white/70 mt-1">{lightbox.description}</p>}
                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/50">
                  {lightbox.album && <span>{lightbox.album}</span>}
                  {lightbox.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(lightbox.date)}</span>}
                </div>
              </div>
              <p className="text-center text-white/30 text-xs mt-4">← → para navegar · Esc para cerrar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
