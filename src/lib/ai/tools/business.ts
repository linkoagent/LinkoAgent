import { sendEmail } from "@/lib/email/client";
import { isStaff } from "./authz";
import { toolErrorResult } from "./errors";
import type { ToolDefinition } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envío de email en nombre de la empresa. Queda restringido a staff (igual que stock/base de
 * conocimiento): permitir que cualquier cliente le pida al bot mandar un email a una dirección
 * arbitraria sería un vector de spam/abuso demasiado fácil de explotar.
 */
export const sendEmailTool: ToolDefinition = {
  name: "send_email",
  description:
    "Envía un email en nombre de la empresa (ej. avisarle a un proveedor, mandar un recordatorio interno). Solo puede ejecutarlo el dueño/staff autorizado, nunca un cliente.",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Dirección de email del destinatario." },
      subject: { type: "string", description: "Asunto del email." },
      body: { type: "string", description: "Cuerpo del email en texto plano." },
    },
    required: ["to", "subject", "body"],
  },
  async execute(args, ctx) {
    try {
      if (!isStaff(ctx)) {
        return { error: "Esta acción solo la puede ejecutar el dueño o el staff del negocio desde un número autorizado." };
      }

      const to = String(args.to ?? "").trim();
      const subject = String(args.subject ?? "").trim();
      const body = String(args.body ?? "").trim();
      if (!to || !subject || !body) return { error: "Faltan destinatario, asunto o cuerpo del email." };
      if (!EMAIL_REGEX.test(to)) return { error: "La dirección de email no es válida." };

      const html = `<p>${body.replace(/\n/g, "<br/>")}</p>`;
      const result = await sendEmail({ to, subject, html });
      if (!result.ok) {
        return { sent: false, error: "error" in result ? result.error : "No se pudo enviar el email." };
      }
      return { sent: true, to, mocked: result.mocked };
    } catch (err) {
      return toolErrorResult("send_email", err);
    }
  },
};

export const BUSINESS_TOOLS: ToolDefinition[] = [sendEmailTool];
