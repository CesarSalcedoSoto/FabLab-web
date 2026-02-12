/**
 * API para crear el usuario administrador inicial
 * POST /api/seed-admin
 * 
 * Solo funciona si no hay usuarios en la base de datos
 * 
 * Body (opcional):
 *   { "email": "...", "password": "...", "name": "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';

const DEFAULT_EMAIL = process.env.ADMIN_EMAIL || 'admin@fablab.com';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'Fablab2026';
const DEFAULT_NAME = process.env.ADMIN_NAME || 'Administrador';

export async function POST(request: NextRequest) {
    try {
        // Leer body si existe
        let body: { email?: string; password?: string; name?: string } = {};
        try {
            body = await request.json();
        } catch {
            // Body vacío, usar defaults
        }

        const email = body.email || DEFAULT_EMAIL;
        const password = body.password || DEFAULT_PASSWORD;
        const name = body.name || DEFAULT_NAME;

        const payload = await getPayload({ config: configPromise });

        // Verificar si ya existe un usuario
        const existingUsers = await payload.find({
            collection: 'users',
            limit: 1,
        });

        if (existingUsers.docs.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Ya existe al menos un usuario. Seed cancelado.',
                existingUser: existingUsers.docs[0].email,
            }, { status: 400 });
        }

        // Crear usuario administrador
        const admin = await payload.create({
            collection: 'users',
            data: {
                email,
                password,
                name,
                role: 'admin',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Usuario administrador creado exitosamente',
            user: {
                email,
                name,
            },
            note: 'Cambia la contraseña después del primer login',
        });

    } catch (error) {
        console.error('Error en seed:', error);
        return NextResponse.json({
            success: false,
            message: 'Error creando usuario',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Usa POST para crear el usuario administrador inicial',
        endpoint: '/api/seed-admin',
        method: 'POST',
    });
}
