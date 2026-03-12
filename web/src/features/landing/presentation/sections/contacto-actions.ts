"use server";

import { getPayload } from "payload";
import config from "@/../payload.config";

interface ContactFormData {
  nombre: string;
  email: string;
  telefono?: string;
  motivo?: string;
  asunto: string;
  mensaje: string;
}

export async function submitContactMessage(data: ContactFormData) {
  try {
    const payload = await getPayload({ config });

    const result = await payload.create({
      collection: "contact-messages",
      data: {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        asunto: data.asunto,
        mensaje: data.mensaje,
        estado: "nuevo",
      },
    });

    // Enviar correo electrónico via PHP endpoint
    try {
      await fetch("https://fablablosangeles.com/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono || "",
          motivo: data.motivo || "",
          asunto: data.asunto,
          mensaje: data.mensaje,
        }),
      });
    } catch (emailError) {
      console.error("Error al enviar correo de notificación:", emailError);
    }

    return {
      success: true,
      message: "Mensaje enviado correctamente",
      id: result.id,
    };
  } catch (error) {
    console.error("Error al guardar mensaje de contacto:", error);
    return {
      success: false,
      message: "Error al enviar el mensaje. Por favor, intenta de nuevo.",
    };
  }
}
