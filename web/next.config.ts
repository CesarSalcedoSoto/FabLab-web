import type { NextConfig } from "next";
import { withPayload } from '@payloadcms/next/withPayload';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // Output standalone solo para producción (Docker)
  ...(isDev ? {} : { output: 'standalone' }),

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
      bodySizeLimit: '150mb',
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
        pathname: "/api/payload/media/**",
      },
      {
        // Payload CMS Media - servidor IP (HTTP, cualquier puerto)
        protocol: "http",
        hostname: "195.35.42.214",
        pathname: "/**",
      },
      {
        // Payload CMS Media - dominio principal (HTTPS)
        protocol: "https",
        hostname: "fablablosangeles.com",
        pathname: "/**",
      },
      {
        // Payload CMS Media - dominio www (HTTPS)
        protocol: "https",
        hostname: "www.fablablosangeles.com",
        pathname: "/**",
      },
      {
        // Producción genérica
        protocol: "https",
        hostname: "**.tudominio.com",
        pathname: "/**",
      },
    ],
  },
};

export default withPayload(nextConfig);

