"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Users,
  Wrench,
  GraduationCap,
  Building,
  ChevronRight,
  CheckCircle,
  Loader2,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/shared/ui/buttons/button";
import { Input } from "@/shared/ui/inputs/input";
import { Textarea } from "@/shared/ui/inputs/textarea";
import { submitContactMessage } from "./contacto-actions";

// ============================================================================
// TYPES - Preparados para integración con Strapi
// ============================================================================

/**
 * Tipo para la información de contacto desde Strapi
 * Collection Type: api::contacto.contacto
 */
interface ContactInfo {
  id: string;
  direccion: string;
  ciudad: string;
  region: string;
  codigoPostal?: string;
  telefono: string;
  telefonoSecundario?: string;
  email: string;
  emailSoporte?: string;
  horarioSemana: string;
  horarioFinSemana?: string;
  googleMapsUrl?: string;
  googleMapsEmbed?: string;
}

/**
 * Tipo para las redes sociales desde Strapi
 * Component: contacto.redes-sociales
 */
interface RedSocial {
  id: string;
  nombre: string;
  url: string;
  icono: "facebook" | "instagram" | "linkedin" | "youtube" | "twitter";
  activo: boolean;
}

/**
 * Tipo para las opciones de motivo de contacto desde Strapi
 * Component: contacto.motivo-contacto
 */
interface MotivoContacto {
  id: string;
  titulo: string;
  descripcion: string;
  icono: "message" | "users" | "wrench" | "graduation" | "building";
  email?: string;
}

/**
 * Tipo para FAQs desde Strapi
 * Collection Type: api::faq.faq
 */
interface FAQ {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  orden: number;
}

/**
 * Tipo para el formulario de contacto
 */
interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  motivo: string;
  asunto: string;
  mensaje: string;
}

/**
 * Props del componente ContactoPage
 * Preparado para recibir datos de Strapi via getStaticProps o getServerSideProps
 */
interface ContactoPageProps {
  contactInfo?: ContactInfo;
  redesSociales?: RedSocial[];
  motivosContacto?: MotivoContacto[];
  faqs?: FAQ[];
}

// ============================================================================
// MOCK DATA - Reemplazar con datos de Strapi
// ============================================================================

const contactInfoMock: ContactInfo = {
  id: "1",
  direccion: "Av. Ricardo Vicuña 825",
  ciudad: "Los Ángeles",
  region: "Región del Biobío",
  codigoPostal: "4440000",
  telefono: "+56 43 252 4800",
  telefonoSecundario: "+56 9 8477 2350",
  email: "losangeles@inacap.cl",
  emailSoporte: "fablab.losangeles@inacap.cl",
  horarioSemana: "Lunes a Viernes: 08:30 - 18:30",
  horarioFinSemana: "Sábados: 09:00 - 14:00",
  googleMapsUrl: "https://www.google.com/maps/place/Inacap/@-37.47176,-72.358368,16z",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.8274!2d-72.3583679!3d-37.4717597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x966bdae5d1c0f1b5%3A0x18838193e8a2d3df!2sInacap!5e0!3m2!1ses!2scl!4v1701350000000",
};

const redesSocialesMock: RedSocial[] = [
  { id: "1", nombre: "Facebook", url: "https://facebook.com/inacap", icono: "facebook", activo: true },
  { id: "2", nombre: "Instagram", url: "https://instagram.com/inacap", icono: "instagram", activo: true },
  { id: "3", nombre: "LinkedIn", url: "https://linkedin.com/school/inacap", icono: "linkedin", activo: true },
  { id: "4", nombre: "YouTube", url: "https://youtube.com/@inacap", icono: "youtube", activo: true },
];

const motivosContactoMock: MotivoContacto[] = [
  {
    id: "1",
    titulo: "Consulta General",
    descripcion: "Información sobre servicios, horarios y membresías",
    icono: "message",
    email: "losangeles@inacap.cl",
  },
  {
    id: "2",
    titulo: "Reserva de Equipos",
    descripcion: "Agendar uso de máquinas y espacios de trabajo",
    icono: "wrench",
    email: "fablab.losangeles@inacap.cl",
  },
  {
    id: "3",
    titulo: "Capacitaciones",
    descripcion: "Cursos, talleres y certificaciones disponibles",
    icono: "graduation",
    email: "fablab.losangeles@inacap.cl",
  },
  {
    id: "4",
    titulo: "Proyectos Colaborativos",
    descripcion: "Propuestas de colaboración y alianzas",
    icono: "users",
    email: "bvalenzuelam@inacap.cl",
  },
  {
    id: "5",
    titulo: "Empresas e Instituciones",
    descripcion: "Servicios corporativos y convenios",
    icono: "building",
    email: "nvoncaprivi@inacap.cl",
  },
];

