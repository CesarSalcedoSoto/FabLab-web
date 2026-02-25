/**
 * PayloadAuthRepository - Implementación para Payload CMS
 * 
 * Usa la API de autenticación de Payload CMS embebida en la aplicación
 */
import type { IAuthRepository } from '../../domain/interfaces/auth-repository';
import type { Credentials, Session } from '../../domain/entities/session';
import type { User } from '../../domain/entities/user';
import { getRole } from '../../domain/entities/role';
import { AuthError } from '../../domain/errors/auth-error';
import { TokenStorage } from '../storage/token-storage';

// Payload CMS API URL (misma aplicación)
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_SERVER_URL || '';
};

interface PayloadUser {
    id: number;
    email: string;
    name: string;
    role?: 'admin' | 'editor' | 'author';
    avatar?: { url?: string };
    bio?: string;
    createdAt: string;
    updatedAt: string;
}

interface PayloadLoginResponse {
    user: PayloadUser;
    token: string;
    exp: number;
}

interface PayloadMeResponse {
    user: PayloadUser | null;
}

/**
 * Mapear rol de Payload a rol interno
 */
function mapPayloadRole(payloadRole?: string): string {
    switch (payloadRole) {
        case 'admin':
            return 'Admin';
        case 'editor':
            return 'Editor';
        case 'author':
            return 'Autor';
        default:
            return 'Authenticated';
    }
}

/**
 * Mapear usuario de Payload a formato interno
 */
function mapPayloadUser(payloadUser: PayloadUser): User {
    return {
        id: String(payloadUser.id),
        email: payloadUser.email,
        name: payloadUser.name || payloadUser.email.split('@')[0],
        avatar: payloadUser.avatar?.url,
        role: getRole(mapPayloadRole(payloadUser.role)),
        isActive: true,
        createdAt: new Date(payloadUser.createdAt),
    };
}

export class PayloadAuthRepository implements IAuthRepository {
    private get apiUrl() {
        return `${getBaseUrl()}/api/payload/users`;
    }

    async login(credentials: Credentials): Promise<Session> {
        const response = await fetch(`${this.apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Importante para cookies de Payload
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            const message = error?.errors?.[0]?.message || error?.message || 'Credenciales inválidas';
            throw new AuthError(message, 'INVALID_CREDENTIALS');
        }

        const data: PayloadLoginResponse = await response.json();

        // Payload usa cookies httpOnly por defecto, pero también devuelve token
        if (data.token) {
            TokenStorage.setToken(data.token);
        }

        const user = mapPayloadUser(data.user);
        return {
            user,
            token: data.token || 'cookie-auth',
            expiresAt: data.exp ? new Date(data.exp * 1000) : undefined,
        };
    }

    async logout(): Promise<void> {
        try {
            await fetch(`${this.apiUrl}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            // Ignorar errores de logout
            console.warn('Error al cerrar sesión en Payload:', error);
        }
        TokenStorage.clearToken();
    }

    async getSession(): Promise<Session | null> {
        const token = TokenStorage.getToken();

        try {
            const response = await fetch(`${this.apiUrl}/me`, {
                method: 'GET',
                credentials: 'include',
                headers: token ? { 'Authorization': `JWT ${token}` } : {},
            });

            if (!response.ok) {
                TokenStorage.clearToken();
                return null;
            }

            const data: PayloadMeResponse = await response.json();

            if (!data.user) {
                TokenStorage.clearToken();
                return null;
            }

            const user = mapPayloadUser(data.user);
            return { user, token: token || 'cookie-auth' };
        } catch (error) {
            // Error de red o servidor
            console.warn('Error al obtener sesión de Payload:', error);
            return null;
        }
    }

    async refreshSession(): Promise<Session> {
        try {
            const response = await fetch(`${this.apiUrl}/refresh-token`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new AuthError('Sesión expirada', 'SESSION_EXPIRED');
            }

            const data = await response.json();

            if (data.refreshedToken) {
                TokenStorage.setToken(data.refreshedToken);
            }

            // Obtener datos actualizados del usuario
            const session = await this.getSession();
            if (!session) {
                throw new AuthError('Sesión expirada', 'SESSION_EXPIRED');
            }

            return session;
        } catch (error) {
            TokenStorage.clearToken();
            throw new AuthError('Sesión expirada', 'SESSION_EXPIRED');
        }
    }
}
