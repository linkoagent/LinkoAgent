import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { processInboundChannelMessage } from "@/lib/channels/inbound";

const schema = z.object({
  channelId: z.string().min(1),
  fromUserId: z.string().min(1),
  fromName: z.string().optional(),
  text: z.string().min(1),
  isEcho: z.boolean().optional(),
});

/**
 * Simula un DM entrante de Instagram sin depender de una cuenta real de Meta: corre exactamente
 * el mismo pipeline que el webhook real (`processInboundChannelMessage`). `isEcho` permite probar
 * explícitamente el caso de mensajes que la propia cuenta manda (deben ignorarse, no generar
 * conversación) — es el único comportamiento sin equivalente en el simulador de WhatsApp.
 */
export async function POST(req: Request) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (parsed.data.isEcho) {
    return NextResponse.json({ ok: true, autoReplied: false, ignored: "is_echo" });
  }

  const channel = await prisma.channel.findFirst({
    where: { id: parsed.data.channelId, companyId: ctx.companyId },
  });
  if (!channel) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  }

  const result = await processInboundChannelMessage({
    channel,
    channelUserId: parsed.data.fromUserId,
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
