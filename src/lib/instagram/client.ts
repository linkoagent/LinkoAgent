import type { Channel } from "@prisma/client";

export const INSTAGRAM_GRAPH_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION || "v21.0";

function isMock(channel: Pick<Channel, "accessToken">) {
  return process.env.INSTAGRAM_MOCK_MODE === "true" || !channel.accessToken;
}

/** POST /{IG_ID}/messages — Instagram API with Instagram Login (graph.instagram.com, no Página
 * de Facebook necesaria). `channel.accountId` guarda el Instagram Business Account ID conectado. */
export async function sendInstagramMessage(params: { channel: Channel; to: string; text: string }) {
  const { channel, to, text } = params;

  if (isMock(channel)) {
    return { ok: true, mocked: true, id: `mock-ig-${Date.now()}` };
  }

  const res = await fetch(`https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/${channel.accountId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${channel.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: to }, message: { text } }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Instagram send failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return { ok: true, mocked: false, id: data.message_id as string | undefined };
}

export async function testInstagramConnection(channel: Channel) {
  if (isMock(channel)) {
    return { ok: true, mocked: true };
  }
  try {
    const res = await fetch(`https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/me?fields=user_id,username`, {
      headers: { Authorization: `Bearer ${channel.accessToken}` },
    });
    return { ok: res.ok, mocked: false, status: res.status };
  } catch (err) {
    return { ok: false, mocked: false, error: err instanceof Error ? err.message : String(err) };
  }
}
