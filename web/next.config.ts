import type { NextConfig } from "next";
import { withPayload } from '@payloadcms/next/withPayload';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // No standalone: usamos npm run start directamente en Docker
  // standalone genera un server.js minimal que no es compatible con Payload CMS

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuración experimental
  experimental: {
    reactCompiler: false,
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Optimizaciones de desarrollo
  ...(isDev ? {
    // Reducir logs de webpack
    logging: {
      fetches: {
        fullUrl: false,
      },
    },
  } : {}),

  images: {
    // Servir imágenes en formatos modernos (WebP/AVIF) automáticamente
    formats: ['image/avif', 'image/webp'],
    // Cache de imágenes optimizadas: 30 días
    minimumCacheTTL: 2592000,
    // Tamaños responsive para srcset automático
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Payload CMS Media - localhost development
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/payload/media/**",
      },
      {
        // Payload CMS Media - localhost /media
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/media/**",
      },
      {
        // Producción
        protocol: "https",
        hostname: "**.tudominio.com",
        pathname: "/**",
      },
    ],
  },
};

export default withPayload(nextConfig);

