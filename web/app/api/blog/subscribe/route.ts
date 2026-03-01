import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import crypto from "crypto";
import { sendEmail, buildSubscriptionConfirmationHtml } from "@/shared/utils/email";

/**
 * POST /api/blog/subscribe — Suscribirse al newsletter del blog
 * GET  /api/blog/subscribe?unsubscribe=TOKEN — Darse de baja
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "El correo es obligatorio" }, { status: 400 });
    }

    // Validar formato email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Formato de correo no válido" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    // Verificar si ya existe
    const existing = await payload.find({
      collection: "blog-subscribers",
      where: { email: { equals: email.toLowerCase().trim() } },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = existing.docs[0] as any;
      if (sub.active) {
        return NextResponse.json({ success: true, message: "Ya estás suscrito al newsletter" });
      }
      // Reactivar suscripción
      await payload.update({
        collection: "blog-subscribers",
        id: sub.id,
        data: { active: true },
      });

      // Enviar correo de confirmación de reactivación
      const reactivateBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
      const reactivateUnsubscribeUrl = `${reactivateBaseUrl}/api/blog/subscribe?unsubscribe=${sub.unsubscribeToken}`;
      sendEmail({
        to: email.toLowerCase().trim(),
        subject: "¡Bienvenido de vuelta al Newsletter de FabLab!",
        html: buildSubscriptionConfirmationHtml({ unsubscribeUrl: reactivateUnsubscribeUrl }),
      }).catch((err) => console.error("[subscribe] Error enviando email de reactivación:", err));

      return NextResponse.json({ success: true, message: "¡Tu suscripción ha sido reactivada!" });
    }

    // Crear nuevo suscriptor
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");
    await payload.create({
      collection: "blog-subscribers",
      data: {
        email: email.toLowerCase().trim(),
        active: true,
        unsubscribeToken,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    // Enviar correo de confirmación de suscripción
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
    const unsubscribeUrl = `${baseUrl}/api/blog/subscribe?unsubscribe=${unsubscribeToken}`;
    sendEmail({
      to: email.toLowerCase().trim(),
      subject: "¡Bienvenido al Newsletter de FabLab!",
      html: buildSubscriptionConfirmationHtml({ unsubscribeUrl }),
    }).catch((err) => console.error("[subscribe] Error enviando email de confirmación:", err));

    return NextResponse.json({ success: true, message: "¡Te has suscrito al newsletter exitosamente!" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[API /blog/subscribe] Error:", error);
    // Duplicate key (email already exists in DB)
    if (error?.code === "23505" || error?.message?.includes("unique")) {
      return NextResponse.json({ success: true, message: "Ya estás suscrito al newsletter" });
    }
    return NextResponse.json({ success: false, error: "Error al procesar la suscripción" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("unsubscribe");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: "blog-subscribers",
      where: { unsubscribeToken: { equals: token } },
      limit: 1,
    });

    if (result.totalDocs === 0) {
      return NextResponse.json({ error: "Token no válido" }, { status: 404 });
    }

    await payload.update({
      collection: "blog-subscribers",
      id: result.docs[0].id,
      data: { active: false },
    });

    // Redirect to a simple HTML page
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Desuscripción</title></head>
       <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
         <div style="text-align:center;max-width:400px;padding:2rem;">
           <h1 style="color:#111;">Te has desuscrito</h1>
           <p style="color:#666;">Ya no recibirás correos del blog de FabLab.</p>
           <a href="/blog" style="color:#ea580c;">Volver al Blog</a>
         </div>
       </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
