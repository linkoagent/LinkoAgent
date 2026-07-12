import { sendWhatsAppMessage, testWhatsAppConnection } from "./client";
import type { ChannelAdapter } from "@/lib/channels/types";

/** Mapeo 1:1 sobre whatsapp/client.ts, sin lógica nueva — solo lo adapta a la interfaz genérica
 * de canal para que el resto del sistema no vuelva a importar funciones de WhatsApp directo. */
export const whatsappAdapter: ChannelAdapter = {
  async sendTextMessage({ channel, to, text }) {
    try {
      const result = await sendWhatsAppMessage({ channel, to, text });
      return result;
    } catch (err) {
      return { ok: false, mocked: false, error: err instanceof Error ? err.message : "Error enviando el mensaje por WhatsApp" };
    }
  },
  async testConnection(channel) {
    const result = await testWhatsAppConnection(channel);
    return { ok: result.ok, mocked: result.mocked, error: "error" in result ? result.error : undefined };
  },
};
