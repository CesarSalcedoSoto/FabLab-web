/**
 * Payload CMS REST API Route Handler
 * 
 * Este archivo expone la API REST de Payload usando los handlers nativos.
 * Payload 3.0 proporciona handlers pre-construidos para Next.js.
 */

import { REST_GET, REST_POST, REST_DELETE, REST_PATCH } from '@payloadcms/next/routes';
import configPromise from '@payload-config';

// Allow file uploads up to 100MB
export const maxDuration = 120; // seconds
export const dynamic = 'force-dynamic';

export const GET = REST_GET(configPromise);
export const POST = REST_POST(configPromise);
export const DELETE = REST_DELETE(configPromise);
export const PATCH = REST_PATCH(configPromise);
