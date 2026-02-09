/**
 * Media Collection - Payload CMS
 * 
 * Gestiona archivos multimedia (imágenes, documentos)
 * con generación automática de thumbnails y optimización.
 * 
 * @sizes
 * - thumbnail: 400x300 - Para listados y previews
 * - card: 768x1024 - Para tarjetas de contenido
 * - tablet: 1024xauto - Para visualización en tablet
 */

import type { CollectionConfig } from 'payload';
import { publicRead, isAuthenticated } from '../access';

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
        // Forzar conversión a WebP para imágenes (menor peso, misma calidad)
        formatOptions: {
            format: 'webp',
            options: {
                quality: 80,
            },
        },
        imageSizes: [
            {
                name: 'thumbnail',
                width: 400,
                height: 300,
                position: 'centre',
                formatOptions: { format: 'webp', options: { quality: 75 } },
            },
            {
                name: 'card',
                width: 768,
                height: 1024,
                position: 'centre',
                formatOptions: { format: 'webp', options: { quality: 80 } },
            },
            {
                name: 'tablet',
                width: 1024,
                height: undefined,
                position: 'centre',
                formatOptions: { format: 'webp', options: { quality: 80 } },
            },
            {
                name: 'og',
                width: 1200,
                height: 630,
                position: 'centre',
                formatOptions: { format: 'webp', options: { quality: 80 } },
            },
        ],
        adminThumbnail: 'thumbnail',
        mimeTypes: ['image/*', 'application/pdf'],
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
