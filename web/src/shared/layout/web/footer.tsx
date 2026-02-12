"use client";

import Link from "next/link";
import { Button } from "@/shared/ui/buttons/button";
import { Separator } from "@/shared/ui/sections/separator";
import { BodyText } from "@/shared/ui/texts/text";
import {
  Cpu,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink
} from "lucide-react";

const quickLinks = [
  { href: "/proyectos", label: "Proyectos" },
  { href: "/tecnologias", label: "Tecnologías" },
  { href: "/equipo", label: "Equipo" },
  { href: "/blog", label: "Blog" },
];

const technologies = [
  { href: "/tecnologias/impresion-3d", label: "Impresión 3D" },
  { href: "/tecnologias/diseno-cad", label: "Diseño CAD" },
  { href: "/tecnologias/electronica", label: "Electrónica" },
  { href: "/tecnologias/cnc", label: "CNC" },
];


export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">FabLab INACAP</h3>
                <p className="text-sm text-gray-400">Los Ángeles</p>
              </div>
            </div>

            <BodyText className="max-w-sm text-gray-400">
              Impulsando la innovación a través de la fabricación digital,
              prototipado rápido y tecnologías emergentes.
            </BodyText>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white hover:border-orange-500 hover:bg-orange-500/10" asChild>
                <Link href="https://instagram.com/inacap" target="_blank">
                  <Instagram className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white hover:border-orange-500 hover:bg-orange-500/10" asChild>
                <Link href="https://linkedin.com/school/inacap" target="_blank">
                  <Linkedin className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white hover:border-orange-500 hover:bg-orange-500/10" asChild>
                <Link href="https://youtube.com/@inacap" target="_blank">
                  <Youtube className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Technologies */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Tecnologías</h4>
            <ul className="space-y-3">
              {technologies.map((tech) => (
                <li key={tech.href}>
                  <Link
                    href={tech.href}
                    className="text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    {tech.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Contacto</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-400">
                  Av. Ricardo Vicuña 825<br />
                  Los Ángeles, Región del Biobío<br />
                  Chile
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <Link
                  href="mailto:fablab.losangeles@inacap.cl"
                  className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                >
                  fablab.losangeles@inacap.cl
                </Link>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <Link
                  href="tel:+56432524800"
                  className="text-sm text-gray-400 hover:text-orange-400 transition-colors"
                >
                  +56 43 252 4800
                </Link>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              asChild
            >
              <Link href="/contacto">
                Contáctanos
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        <Separator className="mb-8 bg-gray-800" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="text-sm text-gray-500">
              © 2025 FabLab INACAP Los Ángeles. Todos los derechos reservados.
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <span>Desarrollado por César Salcedo Soto</span>
              <span className="text-gray-700">•</span>
              <span>Versión 1.3</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/privacidad" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
              Términos
            </Link>
            <Link href="/cookies" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