const faqsMock: FAQ[] = [
  {
    id: "1",
    pregunta: "¿Necesito ser estudiante de INACAP para usar el FabLab Los Ángeles?",
    respuesta: "No es necesario. El FabLab Los Ángeles está abierto a toda la comunidad de la provincia del Biobío: estudiantes, profesores, emprendedores, profesionales y entusiastas de la fabricación digital. Buscamos que todos puedan acceder de manera gratuita a nuestra tecnología.",
    categoria: "General",
    orden: 1,
  },
  {
    id: "2",
    pregunta: "¿Cuáles son los costos de usar los equipos?",
    respuesta: "El acceso a FabLab Los Ángeles es gratuito para estudiantes, académicos, empresas y emprendedores de la provincia del Biobío. Solo debes traer tus propios materiales o adquirirlos en el laboratorio a precio de costo.",
    categoria: "Membresías",
    orden: 2,
  },
  {
    id: "3",
    pregunta: "¿Necesito capacitación previa para usar las máquinas?",
    respuesta: "Sí, para la mayoría de los equipos es necesario completar una inducción de seguridad y uso. Ofrecemos capacitaciones gratuitas en diferentes niveles, desde básico hasta avanzado, impartidas por nuestro equipo técnico.",
    categoria: "Capacitaciones",
    orden: 3,
  },
  {
    id: "4",
    pregunta: "¿Puedo llevar mi propio material?",
    respuesta: "Sí, puedes traer tus propios materiales siempre que sean compatibles con los equipos y cumplan con nuestras normas de seguridad. También disponemos de materiales certificados en el laboratorio a precios accesibles.",
    categoria: "Materiales",
    orden: 4,
  },
  {
    id: "5",
    pregunta: "¿Cómo reservo un equipo o espacio de trabajo?",
    respuesta: "Las reservas se realizan directamente en el FabLab o contactándonos por correo electrónico. Te recomendamos reservar con anticipación, especialmente para equipos de alta demanda como impresoras 3D y cortadoras láser.",
    categoria: "Reservas",
    orden: 5,
  },
  {
    id: "6",
    pregunta: "¿Qué tipo de proyectos puedo desarrollar en FabLab?",
    respuesta: "Puedes desarrollar prototipos, proyectos de tesis, productos para emprendimientos, material didáctico, piezas de reemplazo, arte y diseño, entre otros. Nuestro equipo está disponible para asesorarte en el proceso de diseño y fabricación.",
    categoria: "General",
    orden: 6,
  },
];

// ============================================================================
// ICON MAPPING
// ============================================================================

const socialIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

const motivoIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  users: Users,
  wrench: Wrench,
  graduation: GraduationCap,
  building: Building,
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Hero Section
function HeroContacto() {
  return (
    <section className="relative min-h-[50vh] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-6"
          >
            <MessageSquare className="w-4 h-4" />
            Estamos aquí para ayudarte
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6">
            Ponte en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Contacto
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            ¿Tienes alguna pregunta, quieres reservar un equipo o proponer un proyecto? 
            El equipo de FabLab Los Ángeles está listo para ayudarte a hacer realidad tus ideas.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span>Respuesta en 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-500" />
              <span>Soporte dedicado</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span>Visítanos en persona</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Motivos de Contacto Section
interface MotivosContactoSectionProps {
  motivos: MotivoContacto[];
  onSelectMotivo: (motivo: string) => void;
  motivoSeleccionado: string;
}

function MotivosContactoSection({ motivos, onSelectMotivo, motivoSeleccionado }: MotivosContactoSectionProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
            ¿En qué podemos ayudarte?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Selecciona el motivo de tu consulta
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Esto nos ayuda a dirigir tu mensaje al equipo adecuado y darte una respuesta más rápida.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {motivos.map((motivo, index) => {
            const Icon = motivoIconMap[motivo.icono] || MessageSquare;
            const isSelected = motivoSeleccionado === motivo.titulo;
            
            return (
              <motion.button
                key={motivo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectMotivo(motivo.titulo)}
                className={`p-6 rounded-2xl text-left transition-all duration-300 border-2 ${
                  isSelected
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/20"
                    : "bg-white border-gray-100 hover:border-orange-300 hover:shadow-md"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isSelected ? "bg-white/20" : "bg-orange-100"
                }`}>
                  <Icon className={`w-6 h-6 ${isSelected ? "text-white" : "text-orange-600"}`} />
                </div>
                <h3 className={`font-semibold mb-1 ${isSelected ? "text-white" : "text-gray-900"}`}>
                  {motivo.titulo}
                </h3>
                <p className={`text-sm ${isSelected ? "text-orange-100" : "text-gray-500"}`}>
                  {motivo.descripcion}
                </p>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Contact Form
interface ContactFormProps {
  motivoSeleccionado: string;
  onSubmit: (data: ContactFormData) => Promise<void>;
  isSubmitting: boolean;
  submitSuccess: boolean;
}

function ContactForm({ motivoSeleccionado, onSubmit, isSubmitting, submitSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: "",
    email: "",
    telefono: "",
    motivo: motivoSeleccionado,
    asunto: "",
    mensaje: "",
  });

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, motivo: motivoSeleccionado }));
  }, [motivoSeleccionado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 md:p-12 shadow-xl text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Mensaje Enviado!</h3>
        <p className="text-gray-600 mb-6">
          Hemos recibido tu mensaje correctamente. Nuestro equipo te responderá 
          dentro de las próximas 24 horas hábiles.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
        >
          Enviar otro mensaje
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-8 md:p-12 shadow-xl"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Envíanos un mensaje</h3>
      <p className="text-gray-500 mb-8">Completa el formulario y te responderemos a la brevedad.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </label>
          <Input
            id="nombre"
            name="nombre"
            type="text"
            required
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="w-full rounded-xl"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Correo electrónico *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            className="w-full rounded-xl"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono (opcional)
          </label>
          <Input
            id="telefono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="+56 9 1234 5678"
            className="w-full rounded-xl"
          />
        </div>
        <div>
          <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-2">
            Motivo de contacto *
          </label>
          <select
            id="motivo"
            name="motivo"
            required
            value={formData.motivo}
            onChange={handleChange}
            className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Selecciona un motivo</option>
            {motivosContactoMock.map(m => (
              <option key={m.id} value={m.titulo}>{m.titulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-2">
          Asunto *
        </label>
        <Input
          id="asunto"
          name="asunto"
          type="text"
          required
          value={formData.asunto}
          onChange={handleChange}
          placeholder="¿En qué podemos ayudarte?"
          className="w-full rounded-xl"
        />
      </div>

      <div className="mb-8">
        <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje *
        </label>
        <Textarea
          id="mensaje"
          name="mensaje"
          required
          rows={5}
          value={formData.mensaje}
          onChange={handleChange}
          placeholder="Cuéntanos más detalles sobre tu consulta..."
          className="w-full rounded-xl resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 py-6 text-lg rounded-xl"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Enviar Mensaje
          </>
        )}
      </Button>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Al enviar este formulario, aceptas nuestra{" "}
        <Link href="/privacidad" className="text-orange-600 hover:underline">
          Política de Privacidad
        </Link>
      </p>
    </motion.form>
  );
}

// Contact Info Card
interface ContactInfoCardProps {
  contactInfo: ContactInfo;
  redesSociales: RedSocial[];
}

function ContactInfoCard({ contactInfo, redesSociales }: ContactInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-10 text-white h-full"
    >
      <h3 className="text-2xl font-bold mb-2">Información de Contacto</h3>
      <p className="text-gray-400 mb-8">
        También puedes contactarnos directamente a través de estos medios.
      </p>

      <div className="space-y-6">
        {/* Dirección */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Dirección</h4>
            <p className="text-gray-400">
              {contactInfo.direccion}<br />
              {contactInfo.ciudad}, {contactInfo.region}
            </p>
            {contactInfo.googleMapsUrl && (
              <a
                href={contactInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm mt-2"
              >
                Ver en Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Teléfono */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Teléfono</h4>
            <p className="text-gray-400">
              <a href={`tel:${contactInfo.telefono}`} className="hover:text-orange-400 transition-colors">
                {contactInfo.telefono}
              </a>
            </p>
            {contactInfo.telefonoSecundario && (
              <p className="text-gray-400">
                <a href={`tel:${contactInfo.telefonoSecundario}`} className="hover:text-orange-400 transition-colors">
                  {contactInfo.telefonoSecundario}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Correo Electrónico</h4>
            <p className="text-gray-400">
              <a href={`mailto:${contactInfo.email}`} className="hover:text-orange-400 transition-colors">
                {contactInfo.email}
              </a>
            </p>
            {contactInfo.emailSoporte && (
              <p className="text-gray-400">
                <a href={`mailto:${contactInfo.emailSoporte}`} className="hover:text-orange-400 transition-colors">
                  {contactInfo.emailSoporte}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Horario */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Horario de Atención</h4>
            <p className="text-gray-400">{contactInfo.horarioSemana}</p>
            {contactInfo.horarioFinSemana && (
              <p className="text-gray-400">{contactInfo.horarioFinSemana}</p>
            )}
          </div>
        </div>
      </div>

      {/* Redes Sociales */}
      <div className="mt-10 pt-8 border-t border-gray-700">
        <h4 className="font-semibold text-white mb-4">Síguenos en Redes Sociales</h4>
        <div className="flex gap-3">
          {redesSociales.filter(r => r.activo).map((red) => {
            const Icon = socialIconMap[red.icono];
            return (
              <a
                key={red.id}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label={red.nombre}
              >
                {Icon && <Icon className="w-5 h-5" />}
              </a>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// FAQ Section
interface FAQSectionProps {
  faqs: FAQ[];
}

function FAQSection({ faqs }: FAQSectionProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Encuentra respuestas rápidas a las consultas más comunes sobre FabLab.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.sort((a, b) => a.orden - b.orden).map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
            >
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.pregunta}</span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                    openFaq === faq.id ? "rotate-90" : ""
                  }`}
                />
              </button>
              {openFaq === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-5"
                >
                  <p className="text-gray-600 leading-relaxed">{faq.respuesta}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <p className="text-gray-500 mb-4">¿No encuentras lo que buscas?</p>
          <Button
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
            onClick={() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            Contáctanos directamente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// Map Section
interface MapSectionProps {
  embedUrl?: string;
}

function MapSection({ embedUrl }: MapSectionProps) {
  if (!embedUrl) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-green-100 text-green-600 rounded-full text-sm font-semibold mb-4">
            Ubicación
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Visítanos en INACAP Los Ángeles
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Te esperamos en nuestras instalaciones en Av. Ricardo Vicuña 825, Los Ángeles. 
            Ven a conocer todo lo que FabLab tiene para ofrecerte.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden shadow-xl border border-gray-100"
        >
          <div className="relative h-[400px] md:h-[500px] bg-gray-100">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación FabLab"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function ContactoPage({ 
  contactInfo = contactInfoMock,
  redesSociales = redesSocialesMock,
  motivosContacto = motivosContactoMock,
  faqs = faqsMock,
}: ContactoPageProps) {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Handler para envío del formulario
   * Guarda el mensaje en la base de datos usando Payload CMS
   */
  const handleSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await submitContactMessage({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        motivo: data.motivo,
        asunto: data.asunto,
        mensaje: data.mensaje,
      });

      if (result.success) {
        console.log("Mensaje guardado en BD:", result.id);
        setSubmitSuccess(true);
      } else {
        console.error("Error al guardar mensaje:", result.message);
        alert("Error al enviar el mensaje. Por favor, intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      alert("Error al enviar el mensaje. Por favor, intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <HeroContacto />

      {/* Motivos de Contacto */}
      <MotivosContactoSection
        motivos={motivosContacto}
        onSelectMotivo={setMotivoSeleccionado}
        motivoSeleccionado={motivoSeleccionado}
      />

      {/* Formulario + Info de Contacto */}
      <section id="contact-form" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Formulario - 3 columnas */}
            <div className="lg:col-span-3">
              <ContactForm
                motivoSeleccionado={motivoSeleccionado}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitSuccess={submitSuccess}
              />
            </div>

            {/* Info de Contacto - 2 columnas */}
            <div className="lg:col-span-2">
              <ContactInfoCard 
                contactInfo={contactInfo} 
                redesSociales={redesSociales} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection faqs={faqs} />

      {/* Mapa */}
      <MapSection embedUrl={contactInfo.googleMapsEmbed} />
    </div>
  );
}
