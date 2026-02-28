/**
 * Payload CMS Configuration
 * 
 * Configuración de Payload CMS 3.0 embebido en Next.js.
 * Las colecciones y globals se importan desde @/features/cms
 * 
 * @see src/features/cms/README.md para documentación
 */

import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Importar colecciones y globals desde feature CMS centralizada
import { collections, globals, Users } from './src/features/cms/infrastructure/payload/index.ts';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// URL de conexión a PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://fablab:fablab_secret_2024@localhost:9012/fablab_blog';
const PAYLOAD_SERVER_URL =
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    process.env.SERVER_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL;

export default buildConfig({
    admin: {
        user: Users.slug,
        meta: {
            title: 'FabLab CMS',
            description: 'Sistema de gestión de contenidos del FabLab INACAP Los Ángeles',
        },
    },

    // Desactivar bloqueo de documentos (la tabla está desincronizada)
    lockDocuments: false,

    // Colecciones y globals centralizadas
    collections,
    globals,

    // JWT Secret
    secret: process.env.PAYLOAD_SECRET || 'fablab-payload-secret-dev',

    // TypeScript output
    typescript: {
        outputFile: path.resolve(dirname, 'src/features/cms/infrastructure/payload/types.ts'),
    },

    // PostgreSQL
    db: postgresAdapter({
    pool: {
        connectionString: DATABASE_URL,
    },
    push: true,  // Cambiar a true para que cree las tablas automáticamente
}),

    // Editor Lexical
    editor: lexicalEditor({}),

    // Sharp para imágenes
    sharp,

    // NO configurar serverURL para que las URLs de media sean siempre relativas.
    // Esto evita problemas con proxies, dominios y mixed content.
    // serverURL: PAYLOAD_SERVER_URL,

    // GraphQL
    graphQL: {
        schemaOutputFile: path.resolve(dirname, 'src/features/cms/infrastructure/payload/schema.graphql'),
    },

    // Rutas
    routes: {
        admin: '/cms',
        api: '/api/payload',
    },

    // Upload
    upload: {
        limits: {
            fileSize: 10000000, // 10MB
        },
    },
});
