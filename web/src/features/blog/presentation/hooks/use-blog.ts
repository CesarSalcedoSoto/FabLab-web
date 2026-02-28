"use client";

import { useState, useCallback, useMemo, useRef } from 'react';
import type { Post, FiltrosPosts, PostInput } from '../../domain/entities';
import { PayloadBlogClient } from '../../infrastructure/payload/payload-blog-client';

// Utilidad para obtener cookie en cliente
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

interface UseBlogState {
  posts: Post[];
  postActual: Post | null;
  total: number;
  pagina: number;
  totalPaginas: number;
  cargando: boolean;
  error: string | null;
  filtros: FiltrosPosts;
}

interface UseBlogActions {
  cargarPosts: (nuevosFiltros?: Partial<FiltrosPosts>) => Promise<void>;
  cambiarPagina: (pagina: number) => void;
  cambiarOrden: (ordenarPor: 'fecha' | 'vistas' | 'titulo', orden: 'asc' | 'desc') => void;
  cargarPost: (idOrSlug: string) => Promise<void>;
  cargarPostsRecientes: (limite?: number) => Promise<Post[]>;
  cargarPostsPopulares: (limite?: number) => Promise<Post[]>;
  cargarPostsTendencia: (limite?: number, dias?: number) => Promise<Post[]>;
  crearPost: (input: PostInput) => Promise<Post>;
  actualizarPost: (id: string, input: Partial<PostInput>) => Promise<void>;
  publicarPost: (id: string) => Promise<void>;
  despublicarPost: (id: string) => Promise<void>;
  eliminarPost: (id: string) => Promise<void>;
  limpiarError: () => void;
  registrarVista: (id: string) => Promise<void>;
  // Métodos de etiquetas
  cargarTags: () => Promise<string[]>;
  buscarPorTag: (tag: string, limite?: number) => Promise<Post[]>;
  buscarTags: (query: string) => Promise<string[]>;
  cargarTagsPopulares: (limite?: number) => Promise<{ tag: string; count: number }[]>;
}

export type UseBlogResult = UseBlogState & UseBlogActions;

