"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/shared/ui/misc/sheet";
import { Loader2, Upload, Search, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import type { PayloadMedia } from "../../../infrastructure/payload/types";

interface MediaPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (media: PayloadMedia) => void;
}

export function MediaPicker({ open, onOpenChange, onSelect }: MediaPickerProps) {
    const [mediaList, setMediaList] = useState<PayloadMedia[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/payload/media?limit=50&sort=-createdAt`);
            if (!res.ok) throw new Error("Error cargando media");
            const data = await res.json();
            setMediaList(data.docs || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la galería");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadMedia();
        }
    }, [open]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        const altText = file.name.replace(/\.[^/.]+$/, "");
        formData.append("file", file);
        formData.append("_payload", JSON.stringify({ alt: altText }));

        try {
            const res = await fetch(`/api/payload/media`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const message = await res.text();
                throw new Error(message || "Error subiendo imagen");
            }

            const data = await res.json();
            toast.success("Imagen subida exitosamente");
            setMediaList((prev) => [data.doc, ...prev]);
            onSelect(data.doc);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Error al subir la imagen");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const filteredMedia = mediaList.filter((media) =>
        media.alt.toLowerCase().includes(search.toLowerCase()) ||
        media.filename.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col h-full bg-white">
                <SheetHeader className="px-6 py-4 border-b border-gray-100 flex-none bg-white z-10">
                    <SheetTitle>Galería Multimedia</SheetTitle>
                    <SheetDescription>
                        Selecciona o sube una imagen para tu publicación.
                    </SheetDescription>
                </SheetHeader>

                <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar imágenes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Upload className="mr-2 w-4 h-4" />}
                        Subir Imagen
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : filteredMedia.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>No hay imágenes disponibles</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredMedia.map((media) => (
                                <button
                                    key={media.id}
                                    onClick={() => {
                                        onSelect(media);
                                        onOpenChange(false);
                                    }}
                                    className="group relative aspect-square rounded-lg token-shadow overflow-hidden border border-gray-200 hover:border-orange-500 hover:ring-2 hover:ring-orange-500/20 transition-all bg-white"
                                >
                                    {media.url ? (
                                        <Image
                                            src={media.url}
                                            alt={media.alt || media.filename}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs text-gray-400">
                                            Sin vista previa
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-xs truncate translate-y-full group-hover:translate-y-0 transition-transform">
                                        {media.filename}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
