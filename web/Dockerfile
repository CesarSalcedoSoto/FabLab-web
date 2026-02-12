# Dockerfile - Next.js Web App (Payload embebido)

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
# Instalar dependencias del sistema necesarias para compilar módulos nativos
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Instalar dependencias incluyendo las opcionales y reconstruir sharp para linux-x64
RUN npm ci --include=optional && \
    npm rebuild sharp --platform=linux --arch=x64 && \
    npm rebuild lightningcss --platform=linux --arch=x64

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumentos de construcción para Next.js (Client-side vars burn-in)
ARG NEXT_PUBLIC_STRAPI_URL
ARG NEXT_PUBLIC_VESSEL_API_URL
ARG NEXT_PUBLIC_LARAVEL_URL
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# Mapear ARGs a ENVs para el build
ENV NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL
ENV NEXT_PUBLIC_VESSEL_API_URL=$NEXT_PUBLIC_VESSEL_API_URL
ENV NEXT_PUBLIC_LARAVEL_URL=$NEXT_PUBLIC_LARAVEL_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

RUN npm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
USER nextjs
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
CMD ["node", "server.js"]
