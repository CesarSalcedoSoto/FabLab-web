"use client";

/**
 * Componente de Upload de Imágenes para el Blog
 * 
 * Permite subir imágenes, ver preview y seleccionar de la galería.
 */

import { useState, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Check,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/shared/ui/buttons/button';

export interface ImageData {
  id: number;
  url: string;
  name: string;
  alternativeText?: string;
  width?: number;
  height?: number;
}

interface ImageUploaderProps {
  /** Imagen actual (si hay) */
  value?: ImageData | null;
  /** Callback cuando se selecciona/sube una imagen */
  onChange: (image: ImageData | null) => void;
  /** Función para subir la imagen al servidor */
  onUpload: (file: File) => Promise<ImageData>;
  /** Placeholder */
  placeholder?: string;
  /** Aspecto de la imagen (ej: "16/9", "1/1") */
  aspectRatio?: string;
  /** Tamaño máximo en MB */
  maxSizeMB?: number;
  /** Tipos de archivo permitidos */
  acceptTypes?: string[];
  /** Mostrar botón de galería */
  showGallery?: boolean;
  /** Callback para abrir galería */
  onOpenGallery?: () => void;
  /** Clase CSS adicional */
  className?: string;
  /** Disabled */
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onUpload,
  placeholder = 'Arrastra una imagen o haz clic para seleccionar',
  aspectRatio = '16/9',
  maxSizeMB = 5,
  acceptTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  showGallery = true,
  onOpenGallery,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Usa: ${acceptTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB`;
    }
    
    return null;
  }, [acceptTypes, maxSizeMB]);

  const uploadFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await onUpload(file);
      onChange(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, onUpload, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [disabled, uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [uploadFile]);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  // Con imagen seleccionada
  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <div 
          className="relative overflow-hidden rounded-lg border bg-muted"
          style={{ aspectRatio }}
        >
          <NextImage
            src={value.url}
            alt={value.alternativeText || value.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            quality={75}
          />
          
          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleClick}
              disabled={disabled}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Cambiar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Badge de éxito */}
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        </div>

        {/* Info de imagen */}
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {value.name}
          {value.width && value.height && ` • ${value.width}x${value.height}`}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // Sin imagen - área de drop
  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          uploadError && "border-destructive/50"
        )}
        style={{ aspectRatio }}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Subiendo...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
            <Upload className="h-8 w-8" />
            <span className="text-sm text-center">{placeholder}</span>
            <span className="text-xs">
              Máx. {maxSizeMB}MB • {acceptTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={acceptTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {uploadError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="h-3 w-3" />
          {uploadError}
        </p>
      )}

      {/* Botón de galería */}
      {showGallery && onOpenGallery && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenGallery}
          disabled={disabled}
          className="w-full"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Seleccionar de galería
        </Button>
      )}
    </div>
  );
}

// ============================================
// Galería de Imágenes
// ============================================

interface ImageGalleryProps {
  images: ImageData[];
  loading?: boolean;
  onSelect: (image: ImageData) => void;
  onDelete?: (id: number) => void;
  selectedId?: number;
  className?: string;
}

export function ImageGallery({
  images,
  loading = false,
  onSelect,
  onDelete,
  selectedId,
  className,
}: ImageGalleryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
        <p>No hay imágenes en la galería</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2", className)}>
      {images.map((image) => (
        <div
          key={image.id}
          onClick={() => onSelect(image)}
          className={cn(
            "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group",
            selectedId === image.id 
              ? "border-primary ring-2 ring-primary/20" 
              : "border-transparent hover:border-primary/50"
          )}
        >
          <NextImage
            src={image.url}
            alt={image.alternativeText || image.name}
            fill
            sizes="(max-width: 768px) 33vw, 20vw"
            className="object-cover"
            quality={70}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
          
          {/* Check si está seleccionada */}
          {selectedId === image.id && (
            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
              <Check className="h-3 w-3" />
            </div>
          )}

          {/* Botón eliminar */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(image.id);
              }}
              className="absolute bottom-1 right-1 bg-destructive text-destructive-foreground rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Modal de Galería
// ============================================

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (image: ImageData) => void;
  images: ImageData[];
  loading?: boolean;
  onUpload?: (file: File) => Promise<ImageData>;
  onDelete?: (id: number) => void;
}

export function ImageGalleryModal({
  open,
  onClose,
  onSelect,
  images,
  loading = false,
  onUpload,
  onDelete,
}: ImageGalleryModalProps) {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (image: ImageData) => {
    setSelectedImage(image);
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      onClose();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setIsUploading(true);
    try {
      const result = await onUpload(file);
      setSelectedImage(result);
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Galería de Imágenes</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <ImageGallery
            images={images}
            loading={loading}
            onSelect={handleSelect}
            onDelete={onDelete}
            selectedId={selectedImage?.id}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            {onUpload && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Subir nueva
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedImage}
            >
              Seleccionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
