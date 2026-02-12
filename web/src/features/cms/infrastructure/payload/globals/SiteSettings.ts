/**
 * SiteSettings Global - Payload CMS
 * 
 * Configuración general del sitio web.
 */

import type { GlobalConfig } from 'payload';
import { isAdmin } from '../access/index.ts';

export const SiteSettings: GlobalConfig = {
    slug: 'site-settings',
    label: 'Configuración del Sitio',
    admin: {
        group: 'Configuración',
        description: 'Ajustes generales del sitio web',
    },
    access: {
        read: () => true,
        update: isAdmin,
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'General',
                    fields: [
                        {
                            name: 'siteName',
                            type: 'text',
                            required: true,
                            label: 'Nombre del Sitio',
                            defaultValue: 'FabLab INACAP Los Ángeles',
                        },
                        {
                            name: 'siteDescription',
                            type: 'textarea',
                            label: 'Descripción SEO',
                            admin: {
                                description: 'Descripción para motores de búsqueda',
                            },
                        },
                        {
                            name: 'logo',
                            type: 'upload',
                            relationTo: 'media',
                            label: 'Logo Principal',
                        },
                        {
                            name: 'logoAlt',
                            type: 'upload',
                            relationTo: 'media',
                            label: 'Logo Alternativo',
                            admin: {
                                description: 'Versión clara para fondos oscuros',
                            },
                        },
                        {
                            name: 'favicon',
                            type: 'upload',
                            relationTo: 'media',
                            label: 'Favicon',
                        },
                    ],
                },
                {
                    label: 'Contacto',
                    fields: [
                        {
                            name: 'contactEmail',
                            type: 'email',
                            label: 'Email de Contacto',
                        },
                        {
                            name: 'contactPhone',
                            type: 'text',
                            label: 'Teléfono',
                        },
                        {
                            name: 'whatsapp',
                            type: 'text',
                            label: 'WhatsApp',
                            admin: {
                                description: 'Número con código de país (ej: +56912345678)',
                            },
                        },
                        {
                            name: 'address',
                            type: 'textarea',
                            label: 'Dirección',
                        },
                        {
                            name: 'googleMapsUrl',
                            type: 'text',
                            label: 'URL de Google Maps',
                        },
                        {
                            name: 'schedule',
                            type: 'textarea',
                            label: 'Horario de Atención',
                            admin: {
                                description: 'Ej: "Lunes a Viernes: 9:00 - 18:00"',
                            },
                        },
                    ],
                },
                {
                    label: 'Redes Sociales',
                    fields: [
                        {
                            name: 'socialLinks',
                            type: 'array',
                            label: 'Redes Sociales',
                            fields: [
                                {
                                    name: 'platform',
                                    type: 'select',
                                    required: true,
                                    label: 'Plataforma',
                                    options: [
                                        { label: 'Instagram', value: 'instagram' },
                                        { label: 'Facebook', value: 'facebook' },
                                        { label: 'Twitter/X', value: 'twitter' },
                                        { label: 'LinkedIn', value: 'linkedin' },
                                        { label: 'YouTube', value: 'youtube' },
                                        { label: 'TikTok', value: 'tiktok' },
                                        { label: 'GitHub', value: 'github' },
                                        { label: 'Discord', value: 'discord' },
                                    ],
                                },
                                {
                                    name: 'url',
                                    type: 'text',
                                    required: true,
                                    label: 'URL',
                                },
                                {
                                    name: 'label',
                                    type: 'text',
                                    label: 'Texto (opcional)',
                                },
                            ],
                        },
                    ],
                },
                {
                    label: 'Avanzado',
                    fields: [
                        {
                            name: 'googleAnalyticsId',
                            type: 'text',
                            label: 'Google Analytics ID',
                            admin: {
                                description: 'Ej: G-XXXXXXXXXX',
                            },
                        },
                        {
                            name: 'customScripts',
                            type: 'code',
                            label: 'Scripts Personalizados',
                            admin: {
                                language: 'html',
                                description: 'Scripts que se insertarán en el <head>',
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
