/**
 * Posts Collection - Payload CMS
 * 
 * Blog posts con soporte para editor de texto enriquecido,
 * categorías, etiquetas e imágenes destacadas.
 * 
 * @access
 * - read: Público para publicados, autenticados ven todo
 * - create: Usuarios autenticados
 * - update: Admin/Editor todo, Author solo propios
 * - delete: Admin todo, otros solo borradores propios
 */

import type { CollectionConfig, Access, Where } from 'payload';
import { isAuthenticated } from '../access/index.ts';
import { sendEmail, buildNewPostEmailHtml } from '@/shared/utils/email';

export const Posts: CollectionConfig = {
    slug: 'posts',
    labels: {
        singular: 'Post',
        plural: 'Posts',
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'status', 'author', 'publishedAt'],
        group: 'Blog',
    },
    access: {
        read: ({ req: { user } }) => {
            if (user) return true;
            return { status: { equals: 'published' } };
        },
        create: isAuthenticated,
        update: ({ req: { user } }) => {
            if (!user) return false;
            const role = (user as any).role;
            if (role === 'admin' || role === 'editor') return true;
            return { author: { equals: user.id } };
        },
        delete: (({ req: { user } }) => {
            if (!user) return false;
            const role = (user as { role?: string }).role;
            if (role === 'admin') return true;
            const condition: Where = { status: { not_equals: 'published' as const } };
            if (role !== 'editor') {
                condition.author = { equals: user.id };
            }
            return condition;
        }) as Access,
    },
    hooks: {
        beforeChange: [
            async ({ data, originalDoc, req }) => {
                // Generar slug con formato YYYY/MM/slug
                if (data.title && !data.slug) {
                    data.slug = data.title
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }

                if (data.slug && !data.slug.includes('/')) {
                    const date = new Date(data.publishedAt || data.createdAt || new Date());
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    data.slug = `${year}/${month}/${data.slug}`;
                }

                // Verificar unicidad
                if (data.slug) {
                    let slug = data.slug;
                    let counter = 1;
                    while (true) {
                        const existing = await req.payload.find({
                            collection: 'posts',
                            where: {
                                slug: { equals: slug },
                                id: { not_equals: originalDoc?.id },
                            },
                        });
                        if (existing.docs.length === 0) break;
                        slug = `${data.slug}-${counter}`;
                        counter++;
                    }
                    data.slug = slug;
                }

                return data;
            },
        ],
        afterChange: [
            async ({ doc, previousDoc, req }) => {
                // Solo enviar email cuando el estado cambia a "published"
                const wasPublished = previousDoc?.status === 'published';
                const isNowPublished = doc.status === 'published';

                if (isNowPublished && !wasPublished) {
                    // Enviar notificación en background (no bloquear la respuesta)
                    (async () => {
                        try {
                            // Obtener todos los suscriptores activos
                            const { docs: subscribers } = await req.payload.find({
                                collection: 'blog-subscribers',
                                where: { active: { equals: true } },
                                limit: 10000,
                                depth: 0,
                            });

                            if (subscribers.length === 0) {
                                console.log('[Posts afterChange] No hay suscriptores activos');
                                return;
                            }

                            // Construir URL del post
                            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                                || process.env.NEXT_PUBLIC_SERVER_URL
                                || 'https://fablablosangeles.com';
                            const postUrl = `${baseUrl}/blog/${doc.slug}`;

                            // Imagen destacada
                            let postImageUrl: string | undefined;
                            if (doc.featuredImage) {
                                const imgUrl = typeof doc.featuredImage === 'object'
                                    ? doc.featuredImage.url
                                    : null;
                                if (imgUrl) {
                                    postImageUrl = imgUrl.startsWith('http')
                                        ? imgUrl
                                        : `${baseUrl}${imgUrl}`;
                                }
                            }

                            console.log(`[Posts afterChange] Enviando email a ${subscribers.length} suscriptores para: "${doc.title}"`);

                            // Enviar emails uno por uno (para personalizar unsubscribe link)
                            let sent = 0;
                            let failed = 0;
                            for (const sub of subscribers) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const subscriber = sub as any;
                                const unsubscribeUrl = `${baseUrl}/api/blog/subscribe?unsubscribe=${subscriber.unsubscribeToken}`;

                                const html = buildNewPostEmailHtml({
                                    postTitle: doc.title,
                                    postExcerpt: doc.excerpt,
                                    postUrl,
                                    postImageUrl,
                                    unsubscribeUrl,
                                });

                                const result = await sendEmail({
                                    to: subscriber.email,
                                    subject: `📝 Nuevo en FabLab Blog: ${doc.title}`,
                                    html,
                                    text: `Nuevo artículo: ${doc.title}\n\n${doc.excerpt || ''}\n\nLeer: ${postUrl}\n\nDesuscribirse: ${unsubscribeUrl}`,
                                });

                                if (result.success) sent++;
                                else failed++;
                            }

                            console.log(`[Posts afterChange] Emails enviados: ${sent} OK, ${failed} fallidos`);
                        } catch (err) {
                            console.error('[Posts afterChange] Error enviando notificaciones:', err);
                        }
                    })();
                }
            },
        ],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            label: 'Título',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            label: 'Slug',
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
                description: 'URL amigable (formato: YYYY/MM/slug)',
            },
        },
        {
            name: 'excerpt',
            type: 'textarea',
            label: 'Extracto',
            admin: {
                description: 'Resumen corto para listados y SEO',
            },
        },
        {
            name: 'featuredImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Imagen Destacada',
            admin: { position: 'sidebar' },
        },
        {
            name: 'content',
            type: 'richText',
            label: 'Contenido',
            required: true,
        },
        {
            name: 'author',
            type: 'relationship',
            relationTo: 'users',
            label: 'Autor',
            admin: { position: 'sidebar' },
            hasMany: false,
        },
        {
            name: 'categories',
            type: 'relationship',
            relationTo: 'categories',
            label: 'Categorías',
            hasMany: true,
            admin: { position: 'sidebar' },
        },
        {
            name: 'tags',
            type: 'array',
            label: 'Etiquetas',
            admin: { position: 'sidebar' },
            fields: [
                { name: 'tag', type: 'text', label: 'Etiqueta' },
            ],
        },
        {
            name: 'status',
            type: 'select',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'draft' },
                { label: 'Publicado', value: 'published' },
                { label: 'Archivado', value: 'archived' },
            ],
            defaultValue: 'draft',
            required: true,
            admin: { position: 'sidebar' },
        },
        {
            name: 'publishedAt',
            type: 'date',
            label: 'Fecha de Publicación',
            admin: {
                position: 'sidebar',
                date: { pickerAppearance: 'dayAndTime' },
            },
        },
        {
            name: 'views',
            type: 'number',
            label: 'Vistas',
            defaultValue: 0,
            admin: { position: 'sidebar', readOnly: true },
        },
        {
            name: 'seo',
            type: 'group',
            label: 'SEO',
            fields: [
                { name: 'metaTitle', type: 'text', label: 'Meta Título' },
                { name: 'metaDescription', type: 'textarea', label: 'Meta Descripción' },
                { name: 'keywords', type: 'text', label: 'Palabras Clave', admin: { description: 'Separadas por comas' } },
            ],
        },
    ],
    timestamps: true,
};
