import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processInboundChannelMessage } from "@/lib/channels/inbound";
import { fetchInstagramSenderName } from "@/lib/instagram/oauth";
import { rateLimit } from "@/lib/rateLimit";

/** Verificación de webhook de Meta — mismo patrón que WhatsApp, token propio de Instagram. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`instagram-webhook:${ip}`, 120, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const payload = await req.json();

  try {
    const entry = payload?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const igBusinessAccountId: string | undefined = entry?.id;

    if (!igBusinessAccountId) {
      await prisma.webhookEvent.create({ data: { provider: "instagram", payload } });
      return NextResponse.json({ ok: true });
    }

    const channel = await prisma.channel.findFirst({ where: { type: "INSTAGRAM", accountId: igBusinessAccountId } });

    await prisma.webhookEvent.create({
      data: { provider: "instagram", payload, companyId: channel?.companyId, channelId: channel?.id },
    });

    // Sin canal registrado, evento que no es un mensaje (ej. reacción), o eco de un mensaje que
    // la propia cuenta mandó (incluso a mano desde la app de Instagram) — is_echo es un campo
    // real de Instagram sin equivalente en WhatsApp: sin filtrarlo, cada respuesta rebotaría acá
    // y se procesaría como si fuera un mensaje nuevo del cliente.
    if (!channel || !messaging?.message || messaging.message.is_echo) {
      return NextResponse.json({ ok: true });
    }

    const senderId: string = messaging.sender.id;
    const text: string = messaging.message.text ?? "[mensaje no soportado en el MVP]";

    const existingCustomer = await prisma.customer.findUnique({
      where: { companyId_channelType_channelUserId: { companyId: channel.companyId, channelType: "INSTAGRAM", channelUserId: senderId } },
    });
    const fromName = existingCustomer?.name ?? (channel.accessToken ? await fetchInstagramSenderName(channel.accessToken, senderId) : null);

    await processInboundChannelMessage({
      channel,
      channelUserId: senderId,
      fromName,
      text,
      channelMessageId: messaging.message.mid,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/instagram] Error procesando mensaje entrante:", err);
    await prisma.webhookEvent.create({
      data: { provider: "instagram", payload, error: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
