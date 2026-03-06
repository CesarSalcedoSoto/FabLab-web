/**
 * Media Collection - Payload CMS
 * 
 * Gestiona archivos multimedia (imágenes, documentos)
 * con generación automática de thumbnails y optimización.
 * 
 * @sizes
 * - thumbnail: 400x300 - Para listados y previews pequeños
 * - card: 768x576 - Para tarjetas de contenido (4:3)
 * - techBox: 600x400 - Para cajas de tecnologías en landing
 * - gallery: 800x600 - Para galerías de imágenes
 * - tablet: 1024xauto - Para visualización en tablet
 * - hero: 1920x1080 - Para imágenes hero/banner
 * - og: 1200x630 - Para Open Graph / redes sociales
 * 
 * @optimization
 * - Formato WebP automático donde sea soportado
 * - Compresión de calidad 80 para balance tamaño/calidad
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isAuthenticated } from '../access/index.ts';

export const Media: CollectionConfig = {
    slug: 'media',
    labels: {
        singular: 'Archivo',
        plural: 'Archivos',
    },
    admin: {
        useAsTitle: 'alt',
        group: 'Contenido',
    },
    access: {
        read: publicRead,
        create: isAuthenticated,
        update: isAuthenticated,
        delete: isAuthenticated,
    },
    upload: {
        staticDir: 'media',
        // Configuración de formato optimizado
        formatOptions: {
            format: 'webp',
            options: {
                quality: 80,
            },
        },
        // Redimensionar imagen original si es muy grande
        resizeOptions: {
            width: 2400,
            height: 2400,
            fit: 'inside',
            withoutEnlargement: true,
        },
        imageSizes: [
            {
                name: 'thumbnail',
                width: 400,
                height: 300,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 75 },
                },
            },
            {
                name: 'techBox',
                width: 600,
                height: 400,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 80 },
                },
            },
            {
                name: 'card',
                width: 768,
                height: 576,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 80 },
                },
            },
            {
                name: 'gallery',
                width: 800,
                height: 600,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 82 },
                },
            },
            {
                name: 'tablet',
                width: 1024,
                height: undefined,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 82 },
                },
            },
            {
                name: 'hero',
                width: 1920,
                height: 1080,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 85 },
                },
            },
            {
                name: 'og',
                width: 1200,
                height: 630,
                position: 'centre',
                formatOptions: {
                    format: 'webp',
                    options: { quality: 85 },
                },
            },
        ],
        adminThumbnail: 'thumbnail',
        mimeTypes: [
            'image/*',
            'application/pdf',
            // Documentos Office
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Archivos comprimidos
            'application/zip',
            'application/x-zip-compressed',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/gzip',
            'application/x-tar',
            // 3D / CAD / Fabricación
            'model/stl',
            'application/sla',
            'application/vnd.ms-pki.stl',
            'application/octet-stream',
            'model/gltf-binary',
            'model/gltf+json',
            'model/obj',
            // Texto / código
            'text/plain',
            'text/csv',
            'text/markdown',
            'application/json',
            'application/xml',
            'text/xml',
            // Otros
            'application/x-iso9660-image',
            'video/*',
            'audio/*',
        ],
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            label: 'Texto Alternativo',
            required: true,
            admin: {
                description: 'Descripción de la imagen para accesibilidad y SEO',
            },
        },
        {
            name: 'caption',
            type: 'text',
            label: 'Leyenda',
        },
    ],
    timestamps: true,
};
