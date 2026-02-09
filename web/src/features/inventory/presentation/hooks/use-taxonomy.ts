"use client";

import { useState, useCallback, useMemo } from 'react';
import type { Vocabulario, Termino, ArbolTermino, Breadcrumb, FiltrosTerminos } from '../../domain/entities/taxonomy';
import { TaxonomyClient } from '../../infrastructure/vessel/taxonomy.client';
import { useToast } from '@/shared/ui/feedback/toast-provider';

/** Estado del hook */
interface UseTaxonomyState {
  vocabularios: Vocabulario[];
  terminos: Termino[];
  arbol: ArbolTermino[];
  breadcrumbs: Breadcrumb[];
  cargando: boolean;
  error: string | null;
}

/** Acciones del hook */
interface UseTaxonomyActions {
  cargarVocabularios: () => Promise<void>;
  cargarTerminos: (filtros?: FiltrosTerminos) => Promise<void>;
  cargarArbol: (vocabularioId?: string) => Promise<void>;
  cargarBreadcrumb: (terminoId: string) => Promise<void>;
  crearVocabulario: (data: Omit<Vocabulario, 'id'>) => Promise<Vocabulario>;
  crearTermino: (data: Partial<Termino>) => Promise<Termino>;
  actualizarVocabulario: (id: string, data: Partial<Vocabulario>) => Promise<Vocabulario>;
  actualizarTermino: (id: string, data: Partial<Termino>) => Promise<Termino>;
  eliminarVocabulario: (id: string) => Promise<void>;
  eliminarTermino: (id: string) => Promise<void>;
  obtenerVocabularioPorSlug: (slug: string) => Promise<Vocabulario | null>;
  obtenerOCrearVocabulario: (slug: string, nombre: string) => Promise<Vocabulario>;
  limpiarError: () => void;
}

export type UseTaxonomyResult = UseTaxonomyState & UseTaxonomyActions;

