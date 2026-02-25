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
        pathname: "/media/**",
      },
      {
        // Payload CMS Media - servidor de producción
        protocol: "http",
        hostname: "195.35.42.214",
        port: "9011",
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

