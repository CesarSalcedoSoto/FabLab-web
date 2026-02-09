"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/shared/ui/cards/card';
import { Badge } from '@/shared/ui/badges/badge';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import type { Post } from '../../../domain/entities';

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'compact' | 'featured';
}

function formatearFecha(fecha: Date | string | undefined): string {
  if (!fecha) return '';
  const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  if (variant === 'compact') {
    return (
      <Link href={`/blog/${post.slug}`}>
        <div className="group flex items-start gap-4 p-3 rounded-lg transition-colors hover:bg-accent">
          {post.imagenPortada && (
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
              <Image
                src={post.imagenPortada}
                alt={post.titulo}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {post.titulo}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatearFecha(post.fechaPublicacion || post.fechaCreacion)}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/blog/${post.slug}`}>
        <Card className="group overflow-hidden h-full hover:shadow-lg transition-shadow">
          {post.imagenPortada && (
            <div className="relative aspect-video overflow-hidden bg-muted">
              <Image
                src={post.imagenPortada}
                alt={post.titulo}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={75}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <CardContent className="p-6">
            {post.categorias && post.categorias.length > 0 && (
              <div className="flex gap-2 mb-3">
                {post.categorias.slice(0, 2).map(cat => (
                  <Badge key={cat.id} variant="secondary" className="text-xs">
                    {cat.nombre}
                  </Badge>
                ))}
              </div>
            )}
            <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {post.titulo}
            </h3>
            {post.extracto && (
              <p className="mt-2 text-muted-foreground line-clamp-2">
                {post.extracto}
              </p>
            )}
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatearFecha(post.fechaPublicacion || post.fechaCreacion)}
                </span>
                {post.vistas !== undefined && post.vistas > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.vistas}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                Leer más <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {post.imagenPortada && (
            <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden bg-muted">
              <Image
                src={post.imagenPortada}
                alt={post.titulo}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardContent className="flex-1 p-4">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {post.titulo}
            </h3>
            {post.extracto && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {post.extracto}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatearFecha(post.fechaPublicacion || post.fechaCreacion)}
              </span>
              {post.vistas !== undefined && post.vistas > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.vistas}
                </span>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
