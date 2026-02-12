"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, FolderOpen, Search, ExternalLink,
  Lock, Users, Globe, Loader2, File, BookOpen, Wrench
} from "lucide-react";
import { useAuth } from "@/features/auth";

interface ResourceItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  file?: { url?: string; filename?: string; mimeType?: string; filesize?: number } | null;
  externalUrl?: string;
  thumbnail?: { url?: string } | null;
  folder?: string;
  visibility: string;
  downloads: number;
  tags?: { tag: string }[];
}

const typeLabels: Record<string, string> = {
  document: "Documento",
  guide: "Guía",
  tutorial: "Tutorial",
  template: "Plantilla",
  software: "Software",
  other: "Otro",
};

const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  guide: BookOpen,
  tutorial: File,
  template: File,
  software: Wrench,
  other: File,
};

const typeColors: Record<string, string> = {
  document: "bg-blue-100 text-blue-800",
  guide: "bg-green-100 text-green-800",
  tutorial: "bg-purple-100 text-purple-800",
  template: "bg-orange-100 text-orange-800",
  software: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function ResourcesPageClient() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        // Cargar recursos publicados visibles para el usuario
        let url = "/api/payload/resources?where[status][equals]=published&sort=-createdAt&limit=200&depth=1";
        if (!user) {
          url += "&where[visibility][equals]=public";
        } else if (user.role?.name !== "Admin") {
          url += "&where[visibility][in]=public,authenticated";
        }
        const res = await fetch(url);
        const data = await res.json();
        setResources((data.docs || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          type: doc.type,
          file: doc.file ? { url: doc.file.url, filename: doc.file.filename, mimeType: doc.file.mimeType, filesize: doc.file.filesize } : null,
          externalUrl: doc.externalUrl,
          thumbnail: doc.thumbnail ? { url: doc.thumbnail.url } : null,
          folder: doc.folder,
          visibility: doc.visibility,
          downloads: doc.downloads || 0,
          tags: doc.tags,
        })));
      } catch (err) {
        console.error("Error cargando recursos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const folders = [...new Set(resources.map(r => r.folder).filter(Boolean))] as string[];
  const types = [...new Set(resources.map(r => r.type))];

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    const matchesFolder = !folderFilter || r.folder === folderFilter;
    return matchesSearch && matchesType && matchesFolder;
  });

  // Agrupar por carpeta
  const grouped = folderFilter
    ? { [folderFilter]: filteredResources }
    : filteredResources.reduce((acc, r) => {
        const folder = r.folder || "Sin carpeta";
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push(r);
        return acc;
      }, {} as Record<string, ResourceItem[]>);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Recursos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto"
          >
            Guías, documentos, plantillas y archivos para tus proyectos
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar recursos..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Type & Folder filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setTypeFilter(null)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${!typeFilter ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            Todos los tipos
          </button>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === t ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {typeLabels[t] || t}
            </button>
          ))}
        </div>

        {folders.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <FolderOpen className="h-4 w-4 text-gray-400 mt-1" />
            <button onClick={() => setFolderFilter(null)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${!folderFilter ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Todas las carpetas
            </button>
            {folders.map(f => (
              <button key={f} onClick={() => setFolderFilter(f)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${folderFilter === f ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {f}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron recursos</p>
            {!user && <p className="text-gray-400 text-sm mt-2">Inicia sesión para ver más recursos</p>}
          </div>
        ) : (
          Object.entries(grouped).map(([folder, items]) => (
            <div key={folder} className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-emerald-600" /> {folder}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((resource, i) => {
                  const TypeIcon = typeIcons[resource.type] || File;
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${typeColors[resource.type] || "bg-gray-100"}`}>
                          <TypeIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
                          {resource.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                            <span className={`px-2 py-0.5 rounded-full ${typeColors[resource.type]}`}>{typeLabels[resource.type]}</span>
                            {resource.file?.filesize && <span>{formatBytes(resource.file.filesize)}</span>}
                            {resource.downloads > 0 && <span><Download className="h-3 w-3 inline mr-0.5" />{resource.downloads}</span>}
                            {resource.visibility === "authenticated" && <Lock className="h-3 w-3" title="Solo usuarios registrados" />}
                          </div>
                        </div>
                      </div>
                      {(resource.file?.url || resource.externalUrl) && (
                        <a
                          href={resource.file?.url || resource.externalUrl || "#"}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          <Download className="h-4 w-4" /> Descargar
                          {resource.externalUrl && <ExternalLink className="h-3 w-3" />}
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