/** Hook para gestionar taxonomías */
export function useTaxonomy(): UseTaxonomyResult {
  const [vocabularios, setVocabularios] = useState<Vocabulario[]>([]);
  const [terminos, setTerminos] = useState<Termino[]>([]);
  const [arbol, setArbol] = useState<ArbolTermino[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { error: showError } = useToast();

  // Cliente real de Vessel API (sin adapter = usa BD real)
  // Nota: asegúrate de que NEXT_PUBLIC_VESSEL_API_URL esté definido o usa fallback
  const client = useMemo(() => new TaxonomyClient(
    process.env.NEXT_PUBLIC_VESSEL_API_URL || 'http://127.0.0.1:8000',
    'sql',
  ), []);

  const cargarVocabularios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await client.listarVocabularios();
      setVocabularios(response.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar vocabularios';
      setError(msg);
      showError(msg, 'Error de conexión');
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const cargarTerminos = useCallback(async (filtros?: FiltrosTerminos) => {
    setCargando(true);
    setError(null);
    try {
      const response = await client.listarTerminos(filtros);
      setTerminos(response.data);
    } catch (err: any) {
      // Detectar si es error de conexión (Failed to fetch)
      const isNetworkError = 
        err?.statusCode === 0 ||
        err?.message?.includes('conectar') ||
        err?.message?.includes('fetch') ||
        (err instanceof TypeError && err.message.includes('fetch'));

      // Detectar si es error de vocabulario no encontrado
      const errorCode = err?.code || err?.response?.data?.code;
      const statusCode = err?.statusCode || err?.response?.status || (err?.message?.includes('422') ? 422 : null);
      const errorMessage = err?.message?.toLowerCase() || '';

      const esVocabularioNoEncontrado =
        errorCode === 'VOCABULARY_NOT_FOUND' ||
        errorMessage.includes('vocabulary not found') ||
        (statusCode === 422 && errorMessage.includes('vocabulary'));

      // Solo mostrar error si no es un error de vocabulario no encontrado
      if (!esVocabularioNoEncontrado) {
        const msg = isNetworkError 
          ? 'No se pudo conectar con el servidor de inventario'
          : (err instanceof Error ? err.message : 'Error al cargar términos');
        setError(msg);
        
        // Solo mostrar toast para errores importantes
        if (!isNetworkError) {
          showError(msg, 'Error en términos');
        }
      }

      // Devolver array vacío en caso de error de red para evitar propagación
      if (isNetworkError) {
        setTerminos([]);
        return;
      }

      // Re-lanzar con info adicional para que el componente pueda manejarlo
      if (esVocabularioNoEncontrado) {
        err.isVocabularyNotFound = true;
      }
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const cargarArbol = useCallback(async (vocabularioId?: string) => {
    setCargando(true);
    setError(null);
    try {
      if (!vocabularioId) {
        setArbol([]);
        return;
      }
      const data = await client.obtenerArbol(vocabularioId);
      setArbol(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar árbol';
      setError(msg);
      showError(msg, 'Error en árbol');
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const cargarBreadcrumb = useCallback(async (terminoId: string) => {
    setCargando(true);
    setError(null);
    try {
      const data = await client.obtenerBreadcrumb(terminoId);
      setBreadcrumbs(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar breadcrumb';
      setError(msg);
      showError(msg);
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const crearVocabulario = useCallback(async (data: Omit<Vocabulario, 'id'>): Promise<Vocabulario> => {
    setCargando(true);
    setError(null);
    try {
      const nuevo = await client.crearVocabulario(data);
      // No modificamos el array local - el componente debe refetch si necesita
      return nuevo;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Error al crear vocabulario';

      // Detectar errores de duplicado - no mostrar toast para estos
      const esDuplicado =
        err?.code === 'DUPLICATE_VOCABULARY' ||
        msg.toLowerCase().includes('duplicate') ||
        msg.toLowerCase().includes('already exists');

      if (!esDuplicado) {
        setError(msg);
        showError(msg, 'Error creación');
      }
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const crearTermino = useCallback(async (data: Partial<Termino>): Promise<Termino> => {
    setCargando(true);
    setError(null);
    try {
      // Asumimos que el componente pasa los campos requeridos
      const nuevo = await client.crearTermino(data as Omit<Termino, 'id'>);
      // No modificamos el array local - el componente debe refetch
      return nuevo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear término';
      setError(msg);
      showError(msg, 'Error creación');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const actualizarVocabulario = useCallback(async (id: string, data: Partial<Vocabulario>) => {
    setCargando(true);
    setError(null);
    try {
      const actualizado = await client.actualizarVocabulario(id, data);
      // No modificamos el array local - el componente debe refetch
      return actualizado;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar vocabulario';
      setError(msg);
      showError(msg, 'Error actualización');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const actualizarTermino = useCallback(async (id: string, data: Partial<Termino>) => {
    setCargando(true);
    setError(null);
    try {
      const actualizado = await client.actualizarTermino(id, data);
      // No modificamos el array local - el componente debe refetch
      return actualizado;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar término';
      setError(msg);
      showError(msg, 'Error actualización');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const eliminarVocabulario = useCallback(async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      await client.eliminarVocabulario(id);
      // No modificamos el array local - el componente debe refetch
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar vocabulario';
      setError(msg);
      showError(msg, 'Error eliminación');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const eliminarTermino = useCallback(async (id: string) => {
    setCargando(true);
    setError(null);
    try {
      await client.eliminarTermino(id);
      // No modificamos el array local - el componente debe refetch
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar término';
      setError(msg);
      showError(msg, 'Error eliminación');
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const obtenerVocabularioPorSlug = useCallback(async (slug: string): Promise<Vocabulario | null> => {
    setCargando(true);
    try {
      const vocab = await client.obtenerVocabularioPorSlug(slug);
      return vocab;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener vocabulario por slug';
      setError(msg);
      return null;
    } finally {
      setCargando(false);
    }
  }, [client]);

  const obtenerOCrearVocabulario = useCallback(async (slug: string, nombre: string) => {
    setCargando(true);
    try {
      // Primero intentar obtener por slug
      const existente = await client.obtenerVocabularioPorSlug(slug);
      if (existente) {
        return existente;
      }

      // Si no existe, crear con nombre y slug
      const nuevo = await client.crearVocabulario({ nombre, slug });
      return nuevo;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener/crear vocabulario ' + nombre;
      setError(msg);
      showError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  }, [client, showError]);

  const limpiarError = useCallback(() => setError(null), []);

  return {
    vocabularios,
    terminos,
    arbol,
    breadcrumbs,
    cargando,
    error,
    cargarVocabularios,
    cargarTerminos,
    cargarArbol,
    cargarBreadcrumb,
    crearVocabulario,
    crearTermino,
    actualizarVocabulario,
    actualizarTermino,
    eliminarVocabulario,
    eliminarTermino,
    obtenerVocabularioPorSlug,
    obtenerOCrearVocabulario,
    limpiarError,
  };
}
