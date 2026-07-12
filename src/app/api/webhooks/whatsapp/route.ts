import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processInboundChannelMessage } from "@/lib/channels/inbound";
import { rateLimit } from "@/lib/rateLimit";

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

  const payload = await req.json();

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

    if (!channel || !message) {
      // Sin canal registrado o evento que no es un mensaje (ej. status de entrega): se ignora.
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