export function useBlog(): UseBlogResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postActual, setPostActual] = useState<Post | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosPosts>({
    pagina: 1,
    porPagina: 10,
    ordenarPor: 'fecha',
    orden: 'desc',
  });

  // Ref para mantener los filtros actualizados sin causar ciclos de dependencia en useCallback
  const filtrosRef = useRef<FiltrosPosts>(filtros);

  const client = useMemo(() => {
    const token = getCookie('fablab_jwt');
    return new PayloadBlogClient({
      baseUrl: '',
      token,
    });
  }, []);

  const cargarPosts = useCallback(async (nuevosFiltros?: Partial<FiltrosPosts>) => {
    // Si ya está cargando, evitar llamadas duplicadas si es posible, 
    // pero a veces queremos recargar con nuevos filtros.
    // Para simplificar y evitar loops, no bloqueamos estrictamente, pero se podría.

    setCargando(true);
    setError(null);

    // Usar el ref para obtener los filtros actuales sin depender de ellos
    const filtrosActuales = filtrosRef.current;

    // Combinar filtros actuales con nuevos
    const filtrosActualizados = { ...filtrosActuales, ...nuevosFiltros };

    // Si cambiaron filtros de búsqueda/estado, volver a página 1 salvo que se especifique página
    if (nuevosFiltros && !nuevosFiltros.pagina) {
      if (nuevosFiltros.busqueda !== undefined || nuevosFiltros.estado !== undefined) {
        filtrosActualizados.pagina = 1;
      }
    }

    // Actualizar Ref y Estado
    filtrosRef.current = filtrosActualizados;
    setFiltros(filtrosActualizados);

    try {
      const result = await client.getPosts(filtrosActualizados);
      setPosts(result.posts);
      setTotal(result.total);
      setPagina(result.pagina);
      setTotalPaginas(result.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar posts');
    } finally {
      setCargando(false);
    }
  }, [client]); // Dependencias reducidas: client es estable (useMemo)

  const cambiarPagina = useCallback((nuevaPagina: number) => {
    cargarPosts({ pagina: nuevaPagina });
  }, [cargarPosts]);

  const cambiarOrden = useCallback((ordenarPor: 'fecha' | 'vistas' | 'titulo', orden: 'asc' | 'desc') => {
    cargarPosts({ ordenarPor, orden });
  }, [cargarPosts]);

  const cargarPost = useCallback(async (idOrSlug: string) => {
    setCargando(true);
    setError(null);
    try {
      const post = await client.getPost(idOrSlug);
      setPostActual(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar post');
    } finally {
      setCargando(false);
    }
  }, [client]);

  const cargarPostsRecientes = useCallback(async (limite = 5): Promise<Post[]> => {
    try {
      return await client.getPostsRecientes(limite);
    } catch (err) {
      console.error('Error cargando posts recientes:', err);
      return [];
    }
  }, [client]);

  const cargarPostsPopulares = useCallback(async (limite = 5): Promise<Post[]> => {
    try {
      return await client.getPostsPopulares(limite);
    } catch (err) {
      console.error('Error cargando posts populares:', err);
      return [];
    }
  }, [client]);

  const cargarPostsTendencia = useCallback(async (limite = 5, dias = 30): Promise<Post[]> => {
    try {
      return await client.getPostsTendencia(limite, dias);
    } catch (err) {
      console.error('Error cargando tendencias:', err);
      return [];
    }
  }, [client]);

  const crearPost = useCallback(async (input: PostInput): Promise<Post> => {
    setCargando(true);
    setError(null);
    try {
      const nuevo = await client.createPost(input);
      setPosts(prev => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear post';
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client]);

  const actualizarPost = useCallback(async (id: string, input: Partial<PostInput>) => {
    setCargando(true);
    setError(null);
    try {
      const actualizado = await client.updatePost(id, input);
      setPosts(prev => prev.map(p => p.id === id ? actualizado : p));
      if (postActual?.id === id) {
        setPostActual(actualizado);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar post');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, postActual]);

  const publicarPost = useCallback(async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      const actualizado = await client.publishPost(id);
      setPosts(prev => prev.map(p => p.id === id ? actualizado : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar post');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client]);

  const despublicarPost = useCallback(async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      const actualizado = await client.unpublishPost(id);
      setPosts(prev => prev.map(p => p.id === id ? actualizado : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al despublicar post');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client]);

  const eliminarPost = useCallback(async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      await client.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar post');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client]);

  const registrarVista = useCallback(async (id: string) => {
    try {
      await client.incrementViews(id);
    } catch (err) {
      console.error("Error registrando vista", err);
    }
  }, [client]);

  const limpiarError = useCallback(() => setError(null), []);

  // ==================== MÉTODOS DE ETIQUETAS ====================

  const cargarTags = useCallback(async (): Promise<string[]> => {
    try {
      return await client.getTags();
    } catch (err) {
      console.error('Error cargando tags:', err);
      return [];
    }
  }, [client]);

  const buscarPorTag = useCallback(async (tag: string, limite = 10): Promise<Post[]> => {
    try {
      return await client.getPostsByTag(tag, limite);
    } catch (err) {
      console.error('Error buscando por tag:', err);
      return [];
    }
  }, [client]);

  const buscarTags = useCallback(async (query: string): Promise<string[]> => {
    try {
      return await client.searchTags(query);
    } catch (err) {
      console.error('Error buscando tags:', err);
      return [];
    }
  }, [client]);

  const cargarTagsPopulares = useCallback(async (limite = 10): Promise<{ tag: string; count: number }[]> => {
    try {
      return await client.getPopularTags(limite);
    } catch (err) {
      console.error('Error cargando tags populares:', err);
      return [];
    }
  }, [client]);

  return {
    posts,
    postActual,
    total,
    pagina,
    totalPaginas,
    cargando,
    error,
    filtros,
    cargarPosts,
    cambiarPagina,
    cambiarOrden,
    cargarPost,
    cargarPostsRecientes,
    cargarPostsPopulares,
    cargarPostsTendencia,
    crearPost,
    actualizarPost,
    publicarPost,
    despublicarPost,
    eliminarPost,
    limpiarError,
    registrarVista,
    // Métodos de etiquetas
    cargarTags,
    buscarPorTag,
    buscarTags,
    cargarTagsPopulares,
  };
}


