import type { Channel } from "@prisma/client";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";

function isMock(channel: Pick<Channel, "accessToken">) {
  return process.env.WHATSAPP_MOCK_MODE === "true" || !channel.accessToken;
}

export async function sendWhatsAppMessage(params: { channel: Channel; to: string; text: string }) {
  const { channel, to, text } = params;

  if (isMock(channel)) {
    return { ok: true, mocked: true, id: `mock-${Date.now()}` };
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${channel.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channel.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return { ok: true, mocked: false, id: data.messages?.[0]?.id as string | undefined };
}

export async function testWhatsAppConnection(channel: Channel) {
  if (isMock(channel)) {
    return { ok: true, mocked: true };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${channel.phoneNumberId}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${channel.accessToken}` } }
    );
    return { ok: res.ok, mocked: false, status: res.status };
  } catch (err) {
    return { ok: false, mocked: false, error: err instanceof Error ? err.message : String(err) };
  }
}
