/**
 * Vessel API - Cliente Base
 * 
 * Cliente HTTP base para comunicarse con Vessel API.
 * Proporciona métodos comunes para GET, POST, PUT, DELETE.
 */

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
}

// Helper para obtener URL del backend si existe
async function getServerUrlFallback(): Promise<string | undefined> {
  if (typeof window === 'undefined') {
    try {
      const { getServerVesselUrl } = await import('./token.helper');
      const dbUrl = await getServerVesselUrl();
      if (dbUrl) return dbUrl;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export class VesselBaseClient {
  protected _paramsBaseUrl?: string;

  constructor(baseUrl?: string) {
    this._paramsBaseUrl = baseUrl;
  }

  protected async getBaseUrl(): Promise<string> {
    if (this._paramsBaseUrl) return this._paramsBaseUrl;

    // 1. Try DB (Server-side)
    const dbUrl = await getServerUrlFallback();
    if (dbUrl) return dbUrl.replace(/\/$/, '');

    // 2. Fallback to Env/Global
    return getVesselBaseUrl().replace(/\/$/, '');
  }

  // ============================================================
  // HTTP METHODS
  // ============================================================

  protected async get<T>(path: string, options?: RequestOptions): Promise<T> {
    try {
      const baseUrl = await this.getBaseUrl();
      
      // Validar que la URL base sea válida
      if (!baseUrl || baseUrl === 'undefined' || baseUrl === 'null') {
        throw new VesselApiError(0, 'URL de API no configurada. Verifica NEXT_PUBLIC_VESSEL_API_URL');
      }

      const url = this.buildUrl(baseUrl, path, options?.params);
      
      // Log solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`[VesselClient] GET ${url}`);
      }

      const headers = await this.getHeaders();
      
      // Validar headers
      if (!headers || typeof headers !== 'object') {
        throw new VesselApiError(0, 'Headers inválidos');
      }

      const res = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      return this.handleResponse<T>(res);
    } catch (error) {
      // Si ya es un VesselApiError, re-lanzar
      if (error instanceof VesselApiError) {
        throw error;
      }
      
      // Manejar errores de red (Failed to fetch)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('[VesselClient] Error de conexión:', error.message);
        throw new VesselApiError(0, `No se pudo conectar con el servidor de inventario. Verifica que el servicio esté activo.`);
      }
      
      // Otros errores
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[VesselClient] Error en GET:', errorMessage);
      throw new VesselApiError(0, errorMessage);
    }
  }

  protected async post<T>(path: string, body?: unknown): Promise<T> {
    try {
      const baseUrl = await this.getBaseUrl();
      
      if (!baseUrl || baseUrl === 'undefined' || baseUrl === 'null') {
        throw new VesselApiError(0, 'URL de API no configurada. Verifica NEXT_PUBLIC_VESSEL_API_URL');
      }

      const url = this.buildUrl(baseUrl, path);
      const headers = await this.getHeaders();
      
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      return this.handleResponse<T>(res);
    } catch (error) {
      if (error instanceof VesselApiError) throw error;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VesselApiError(0, 'No se pudo conectar con el servidor de inventario.');
      }
      
      throw new VesselApiError(0, error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  protected async put<T>(path: string, body?: unknown): Promise<T> {
    try {
      const baseUrl = await this.getBaseUrl();
      
      if (!baseUrl || baseUrl === 'undefined' || baseUrl === 'null') {
        throw new VesselApiError(0, 'URL de API no configurada. Verifica NEXT_PUBLIC_VESSEL_API_URL');
      }

      const url = this.buildUrl(baseUrl, path);
      const headers = await this.getHeaders();
      
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      return this.handleResponse<T>(res);
    } catch (error) {
      if (error instanceof VesselApiError) throw error;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VesselApiError(0, 'No se pudo conectar con el servidor de inventario.');
      }
      
      throw new VesselApiError(0, error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  protected async delete<T = void>(path: string): Promise<T> {
    try {
      const baseUrl = await this.getBaseUrl();
      
      if (!baseUrl || baseUrl === 'undefined' || baseUrl === 'null') {
        throw new VesselApiError(0, 'URL de API no configurada. Verifica NEXT_PUBLIC_VESSEL_API_URL');
      }

      const url = this.buildUrl(baseUrl, path);
      const headers = await this.getHeaders();
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      
      return this.handleResponse<T>(res);
    } catch (error) {
      if (error instanceof VesselApiError) throw error;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new VesselApiError(0, 'No se pudo conectar con el servidor de inventario.');
      }
      
      throw new VesselApiError(0, error instanceof Error ? error.message : 'Error desconocido');
    }
  }

  // ============================================================
  // HELPERS (protected para permitir override)
  // ============================================================

  protected async getHeaders(): Promise<HeadersInit> {
    // 1. Try environment variable first
    let token = process.env.VESSEL_ACCESS_PRIVATE;

    // 2. Fallback to Database Store (System Configuration)
    if (!token) {
      try {
        const { getServerVesselToken } = await import('./token.helper');
        token = (await getServerVesselToken()) || undefined;
      } catch (e) {
        // Ignored: client-side or error
      }
    }

    // 3. Fallback to hardcoded dev token (last resort)
    if (!token) {
      token = 'cFeSlpiSyAviOK7jk8FLbr3LBph5ypMOOcE5Xfhm';
    }

    return {
      'Content-Type': 'application/json',
      'VESSEL-ACCESS-PRIVATE': token,
    };
  }

  protected buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = `${baseUrl}${path}`;

    if (!params) return url;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  protected async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let errorMessage = 'Error desconocido';
      let errorData: any = null;

      try {
        const text = await res.text();

        // Intentar parsear como JSON
        try {
          errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || text;
        } catch {
          errorMessage = text;
        }

        // LOG COMPLETO EN CONSOLA (para debug)
        console.error('[VesselBaseClient] Error API:', {
          status: res.status,
          url: res.url,
          error: errorMessage,
          details: errorData,
          raw: text
        });

      } catch (e) {
        console.error('[VesselBaseClient] Error leyendo respuesta de error:', e);
      }

      throw new VesselApiError(res.status, errorMessage);
    }

    // Para DELETE sin body
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T;
    }

    return res.json();
  }
}

// ============================================================
// ERROR CLASS
// ============================================================

export class VesselApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(`Error ${statusCode}: ${message}`);
    this.name = 'VesselApiError';
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

// ============================================================
// TYPES
// ============================================================

export interface ApiListResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
    total_pages?: number;
    last_page?: number;
  };
}

/** Extrae data de una respuesta que puede ser array o {data: []} */
export function extractData<T>(response: ApiListResponse<T> | T[]): T[] {
  return Array.isArray(response) ? response : (response.data || []);
}

/** Extrae meta de una respuesta */
export function extractMeta(response: ApiListResponse<unknown> | unknown[]): ApiListResponse<unknown>['meta'] {
  return Array.isArray(response) ? undefined : response.meta;
}

// ============================================================
// CONFIG
// ============================================================

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_VESSEL_API_URL || 'http://127.0.0.1:10999';

let _globalBaseUrl = DEFAULT_BASE_URL;

export function setVesselBaseUrl(url: string): void {
  _globalBaseUrl = url;
}

export function getVesselBaseUrl(): string {
  return _globalBaseUrl;
}
