/**
 * Email utility — Envía correos via SMTP (nodemailer)
 *
 * Variables de entorno necesarias:
 *   SMTP_HOST     — Servidor SMTP (ej: smtp.gmail.com)
 *   SMTP_PORT     — Puerto (587 para TLS, 465 para SSL)
 *   SMTP_USER     — Usuario SMTP
 *   SMTP_PASS     — Contraseña o App Password
 *   SMTP_FROM     — Dirección "from" (ej: FabLab <noreply@fablablosangeles.com>)
 */

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[sendEmail] SMTP no configurado — el correo NO se enviará. Configure SMTP_HOST, SMTP_USER, SMTP_PASS.");
    return { success: false, error: "SMTP no configurado" };
  }

  try {
    const from = process.env.SMTP_FROM || `FabLab INACAP <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log(`[sendEmail] Correo enviado: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[sendEmail] Error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Genera el HTML para notificar a un suscriptor de un nuevo blog post.
 */
export function buildNewPostEmailHtml({
  postTitle,
  postExcerpt,
  postUrl,
  postImageUrl,
  unsubscribeUrl,
}: {
  postTitle: string;
  postExcerpt?: string;
  postUrl: string;
  postImageUrl?: string;
  unsubscribeUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo artículo en FabLab Blog</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">
                🔬 FabLab Blog
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                Nuevo artículo publicado
              </p>
            </td>
          </tr>

          ${postImageUrl ? `
          <!-- Image -->
          <tr>
            <td>
              <img src="${postImageUrl}" alt="${postTitle}" width="600" style="display:block;width:100%;height:auto;max-height:300px;object-fit:cover;" />
            </td>
          </tr>
          ` : ""}

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;line-height:1.3;">
                ${postTitle}
              </h2>
              ${postExcerpt ? `
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                ${postExcerpt}
              </p>
              ` : ""}
              <a href="${postUrl}" style="display:inline-block;padding:12px 28px;background-color:#ea580c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                Leer artículo →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Recibes este correo porque te suscribiste al newsletter de FabLab INACAP Los Ángeles.
                <br/>
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Desuscribirse</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Genera el HTML para el correo de confirmación de suscripción al newsletter.
 */
export function buildSubscriptionConfirmationHtml({
  unsubscribeUrl,
}: {
  unsubscribeUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido al Newsletter de FabLab</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                🔬 FabLab Blog
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">
                ¡Bienvenido al Newsletter!
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;line-height:1.3;">
                ¡Gracias por suscribirte! 🎉
              </h2>
              <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
                Te has suscrito exitosamente al newsletter del <strong>FabLab INACAP Los Ángeles</strong>.
                A partir de ahora recibirás un correo cada vez que publiquemos un nuevo artículo en nuestro blog.
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Podrás enterarte de las últimas novedades en fabricación digital, tutoriales, proyectos y mucho más.
              </p>
              <a href="${typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SERVER_URL ? process.env.NEXT_PUBLIC_SERVER_URL : ''}/blog" style="display:inline-block;padding:12px 28px;background-color:#ea580c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                Visitar el Blog →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                Recibes este correo porque te suscribiste al newsletter de FabLab INACAP Los Ángeles.
                <br/>
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Desuscribirse</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
