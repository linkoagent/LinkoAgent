import { sendInstagramMessage, testInstagramConnection } from "./client";
import type { ChannelAdapter } from "@/lib/channels/types";

export const instagramAdapter: ChannelAdapter = {
  async sendTextMessage({ channel, to, text }) {
    try {
      const result = await sendInstagramMessage({ channel, to, text });
      return result;
    } catch (err) {
      return { ok: false, mocked: false, error: err instanceof Error ? err.message : "Error enviando el mensaje por Instagram" };
    }
  },
  async testConnection(channel) {
    const result = await testInstagramConnection(channel);
    return { ok: result.ok, mocked: result.mocked, error: "error" in result ? result.error : undefined };
  },
};
