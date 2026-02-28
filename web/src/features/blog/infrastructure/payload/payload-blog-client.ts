/**
 * Cliente de Blog para Payload CMS
 * 
 * Este cliente usa la API local de Payload CMS para operaciones CRUD de posts.
 * Funciona tanto en el servidor (Local API) como en el cliente (REST API).
 */

import type { Post, PostsPaginados, FiltrosPosts, PostInput, Categoria } from '../../domain/entities';
import type { PayloadPost, PayloadMedia, PayloadUser, PayloadCategory } from './types';

const POSTS_POR_PAGINA = 10;

export interface PayloadBlogClientConfig {
    baseUrl?: string;
    token?: string;
}

export class PayloadBlogClient {
    private baseUrl: string;
    private token?: string;

    constructor(config: PayloadBlogClientConfig = {}) {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || '';
        this.baseUrl = config.baseUrl ?? (typeof window === 'undefined' ? serverUrl : '');
        this.token = config.token;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    private async handleResponse<T>(res: Response): Promise<T> {
        if (!res.ok) {
            const error = await res.json().catch(() => ({ errors: [{ message: 'Error desconocido' }] }));
            throw new Error(error.errors?.[0]?.message || `Error ${res.status}`);
        }
        return res.json();
    }

    // ==================== HELPERS DE URL ====================

    /**
     * Normaliza una URL de media para que sea relativa.
     * Si Payload devuelve URL absoluta (ej: http://195.35.42.214:9011/api/payload/media/...),
     * la convierte a solo /api/payload/media/...
     */
    private normalizeMediaUrl(url: string | undefined | null): string | undefined {
        if (!url) return undefined;
        // Si ya es relativa, devolver tal cual
        if (url.startsWith('/')) return url;
        // Extraer la ruta relativa de una URL absoluta
        try {
            const parsed = new URL(url);
            return parsed.pathname;
        } catch {
            // Si no se puede parsear, intentar extraer desde /api/
            const apiIndex = url.indexOf('/api/');
            if (apiIndex !== -1) return url.substring(apiIndex);
            // Intentar desde /media/
            const mediaIndex = url.indexOf('/media/');
            if (mediaIndex !== -1) return url.substring(mediaIndex);
            return url;
        }
    }

    // ==================== VALIDACIÓN Y SANITIZACIÓN ====================

    /** Sanitiza un string removiendo caracteres peligrosos */
    private sanitizeString(str: string | undefined | null): string {
        if (!str) return '';
        return str
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .substring(0, 50000); // Limit length
    }

    /** Sanitiza y valida una etiqueta */
    private sanitizeTag(tag: string): string {
        return tag
            .trim()
            .toLowerCase()
            .replace(/[<>\"'&]/g, '') // Remove HTML special chars
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .substring(0, 100); // Limit length
    }

    /** Valida el input de un post */
    private validatePostInput(input: PostInput): void {
        if (!input.titulo || input.titulo.trim().length === 0) {
            throw new Error('El título es requerido');
        }
        if (input.titulo.length > 500) {
            throw new Error('El título no puede exceder 500 caracteres');
        }
        if (!input.contenido || input.contenido.trim().length === 0) {
            throw new Error('El contenido es requerido');
        }
        if (input.extracto && input.extracto.length > 1000) {
            throw new Error('El extracto no puede exceder 1000 caracteres');
        }
        if (input.etiquetas && input.etiquetas.length > 20) {
            throw new Error('No se pueden agregar más de 20 etiquetas');
        }
    }

    /** Valida un ID */
    private validateId(id: string): void {
        if (!id || id.trim().length === 0) {
            throw new Error('ID inválido');
        }
        // Validar que sea un ID numérico o un slug válido
        if (!/^[\w\-\/]+$/.test(id)) {
            throw new Error('Formato de ID inválido');
        }
    }

    /** Convierte un post de Payload a dominio */
    private payloadToPost(payloadPost: PayloadPost): Post {
        const featuredImage = payloadPost.featuredImage as PayloadMedia | undefined;
        const author = payloadPost.author as PayloadUser | undefined;
        const categories = payloadPost.categories as PayloadCategory[] | undefined;

        return {
            id: String(payloadPost.id),
            titulo: payloadPost.title,
            slug: payloadPost.slug || '',
            contenido: this.serializeRichText(payloadPost.content),
            extracto: payloadPost.excerpt,
            imagenPortada: this.normalizeMediaUrl(featuredImage?.url),
            imagenDestacada: featuredImage ? {
                id: String(featuredImage.id),
                url: this.normalizeMediaUrl(featuredImage.url) || '',
                filename: featuredImage.filename,
                alt: featuredImage.alt,
                width: featuredImage.width,
                height: featuredImage.height,
            } : undefined,
            autor: author ? {
                id: String(author.id),
                nombre: author.name || author.email,
                avatar: this.normalizeMediaUrl((author.avatar as PayloadMedia)?.url),
                bio: author.bio,
            } : undefined,
            categorias: categories?.map(cat => ({
                id: String(cat.id),
                nombre: cat.name,
                slug: cat.slug || '',
                descripcion: cat.description,
            })),
            etiquetas: payloadPost.tags?.map((t: { tag: string }) => t.tag).filter(Boolean) as string[],
            vistas: payloadPost.views || 0,
            estado: payloadPost.status === 'published' ? 'publicado' :
                payloadPost.status === 'archived' ? 'archivado' : 'borrador',
            fechaPublicacion: payloadPost.publishedAt || undefined,
            fechaCreacion: payloadPost.createdAt,
            fechaActualizacion: payloadPost.updatedAt,
        };
    }

    /** Serializa el contenido Rich Text de Lexical a HTML/Markdown */
    private serializeRichText(content: unknown): string {
        if (!content) return '';
        if (typeof content === 'string') return content;

        try {
            const lexicalContent = content as { root?: { children?: unknown[] } };
            if (lexicalContent.root?.children) {
                return this.serializeLexicalNodes(lexicalContent.root.children);
            }
            return JSON.stringify(content);
        } catch {
            return '';
        }
    }

    /** Serializa nodos de Lexical a texto/markdown */
    private serializeLexicalNodes(nodes: unknown[]): string {
        return nodes.map(node => {
            const n = node as { type?: string; text?: string; children?: unknown[]; tag?: string; format?: number };

            if (n.type === 'text') {
                let text = n.text || '';
                if (n.format) {
                    if (n.format & 1) text = `**${text}**`;
                    if (n.format & 2) text = `*${text}*`;
                }
                return text;
            }

            if (n.type === 'paragraph' && n.children) {
                return this.serializeLexicalNodes(n.children) + '\n\n';
            }

            if (n.type === 'heading' && n.children) {
                const level = n.tag?.replace('h', '') || '1';
                const prefix = '#'.repeat(parseInt(level));
                return `${prefix} ${this.serializeLexicalNodes(n.children)}\n\n`;
            }

            if (n.type === 'list' && n.children) {
                return n.children.map(item => {
                    const itemNode = item as { children?: unknown[] };
                    return `- ${this.serializeLexicalNodes(itemNode.children || [])}`;
                }).join('\n') + '\n\n';
            }

            if (n.children) {
                return this.serializeLexicalNodes(n.children);
            }

            return '';
        }).join('');
    }

    /** Construye query params para Payload */
    private buildQueryParams(filtros?: FiltrosPosts): URLSearchParams {
        const params = new URLSearchParams();

        params.set('page', String(filtros?.pagina || 1));
        params.set('limit', String(filtros?.porPagina || POSTS_POR_PAGINA));
        params.set('depth', '2');

        // Búsqueda en título, extracto Y tags
        if (filtros?.busqueda) {
            const busqueda = filtros.busqueda.trim();
            params.set('where[or][0][title][contains]', busqueda);
            params.set('where[or][1][excerpt][contains]', busqueda);
            // Buscar en el array de tags (campo nested)
            params.set('where[or][2][tags.tag][contains]', busqueda);
        }

        // Filtrar por categoría
        if (filtros?.categoria) {
            params.set('where[categories.slug][equals]', filtros.categoria);
        }

        // Filtrar por etiqueta individual
        if (filtros?.etiqueta) {
            params.set('where[tags.tag][equals]', filtros.etiqueta);
        }

        // Filtrar por múltiples etiquetas (OR - cualquiera de las etiquetas)
        if (filtros?.etiquetas && filtros.etiquetas.length > 0) {
            filtros.etiquetas.forEach((tag, index) => {
                params.set(`where[or][${index}][tags.tag][equals]`, tag);
            });
        }

        // Filtrar por autor
        if (filtros?.autor) {
            params.set('where[author][equals]', filtros.autor);
        }

        // Filtrar por estado
        if (filtros?.estado === 'publicado' || filtros?.estado === 'published') {
            params.set('where[status][equals]', 'published');
        } else if (filtros?.estado === 'borrador' || filtros?.estado === 'draft') {
            params.set('where[status][equals]', 'draft');
        } else if (filtros?.estado === 'archivado' || filtros?.estado === 'archived') {
            params.set('where[status][equals]', 'archived');
        }

        // Filtrar por rango de fechas
        if (filtros?.fechaInicio) {
            params.set('where[publishedAt][greater_than_equal]', filtros.fechaInicio);
        }
        if (filtros?.fechaFin) {
            params.set('where[publishedAt][less_than_equal]', filtros.fechaFin);
        }

        // Ordenamiento
        const ordenarPor = filtros?.ordenarPor || 'fecha';
        const orden = filtros?.orden || 'desc';
        const sortField = ordenarPor === 'fecha' ? 'publishedAt' :
            ordenarPor === 'vistas' ? 'views' : 'title';
        params.set('sort', orden === 'desc' ? `-${sortField}` : sortField);

        return params;
    }

    /** Convierte Markdown a formato Lexical */
    private parseMarkdownToLexical(markdown: string): unknown {
        const paragraphs = markdown.split(/\n\n+/);

        const children = paragraphs.map(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                return {
                    type: 'heading',
                    tag: `h${level}`,
                    children: [{ type: 'text', text: headerMatch[2] }],
                };
            }

            return {
                type: 'paragraph',
                children: [{ type: 'text', text: trimmed }],
            };
        }).filter(Boolean);

        return {
            root: {
                type: 'root',
                children,
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
            },
        };
    }

    // ==================== POSTS ====================

    async getPosts(filtros?: FiltrosPosts): Promise<PostsPaginados> {
        const params = this.buildQueryParams(filtros);
        const url = `${this.baseUrl}/api/payload/posts?${params}`;

        const res = await fetch(url, {
            headers: this.getHeaders(),
            cache: 'no-store',
        });

        const data = await this.handleResponse<{
            docs: PayloadPost[];
            totalDocs: number;
            page: number;
            limit: number;
            totalPages: number;
        }>(res);

        return {
            posts: data.docs.map(p => this.payloadToPost(p)),
            total: data.totalDocs,
            pagina: data.page,
            porPagina: data.limit,
            totalPaginas: data.totalPages,
        };
    }

    async getPost(idOrSlug: string): Promise<Post> {
        const isNumeric = /^\d+$/.test(idOrSlug);

        let url: string;
        if (isNumeric) {
            url = `${this.baseUrl}/api/payload/posts/${idOrSlug}?depth=2`;
        } else {
            url = `${this.baseUrl}/api/payload/posts?where[slug][equals]=${encodeURIComponent(idOrSlug)}&depth=2`;
        }

        const res = await fetch(url, {
            headers: this.getHeaders(),
            cache: 'no-store',
        });

        if (isNumeric) {
            const data = await this.handleResponse<PayloadPost>(res);
            return this.payloadToPost(data);
        }

        const data = await this.handleResponse<{ docs: PayloadPost[] }>(res);
        if (data.docs.length === 0) {
            throw new Error('Post no encontrado');
        }

        return this.payloadToPost(data.docs[0]);
    }

    async getPostsRecientes(limite = 5): Promise<Post[]> {
        const result = await this.getPosts({
            estado: 'publicado',
            ordenarPor: 'fecha',
            orden: 'desc',
            porPagina: limite,
        });
        return result.posts;
    }

    async getPostsPopulares(limite = 5): Promise<Post[]> {
        const result = await this.getPosts({
            estado: 'publicado',
            ordenarPor: 'vistas',
            orden: 'desc',
            porPagina: limite,
        });
        return result.posts;
    }

    async getPostsTendencia(limite = 5, dias = 30): Promise<Post[]> {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - dias);

        const result = await this.getPosts({
            estado: 'publicado',
            ordenarPor: 'vistas',
            orden: 'desc',
            porPagina: limite,
            fechaInicio: fechaInicio.toISOString(),
        });
        return result.posts;
    }

