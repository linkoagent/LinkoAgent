import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { processInboundWhatsAppMessage } from "@/lib/whatsapp/inbound";

const schema = z.object({
  channelId: z.string().min(1),
  fromPhone: z.string().min(4),
  fromName: z.string().optional(),
  text: z.string().min(1),
});

/**
 * Simula un mensaje entrante de WhatsApp sin depender de una cuenta real de Meta:
 * corre exactamente el mismo pipeline que el webhook real (`processInboundWhatsAppMessage`),
 * así se puede probar el circuito completo (IA + conocimiento + inbox + métricas) hoy mismo.
 */
export async function POST(req: Request) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const channel = await prisma.channel.findFirst({
    where: { id: parsed.data.channelId, companyId: ctx.companyId },
  });
  if (!channel) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  }

  const result = await processInboundWhatsAppMessage({
    channel,
    fromPhone: parsed.data.fromPhone,
    fromName: parsed.data.fromName,
    text: parsed.data.text,
  });

  return NextResponse.json({
    ok: true,
    conversationId: result.conversation.id,
    autoReplied: result.autoReplied,
    reply: "reply" in result ? result.reply : null,
  });
}
