# FabLab Web

Plataforma web con CMS integrado para FabLab, construida con Next.js y Payload CMS, usando PostgreSQL y Nginx en produccion.

## Stack actual

- Next.js 15 (App Router)
- Payload CMS 3 (admin y API embebidos)
- PostgreSQL 16
- Nginx (proxy y cache en produccion)
- Docker Compose para despliegue

## Rutas principales

- Sitio web: `http://localhost:3000`
- Admin CMS (Payload): `http://localhost:3000/cms`
- API CMS: `http://localhost:3000/api/payload`

## Desarrollo local (sin Docker)

1. Levanta PostgreSQL (opcional con Docker):
```
docker compose -f docker/docker-compose.postgres.yml up -d
```
2. Crea `web/.env.local` con:
```
DATABASE_URL=postgres://fablab:fablab_secret_2024@localhost:5432/fablab_blog
PAYLOAD_SECRET=CAMBIA_ESTE_SECRETO
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_VESSEL_API_URL=
```
3. Arranca la web:
```
cd web
npm install
npm run dev
```

## Produccion (Hostinger VPS)

1. En el VPS:
```
cd docker
cp .env.example .env
```
2. Edita `.env` con tus valores reales.
3. Levanta todo:
```
docker compose up -d --build
```
4. Actualizar:
```
./deploy.sh
```

## SSL

Coloca los certificados en `docker/nginx/ssl` y habilita las lineas SSL en `docker/nginx/nginx.conf`.