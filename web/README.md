# FabLab Web (Next.js + Payload)

Sitio web y CMS integrados para FabLab, construido con Next.js y Payload CMS.

## Stack

- Next.js 15 + React 19
- Payload CMS 3 (admin en `/cms`)
- PostgreSQL (via `@payloadcms/db-postgres`)
- Tailwind CSS v4 y Radix UI
- Three.js / React Three Fiber
- Framer Motion

## Estructura del proyecto

```
app/                       # Rutas (web, admin, api)
src/
	features/                # Modulos por dominio
	shared/                  # UI, hooks, utils, types
prisma/                    # Esquema y migraciones
public/                    # Archivos estaticos
media/                     # Uploads de Payload
```

## Desarrollo local

1. Crea `web/.env.local` con:
```
DATABASE_URL=postgres://fablab:fablab_secret_2024@localhost:5432/fablab_blog
PAYLOAD_SECRET=CAMBIA_ESTE_SECRETO
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_VESSEL_API_URL=
```
2. Instala dependencias y ejecuta:
```
npm install
npm run dev
```

## Comandos utiles

```
npm run build
npm run start
npm run lint
npm run payload:migrate
npm run payload:generate
```

## Accesos

- Web: `http://localhost:3000`
- Admin CMS: `http://localhost:3000/cms`
- API CMS: `http://localhost:3000/api/payload`

## Imagenes

Payload genera variantes WebP y Next.js entrega AVIF/WebP cuando es posible.

