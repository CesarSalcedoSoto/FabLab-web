"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
    Search,
    ImageIcon,
    FileText,
    Files,
    Download,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    List,
    HardDrive,
    Filter,
    X,
    Eye,
    AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/cards/card";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Badge } from "@/shared/ui/badges/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/inputs/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/shared/ui/misc/dialog";
import { getMediaFiles, getMediaStats, deleteMediaFile, deleteMediaFiles } from "./actions";
import type { MediaItem, MediaFilters } from "./actions";

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function isImageMime(mime: string): boolean {
    return mime.startsWith("image/");
}

function getFileIcon(mime: string) {
    if (isImageMime(mime)) return ImageIcon;
    if (mime.includes("pdf")) return FileText;
    return Files;
}

export default function MediaBrowserPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalFiles: 0, totalImages: 0, totalDocuments: 0, totalSize: 0 });
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Filters
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<MediaFilters["type"]>("all");
    const [sortBy, setSortBy] = useState<MediaFilters["sortBy"]>("newest");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalDocs, setTotalDocs] = useState(0);

    // Preview
    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<MediaItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Multi-select
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ deleted: number; errors: number; inUseBy?: string[] } | null>(null);

    const isAllSelected = items.length > 0 && items.every(i => selected.has(i.id));
    const isSomeSelected = selected.size > 0;

    const toggleSelect = (id: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(items.map(i => i.id)));
        }
    };

    const handleBulkDelete = async () => {
        const idsToDelete = Array.from(selected);
        if (idsToDelete.length === 0) return;
        setBulkDeleting(true);
        setBulkResult(null);
        try {
            const result = await deleteMediaFiles(idsToDelete);
            if (result.deleted > 0 || result.errors > 0) {
                setBulkResult({ deleted: result.deleted, errors: result.errors, inUseBy: result.inUseBy });
                setTimeout(() => setBulkResult(null), 8000);
            }
        } catch (err) {
            console.error("[BulkDelete] Error:", err);
        } finally {
            setBulkDeleting(false);
            setBulkDeleteConfirm(false);
            setSelected(new Set());
            loadMedia();
            getMediaStats().then(setStats);
        }
    };

    const loadMedia = useCallback(async () => {
        setLoading(true);
        const result = await getMediaFiles({
            search: search || undefined,
            type: typeFilter,
            sortBy,
            page,
            limit: 24,
        });
        setItems(result.items);
        setTotalPages(result.totalPages);
        setTotalDocs(result.totalDocs);
        setLoading(false);
    }, [search, typeFilter, sortBy, page]);

    useEffect(() => {
        loadMedia();
    }, [loadMedia]);

    useEffect(() => {
        getMediaStats().then(setStats);
    }, []);

    // Reset page and selection when filters change
    useEffect(() => {
        setPage(1);
        setSelected(new Set());
    }, [search, typeFilter, sortBy]);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleting(true);
        const result = await deleteMediaFile(deleteConfirm.id);
        setDeleting(false);
        if (result.success) {
            setDeleteConfirm(null);
            setPreviewItem(null);
            loadMedia();
            getMediaStats().then(setStats);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <HardDrive className="h-6 w-6 text-indigo-600" />
                        Archivos y Medios
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Gestiona todas las imágenes y archivos almacenados
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100">
                            <Files className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalFiles}</p>
                            <p className="text-xs text-muted-foreground">Total archivos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                            <ImageIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalImages}</p>
                            <p className="text-xs text-muted-foreground">Imágenes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                            <p className="text-xs text-muted-foreground">Documentos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <HardDrive className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
                            <p className="text-xs text-muted-foreground">Espacio usado</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o descripción..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Select value={typeFilter} onValueChange={(v: string) => setTypeFilter(v as MediaFilters["type"])}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="images">Imágenes</SelectItem>
                                    <SelectItem value="documents">Documentos</SelectItem>
                                    <SelectItem value="other">Otros</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as MediaFilters["sortBy"])}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Más recientes</SelectItem>
                                    <SelectItem value="oldest">Más antiguos</SelectItem>
                                    <SelectItem value="name">Nombre A-Z</SelectItem>
                                    <SelectItem value="size">Mayor tamaño</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex border rounded-md">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                    title="Vista cuadrícula"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                                    title="Vista lista"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {(search || typeFilter !== "all") && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{totalDocs} resultado{totalDocs !== 1 ? "s" : ""}</span>
                            {search && (
                                <Badge variant="secondary" className="gap-1">
                                    &quot;{search}&quot;
                                    <button onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
                                </Badge>
                            )}
                            {typeFilter !== "all" && (
                                <Badge variant="secondary" className="gap-1">
                                    {typeFilter === "images" ? "Imágenes" : typeFilter === "documents" ? "Documentos" : "Otros"}
                                    <button onClick={() => setTypeFilter("all")}><X className="h-3 w-3" /></button>
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {isSomeSelected && (
                <Card className="border-indigo-200 bg-indigo-50">
                    <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                            />
                            <span className="text-sm font-medium text-indigo-900">
                                {selected.size} archivo{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelected(new Set())}
                            >
                                Deseleccionar
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setBulkDeleteConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar ({selected.size})
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk delete result notification */}
            {bulkResult && (
                <Card className={bulkResult.errors > 0 ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"}>
                    <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className={`h-4 w-4 ${bulkResult.errors > 0 ? "text-yellow-600" : "text-green-600"}`} />
                            <span>
                                {bulkResult.deleted} archivo{bulkResult.deleted !== 1 ? "s" : ""} eliminado{bulkResult.deleted !== 1 ? "s" : ""}.
                                {bulkResult.errors > 0 && (
                                    <span className="text-yellow-700 font-medium">
                                        {" "}{bulkResult.errors} no se pudieron eliminar
                                        {bulkResult.inUseBy && bulkResult.inUseBy.length > 0
                                            ? ` (en uso por ${bulkResult.inUseBy.join(", ")})`
                                            : " (están en uso por otro contenido)"
                                        }.
                                    </span>
                                )}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setBulkResult(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Files className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No se encontraron archivos</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {search ? "Intenta con otros términos de búsqueda" : "No hay archivos almacenados aún"}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {items.map((item) => {
                        const FileIcon = getFileIcon(item.mimeType);
                        const isImage = isImageMime(item.mimeType);
                        const isSelected = selected.has(item.id);
                        return (
                            <div
                                key={item.id}
                                className={`group relative bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all text-left cursor-pointer ${
                                    isSelected ? "border-indigo-400 ring-2 ring-indigo-200" : "border-gray-200 hover:border-indigo-300"
                                }`}
                                onClick={() => setPreviewItem(item)}
                            >
                                {/* Checkbox */}
                                <div
                                    className={`absolute top-2 left-2 z-10 p-1 transition-opacity ${
                                        isSelected || isSomeSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleSelect(item.id); }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer shadow-sm pointer-events-none"
                                    />
                                </div>
                                <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {isImage && (item.thumbnailURL || item.url) ? (
                                        <Image
                                            src={item.thumbnailURL || item.url}
                                            alt={item.alt || item.filename}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <FileIcon className="h-10 w-10 text-gray-300" />
                                    )}
                                    <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                                        isSelected ? "bg-indigo-500/10" : "bg-black/0 group-hover:bg-black/10 opacity-0 group-hover:opacity-100"
                                    }`}>
                                        {!isSelected && <Eye className="h-6 w-6 text-white drop-shadow" />}
                                    </div>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs font-medium truncate">{item.filename}</p>
                                    <p className="text-[10px] text-muted-foreground">{formatBytes(item.filesize)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50/50">
                                    <th className="p-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                                        />
                                    </th>
                                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Archivo</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Tipo</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Tamaño</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Dimensiones</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Fecha</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const FileIconComp = getFileIcon(item.mimeType);
                                    const isImage = isImageMime(item.mimeType);
                                    const isSelected = selected.has(item.id);
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`border-b last:border-0 cursor-pointer transition-colors ${
                                                isSelected ? "bg-indigo-50 hover:bg-indigo-100" : "hover:bg-gray-50"
                                            }`}
                                            onClick={() => setPreviewItem(item)}
                                        >
                                            <td className="p-3 w-10" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600 cursor-pointer pointer-events-none"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {isImage && (item.thumbnailURL || item.url) ? (
                                                            <Image
                                                                src={item.thumbnailURL || item.url}
                                                                alt={item.filename}
                                                                width={40}
                                                                height={40}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <FileIconComp className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate max-w-[200px]">{item.filename}</p>
                                                        {item.alt && <p className="text-xs text-muted-foreground truncate">{item.alt}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 hidden sm:table-cell">
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {item.mimeType.split("/")[1]?.toUpperCase() || "?"}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                                                {formatBytes(item.filesize)}
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                                                {item.width && item.height ? `${item.width}×${item.height}` : "—"}
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">
                                                {formatDate(item.createdAt)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                                                        title="Descargar"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Página {page} de {totalPages} ({totalDocs} archivos)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="truncate pr-8">{previewItem?.filename}</DialogTitle>
                        <DialogDescription>
                            {previewItem?.mimeType} &middot; {previewItem ? formatBytes(previewItem.filesize) : ""}
                        </DialogDescription>
                    </DialogHeader>
                    {previewItem && (
                        <div className="space-y-4">
                            {isImageMime(previewItem.mimeType) ? (
                                <div className="relative w-full aspect-video bg-gray-50 rounded-lg overflow-hidden">
                                    <Image
                                        src={previewItem.url}
                                        alt={previewItem.alt || previewItem.filename}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
                                    <FileText className="h-16 w-16 text-gray-300" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Nombre</p>
                                    <p className="font-medium truncate">{previewItem.filename}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Tamaño</p>
                                    <p className="font-medium">{formatBytes(previewItem.filesize)}</p>
                                </div>
                                {previewItem.width && previewItem.height && (
                                    <div>
                                        <p className="text-muted-foreground text-xs">Dimensiones</p>
                                        <p className="font-medium">{previewItem.width}×{previewItem.height} px</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground text-xs">Subido</p>
                                    <p className="font-medium">{formatDate(previewItem.createdAt)}</p>
                                </div>
                                {previewItem.alt && (
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs">Texto alternativo</p>
                                        <p className="font-medium">{previewItem.alt}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        <a
                            href={previewItem?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Abrir
                        </a>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => previewItem && setDeleteConfirm(previewItem)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirm Dialog */}
            <Dialog open={bulkDeleteConfirm} onOpenChange={(open) => !open && setBulkDeleteConfirm(false)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar {selected.size} archivo{selected.size !== 1 ? "s" : ""}</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar {selected.size} archivo{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)} disabled={bulkDeleting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleting}>
                            {bulkDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar {selected.size}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Eliminar archivo</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar <strong>{deleteConfirm?.filename}</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
