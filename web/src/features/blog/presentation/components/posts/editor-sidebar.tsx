'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { Image as ImageIcon, X, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/cards/card';
import { Badge } from '@/shared/ui/badges/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/misc/dialog';
import { ImageUploader, type ImageData } from '../media/image-uploader';
import { TagInput } from '../inputs/tag-input';
import { BLOG_TEMPLATES, type BlogTemplate } from '../../../domain/value-objects/templates';

interface EditorSidebarProps {
  // Plantillas
  selectedTemplate: BlogTemplate | null;
  onSelectTemplate: (template: BlogTemplate) => void;
  // Imagen
  imagenDestacada: ImageData | null;
  onImageChange: (image: ImageData | null) => void;
  // Extracto
  extracto: string;
  onExtractoChange: (value: string) => void;
  // Etiquetas
  etiquetas: string[];
  onEtiquetasChange: (tags: string[]) => void;
  tagSuggestions: string[];
  // Contenido stats
  contenido: string;
}

export function EditorSidebar({
  selectedTemplate,
  onSelectTemplate,
  imagenDestacada,
  onImageChange,
  extracto,
  onExtractoChange,
  etiquetas,
  onEtiquetasChange,
  tagSuggestions,
  contenido,
}: EditorSidebarProps) {
  const [showImageSelector, setShowImageSelector] = useState(false);

  return (
    <div className="space-y-4">
      {/* Plantillas rápidas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plantillas</CardTitle>
          <CardDescription>Comienza con una plantilla predefinida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {BLOG_TEMPLATES.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={`flex flex-col items-center p-3 rounded-lg border text-center transition-colors ${
                  selectedTemplate?.id === template.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                <span className="text-2xl mb-1">{template.icono}</span>
                <span className="text-xs font-medium">{template.nombre}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Imagen destacada */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Imagen destacada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imagenDestacada ? (
            <div className="relative group">
              <NextImage
                src={imagenDestacada.url}
                alt={imagenDestacada.alternativeText || 'Imagen destacada'}
                width={400}
                height={128}
                className="w-full h-32 object-cover rounded-lg"
                quality={75}
              />
              <button
                onClick={() => onImageChange(null)}
                className="absolute top-2 right-2 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
              <DialogTrigger asChild>
                <button className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm">Agregar imagen</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar imagen destacada</DialogTitle>
                </DialogHeader>
                <ImageUploader
                  onChange={(image) => {
                    onImageChange(image);
                    setShowImageSelector(false);
                  }}
                  onUpload={async (file) => {
                    // TODO: Implementar upload real
                    return {
                      id: Date.now(),
                      url: URL.createObjectURL(file),
                      name: file.name,
                    };
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Extracto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Extracto</CardTitle>
          <CardDescription>Resumen que aparece en listados</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            placeholder="Breve descripción del post..."
            value={extracto}
            onChange={(e) => onExtractoChange(e.target.value)}
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {extracto.length}/160 caracteres recomendados
          </p>
        </CardContent>
      </Card>

      {/* Etiquetas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Etiquetas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <TagInput
              tags={etiquetas}
              onChange={onEtiquetasChange}
              suggestions={tagSuggestions}
            />
          </div>
          {tagSuggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Sugerencias:</p>
              <div className="flex flex-wrap gap-1">
                {tagSuggestions
                  .filter(s => !etiquetas.includes(s))
                  .slice(0, 6)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => onEtiquetasChange([...etiquetas, tag])}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats/Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Caracteres</span>
            <span>{contenido.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Palabras</span>
            <span>{contenido.split(/\s+/).filter(Boolean).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tiempo de lectura</span>
            <span>~{Math.max(1, Math.round(contenido.split(/\s+/).filter(Boolean).length / 200))} min</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
