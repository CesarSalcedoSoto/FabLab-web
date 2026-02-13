import type { Metadata, Viewport } from 'next';
import '@/shared/theme/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL("https://fablab-inacap.vercel.app"),
  title: "FabLab INACAP - Laboratorio de Fabricación Digital",
  description: "Explora el futuro de la manufactura digital con tecnologías de impresión 3D, diseño paramétrico y prototipado rápido en nuestro laboratorio de vanguardia.",
  keywords: ["FabLab", "INACAP", "Impresión 3D", "Fabricación Digital", "Prototipado", "Innovación Tecnológica"],
  authors: [{ name: "FabLab INACAP" }],
  creator: "FabLab INACAP",
  icons: {
    icon: "/images/logos/fablab-logo.png",
    shortcut: "/images/logos/fablab-logo.png",
    apple: "/images/logos/fablab-logo.png",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://fablab-inacap.vercel.app",
    siteName: "FabLab INACAP",
    title: "FabLab INACAP - Laboratorio de Fabricación Digital",
    description: "Explora el futuro de la manufactura digital con tecnologías de impresión 3D, diseño paramétrico y prototipado rápido.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FabLab INACAP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FabLab INACAP - Laboratorio de Fabricación Digital",
    description: "Explora el futuro de la manufactura digital con tecnologías de impresión 3D, diseño paramétrico y prototipado rápido.",
    images: ["/og-image.jpg"],
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