    async createPost(input: PostInput): Promise<Post> {
        // Validar input
        this.validatePostInput(input);

        // Sanitizar datos
        const sanitizedTitle = this.sanitizeString(input.titulo);
        const sanitizedExcerpt = this.sanitizeString(input.extracto);
        const sanitizedTags = input.etiquetas?.map(tag => ({ tag: this.sanitizeTag(tag) })).filter(t => t.tag.length > 0);

        const res = await fetch(`${this.baseUrl}/api/payload/posts`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                title: sanitizedTitle,
                content: this.parseMarkdownToLexical(input.contenido),
                excerpt: sanitizedExcerpt,
                featuredImage: input.featuredImageId,
                tags: sanitizedTags,
                status: input.estado === 'publicado' || input.estado === 'published' ? 'published' :
                    input.estado === 'archivado' || input.estado === 'archived' ? 'archived' : 'draft',
                publishedAt: (input.estado === 'publicado' || input.estado === 'published') ? new Date().toISOString() : null,
            }),
        });

        const data = await this.handleResponse<{ doc: PayloadPost }>(res);
        return this.payloadToPost(data.doc);
    }

    async updatePost(id: string, input: Partial<PostInput>): Promise<Post> {
        // Validar ID
        this.validateId(id);

        // Validaciones opcionales
        if (input.titulo !== undefined && input.titulo.length > 500) {
            throw new Error('El título no puede exceder 500 caracteres');
        }
        if (input.extracto !== undefined && input.extracto.length > 1000) {
            throw new Error('El extracto no puede exceder 1000 caracteres');
        }
        if (input.etiquetas !== undefined && input.etiquetas.length > 20) {
            throw new Error('No se pueden agregar más de 20 etiquetas');
        }

        const updateData: Record<string, unknown> = {};

        // Sanitizar y agregar solo los campos presentes
        if (input.titulo !== undefined) updateData.title = this.sanitizeString(input.titulo);
        if (input.contenido !== undefined) updateData.content = this.parseMarkdownToLexical(input.contenido);
        if (input.extracto !== undefined) updateData.excerpt = this.sanitizeString(input.extracto);
        if (input.featuredImageId !== undefined) updateData.featuredImage = input.featuredImageId;
        if (input.etiquetas !== undefined) {
            updateData.tags = input.etiquetas
                .map(tag => ({ tag: this.sanitizeTag(tag) }))
                .filter(t => t.tag.length > 0);
        }

        const res = await fetch(`${this.baseUrl}/api/payload/posts/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(updateData),
        });

        const data = await this.handleResponse<{ doc: PayloadPost }>(res);
        return this.payloadToPost(data.doc);
    }

    async publishPost(id: string): Promise<Post> {
        this.validateId(id);

        const res = await fetch(`${this.baseUrl}/api/payload/posts/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
                status: 'published',
                publishedAt: new Date().toISOString(),
            }),
        });

        const data = await this.handleResponse<{ doc: PayloadPost }>(res);
        return this.payloadToPost(data.doc);
    }

    async unpublishPost(id: string): Promise<Post> {
        this.validateId(id);

        const res = await fetch(`${this.baseUrl}/api/payload/posts/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
                status: 'draft',
                publishedAt: null,
            }),
        });

        const data = await this.handleResponse<{ doc: PayloadPost }>(res);
        return this.payloadToPost(data.doc);
    }

    async deletePost(id: string): Promise<void> {
        this.validateId(id);

        const res = await fetch(`${this.baseUrl}/api/payload/posts/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ errors: [{ message: 'Error al eliminar post' }] }));
            throw new Error(error.errors?.[0]?.message || 'Error al eliminar post');
        }
    }

    async incrementViews(id: string): Promise<void> {
        try {
            this.validateId(id);

            // First get current views - race condition possible but acceptable for this use case
            const post = await this.getPost(id);
            const currentViews = post.vistas || 0;

            await fetch(`${this.baseUrl}/api/payload/posts/${id}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    views: currentViews + 1,
                }),
            });
        } catch (error) {
            console.error('Error incrementing views for post:', id, error);
        }
    }

    // ==================== CATEGORÍAS ====================

    async getCategories(): Promise<Categoria[]> {
        const res = await fetch(`${this.baseUrl}/api/payload/categories?limit=100&depth=1`, {
            headers: this.getHeaders(),
            cache: 'no-store',
        });

        const data = await this.handleResponse<{ docs: PayloadCategory[] }>(res);

        return data.docs.map((cat: PayloadCategory) => ({
            id: String(cat.id),
            nombre: cat.name,
            slug: cat.slug || '',
            descripcion: cat.description,
        }));
    }

    // ==================== ETIQUETAS (TAGS) ====================

    /** Obtiene todas las etiquetas únicas de todos los posts */
    async getTags(): Promise<string[]> {
        try {
            // Obtener todos los posts con solo el campo tags
            const res = await fetch(`${this.baseUrl}/api/payload/posts?limit=1000&depth=0`, {
                headers: this.getHeaders(),
                cache: 'no-store',
            });

            const data = await this.handleResponse<{ docs: PayloadPost[] }>(res);

            // Extraer todas las etiquetas únicas
            const allTags = new Set<string>();
            data.docs.forEach(post => {
                post.tags?.forEach(t => {
                    if (t.tag) {
                        allTags.add(t.tag.toLowerCase().trim());
                    }
                });
            });

            // Retornar ordenadas alfabéticamente
            return Array.from(allTags).sort();
        } catch (error) {
            console.error('Error getting tags:', error);
            return [];
        }
    }

    /** Busca posts por una etiqueta específica */
    async getPostsByTag(tag: string, limite = 10): Promise<Post[]> {
        try {
            const result = await this.getPosts({
                etiqueta: tag,
                estado: 'publicado',
                ordenarPor: 'fecha',
                orden: 'desc',
                porPagina: limite,
            });
            return result.posts;
        } catch (error) {
            console.error('Error getting posts by tag:', tag, error);
            return [];
        }
    }

    /** Busca etiquetas que coincidan con un término (para autocompletar) */
    async searchTags(query: string): Promise<string[]> {
        const allTags = await this.getTags();
        const lowerQuery = query.toLowerCase().trim();

        return allTags.filter(tag => tag.includes(lowerQuery));
    }

    /** Obtiene los tags más populares (por cantidad de posts) */
    async getPopularTags(limite = 10): Promise<{ tag: string; count: number }[]> {
        try {
            const res = await fetch(`${this.baseUrl}/api/payload/posts?limit=1000&depth=0&where[status][equals]=published`, {
                headers: this.getHeaders(),
                cache: 'no-store',
            });

            const data = await this.handleResponse<{ docs: PayloadPost[] }>(res);

            // Contar ocurrencias de cada tag
            const tagCounts = new Map<string, number>();
            data.docs.forEach(post => {
                post.tags?.forEach(t => {
                    if (t.tag) {
                        const normalizedTag = t.tag.toLowerCase().trim();
                        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
                    }
                });
            });

            // Ordenar por popularidad y tomar los primeros
            return Array.from(tagCounts.entries())
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limite);
        } catch (error) {
            console.error('Error getting popular tags:', error);
            return [];
        }
    }
}

// Singleton
let clientInstance: PayloadBlogClient | null = null;

export function getPayloadBlogClient(config?: PayloadBlogClientConfig): PayloadBlogClient {
    if (!clientInstance && config) {
        clientInstance = new PayloadBlogClient(config);
    }
    if (!clientInstance) {
        clientInstance = new PayloadBlogClient();
    }
    return clientInstance;
}

export function setPayloadBlogClientForTest(client: PayloadBlogClient | null): void {
    clientInstance = client;
}

export const payloadBlogClient = getPayloadBlogClient();
