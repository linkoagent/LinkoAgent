import { Resend } from "resend";

export const EMAIL_MOCK = !process.env.RESEND_API_KEY || process.env.EMAIL_MOCK_MODE === "true";
const EMAIL_FROM = process.env.EMAIL_FROM || "Linko Agent <hola@linkoagent.com>";

let client: Resend | null = null;
function getClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envío de email con modo mock: mientras no haya RESEND_API_KEY (o EMAIL_MOCK_MODE=true), el
 * email no se manda de verdad — queda logueado en la consola del servidor para poder probar
 * los flujos (recuperación de contraseña, invitaciones, notificación de contacto) sin cuenta
 * de Resend todavía. Mismo criterio que el modo mock de IA y WhatsApp.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (EMAIL_MOCK) {
    const links = extractLinks(html);
    const linksBlock = links.length ? `\n[email:mock] Links:\n${links.map((l) => `  - ${l}`).join("\n")}` : "";
    console.log(`\n[email:mock] Para: ${to}\n[email:mock] Asunto: ${subject}\n[email:mock] Contenido:\n${stripHtml(html)}${linksBlock}\n`);
    return { ok: true, mocked: true };
  }

  const result = await getClient().emails.send({ from: EMAIL_FROM, to, subject, html });
  if (result.error) {
    console.error("[email] Error enviando email:", result.error);
    return { ok: false, mocked: false, error: result.error.message };
  }
  return { ok: true, mocked: false, id: result.data?.id };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractLinks(html: string): string[] {
  const matches = [...html.matchAll(/href="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}
