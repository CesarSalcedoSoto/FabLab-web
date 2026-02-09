# Dockerfile - Next.js + Payload CMS
# Build: docker build -t fablab-web .
# Run:   docker run -p 3000:3000 --env-file .env fablab-web
# Nota: Usamos node:20-slim (Debian) en vez de Alpine porque
#       Tailwind v4 (oxide), lightningcss y sharp requieren
#       binarios nativos glibc que no existen para musl/Alpine.

# ========================
# Stage 1: Dependencies (solo producción)
# ========================
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
# Forzar binarios nativos Linux para producción
RUN npm install --os=linux --cpu=x64 sharp

# ========================
# Stage 2: Build
# ========================
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Forzar binarios nativos Linux (el lockfile de Windows no los incluye)
RUN npm install --os=linux --cpu=x64 sharp @tailwindcss/oxide-linux-x64-gnu lightningcss-linux-x64-gnu
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Argumentos de build (NEXT_PUBLIC_* se queman en el bundle del cliente)
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_VESSEL_API_URL

ENV DATABASE_URL=$DATABASE_URL
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET:-fablab-payload-secret-build}
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_VESSEL_API_URL=$NEXT_PUBLIC_VESSEL_API_URL

RUN npm run build

# ========================
# Stage 3: Production Runner (npm run start)
# ========================
FROM node:20-slim AS runner
WORKDIR /app

# Dependencias de producción
COPY --from=deps /app/node_modules ./node_modules

# Package.json (necesario para npm run start)
COPY --from=builder /app/package.json ./

# Build output de Next.js
COPY --from=builder /app/.next ./.next

# Archivos públicos
COPY --from=builder /app/public ./public

# Payload CMS: config, colecciones, migraciones, importMap
COPY --from=builder /app/payload.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/app ./app

# Next.js config (necesario para runtime)
COPY --from=builder /app/next.config.ts ./

# Directorio para uploads de media (writable)
RUN mkdir -p /app/media

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000
CMD ["npm", "run", "start"]
