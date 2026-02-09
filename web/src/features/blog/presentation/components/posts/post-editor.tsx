import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/ui/buttons/button';
import { Input } from '@/shared/ui/inputs/input';
import { Textarea } from '@/shared/ui/inputs/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/cards/card';
import { Badge } from '@/shared/ui/badges/badge';
import { Save, Loader2, X, Plus, Upload, ImageIcon } from 'lucide-react';
import { TipTapEditor } from '../editor/tiptap-editor';
import type { PostInput } from '../../../domain/entities';
import Image from 'next/image';
import { MediaPicker } from '../media/media-picker';
import type { PayloadMedia } from '../../../infrastructure/payload/types';

interface PostEditorProps {
  initialData?: Partial<PostInput>;
  onGuardar: (data: PostInput & { featuredImageId?: number | string }) => Promise<void>;
  onVolver: () => void;
  cargando?: boolean;
}

export function PostEditor({
  initialData,
  onGuardar,
  onVolver,
  cargando = false,
}: PostEditorProps) {
  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [contenido, setContenido] = useState(initialData?.contenido || '');
  const [extracto, setExtracto] = useState(initialData?.extracto || '');
  const [etiquetas, setEtiquetas] = useState<string[]>(initialData?.etiquetas || []);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(
    typeof initialData?.imagenDestacada === 'string' ? initialData.imagenDestacada : null
  );
  const [imageMediaId, setImageMediaId] = useState<number | string | undefined>(undefined);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (initialData?.imagenDestacada && typeof initialData.imagenDestacada === 'string') {
      setImagePreview(initialData.imagenDestacada);
    }
  }, [initialData]);

  const handleGuardar = async () => {
    if (!titulo.trim() || !contenido.trim()) return;
    await onGuardar({
      titulo,
      contenido,
      extracto: extracto || undefined,
      etiquetas: etiquetas.length > 0 ? etiquetas : undefined,
      featuredImageId: imageMediaId,
    });
  };

  const handleSelectMedia = (media: PayloadMedia) => {
    setImagePreview(media.url);
    setImageMediaId(media.id);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageMediaId(undefined);
  };

  const agregarEtiqueta = () => {
    const tag = nuevaEtiqueta.trim().toLowerCase();
    if (tag && !etiquetas.includes(tag)) {
      setEtiquetas([...etiquetas, tag]);
      setNuevaEtiqueta('');
    }
  };

  const quitarEtiqueta = (tag: string) => {
    setEtiquetas(etiquetas.filter(t => t !== tag));
  };

  const isValid = titulo.trim() && contenido.trim();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-12 max-w-7xl mx-auto">
        {/* Editor principal */}
        <div className="lg:col-span-8 space-y-6">
          {/* Título Clean */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <Input
              placeholder="Título del artículo..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="text-3xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-gray-300 h-auto py-2"
            />
          </div>

          {/* Editor de texto enriquecido */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm min-h-[500px]">
            <TipTapEditor
              value={contenido}
              onChange={setContenido}
              placeholder="Escribe tu contenido aquí..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Acciones */}
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Publicar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium"
                onClick={handleGuardar}
                disabled={!isValid || cargando}
              >
                {cargando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
                onClick={onVolver}
                disabled={cargando}
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>

          {/* Imagen Destacada */}
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Imagen Destacada</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-200 group">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={75}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={handleRemoveImage}
                        className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-white transition-colors shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                    <span>Seleccionada</span>
                    <button onClick={() => setIsMediaPickerOpen(true)} className="text-orange-500 hover:underline">Cambiar</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-all gap-2 group outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow transition-all">
                    <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Seleccionar imagen</span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Extracto */}
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Textarea
                placeholder="Un breve resumen del post..."
                value={extracto}
                onChange={(e) => setExtracto(e.target.value)}
                className="min-h-[120px] resize-none bg-gray-50/50 border-gray-200 focus:bg-white transition-colors text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-2 text-right">
                Máx. 160 caracteres
              </p>
            </CardContent>
          </Card>

          {/* Etiquetas */}
          <Card>
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-5">
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva etiqueta..."
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEtiqueta())}
                  className="h-9 text-sm bg-gray-50/50 border-gray-200 focus:bg-white"
                />
                <Button size="sm" variant="outline" onClick={agregarEtiqueta} className="h-9 w-9 p-0 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {etiquetas.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1.5 pl-2.5 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 font-normal">
                      {tag}
                      <button
                        onClick={() => quitarEtiqueta(tag)}
                        className="ml-1 hover:text-red-600 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={handleSelectMedia}
      />
    </>
  );
}
