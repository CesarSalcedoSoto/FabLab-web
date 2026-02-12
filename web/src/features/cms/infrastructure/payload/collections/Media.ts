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
        imageSizes: [
            {
                name: 'thumbnail',
                width: 400,
                height: 300,
                position: 'centre',
            },
            {
                name: 'card',
                width: 768,
                height: 1024,
                position: 'centre',
            },
            {
                name: 'tablet',
                width: 1024,
                height: undefined,
                position: 'centre',
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
