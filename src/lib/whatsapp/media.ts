import type { Channel } from "@prisma/client";
import { GRAPH_VERSION } from "@/lib/whatsapp/client";

function isMock(channel: Pick<Channel, "accessToken">) {
  return process.env.WHATSAPP_MOCK_MODE === "true" || !channel.accessToken;
}

export interface DownloadedMedia {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Descarga un audio de WhatsApp en dos pasos (así funciona la Graph API de Meta): primero se
 * pide la metadata del media (que trae una URL prefirmada de corta duración), y recién ahí se
 * descarga el binario con el mismo Bearer token — la URL prefirmada sola no alcanza, Meta exige
 * el header de auth también en la descarga del binario.
 */
export async function downloadWhatsAppMedia(mediaId: string, channel: Channel): Promise<DownloadedMedia> {
  if (isMock(channel)) {
    // Un buffer mínimo (no es audio real) solo para poder ejercitar el pipeline en modo mock
    // sin depender de un audio real ni de credenciales de Meta.
    return { buffer: Buffer.from("mock-audio"), mimeType: "audio/ogg" };
  }

  const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${channel.accessToken}` },
  });
  if (!metaRes.ok) {
    throw new Error(`No se pudo obtener la metadata del audio (${metaRes.status}): ${await metaRes.text()}`);
  }
  const meta = await metaRes.json();

  const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${channel.accessToken}` } });
  if (!fileRes.ok) {
    throw new Error(`No se pudo descargar el audio (${fileRes.status})`);
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mimeType: meta.mime_type ?? "audio/ogg" };
}
