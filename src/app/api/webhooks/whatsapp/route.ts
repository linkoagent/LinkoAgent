import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processInboundChannelMessage, ingestPassiveWhatsAppMessage } from "@/lib/channels/inbound";
import { rateLimit } from "@/lib/rateLimit";
import { verifyMetaWebhookSignature } from "@/lib/webhookSignature";

interface WhatsAppRawMessage {
  id?: string;
  from?: string;
  to?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
  [key: string]: unknown;
}

function extractText(msg: WhatsAppRawMessage): string {
  if (msg.text?.body) return msg.text.body;
  const byType = msg.type ? (msg[msg.type] as { body?: string } | undefined) : undefined;
  return byType?.body ?? "[mensaje no soportado en el MVP]";
}

/**
 * Verificación de webhook de Meta (se configura una sola vez en la app de Meta,
 * a nivel de plataforma — no por empresa).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`whatsapp-webhook:${ip}`, 120, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const rawBody = await req.text();
  if (!verifyMetaWebhookSignature(rawBody, req.headers.get("x-hub-signature-256"), process.env.META_APP_SECRET)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }
  const payload = JSON.parse(rawBody);

  try {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
    const message = value?.messages?.[0];

    if (!phoneNumberId) {
      await prisma.webhookEvent.create({ data: { provider: "whatsapp", payload } });
      return NextResponse.json({ ok: true });
    }

    const channel = await prisma.channel.findUnique({ where: { phoneNumberId } });

    await prisma.webhookEvent.create({
      data: { provider: "whatsapp", payload, companyId: channel?.companyId, channelId: channel?.id },
    });

    if (!channel) {
      return NextResponse.json({ ok: true });
    }

    // Coexistence: mensajes mandados a mano desde la WhatsApp Business App del celular — se
    // reflejan en el Inbox como HUMAN, sin pasar por la IA (ya fueron respondidos).
    const echoes = value?.message_echoes as WhatsAppRawMessage[] | undefined;
    if (Array.isArray(echoes)) {
      for (const echo of echoes) {
        if (!echo.to) continue;
        await ingestPassiveWhatsAppMessage({
          channel,
          channelUserId: echo.to,
          sender: "HUMAN",
          text: extractText(echo),
          channelMessageId: echo.id,
        });
      }
    }

    // Coexistence: import del historial previo a conectar (una sola vez, dentro de la ventana de
    // 24hs desde que se pidió con triggerSmbAppDataSync). Cada thread es una conversación con un
    // cliente; el remitente se infiere comparando con el número del negocio.
    const historyEntries = value?.history as Array<{ threads?: Array<{ id?: string; messages?: WhatsAppRawMessage[] }> }> | undefined;
    if (Array.isArray(historyEntries)) {
      const businessPhone: string | undefined = value?.metadata?.display_phone_number;
      for (const entry of historyEntries) {
        for (const thread of entry.threads ?? []) {
          if (!thread.id) continue;
          for (const msg of thread.messages ?? []) {
            await ingestPassiveWhatsAppMessage({
              channel,
              channelUserId: thread.id,
              sender: msg.from === businessPhone ? "HUMAN" : "CUSTOMER",
              text: extractText(msg),
              channelMessageId: msg.id,
              createdAt: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : undefined,
            });
          }
        }
      }
    }

    if (!message) {
      // Evento que no es un mensaje nuevo (ej. status de entrega, o ya cubierto arriba): se ignora.
      return NextResponse.json({ ok: true });
    }

    const fromPhone: string = message.from;
    const fromName: string | undefined = value?.contacts?.[0]?.profile?.name;

    const audio = message.type === "audio" ? { mediaId: message.audio?.id as string, mimeType: message.audio?.mime_type as string } : undefined;
    const text: string = message.text?.body ?? (audio ? "" : "[mensaje no soportado en el MVP]");

    await processInboundChannelMessage({ channel, channelUserId: fromPhone, fromName, text, audio, channelMessageId: message.id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/whatsapp] Error procesando mensaje entrante:", err);
    await prisma.webhookEvent.create({
      data: { provider: "whatsapp", payload, error: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
