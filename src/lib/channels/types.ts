import type { Channel } from "@prisma/client";

export interface SendMessageResult {
  ok: boolean;
  mocked: boolean;
  id?: string;
  error?: string;
}

export interface TestConnectionResult {
  ok: boolean;
  mocked: boolean;
  error?: string;
}

/**
 * Cada canal (WhatsApp, Instagram, y los que vengan después) implementa esta misma interfaz — el
 * resto del sistema (inbound.ts, conversations.ts, channels.ts) nunca vuelve a mencionar un
 * proveedor concreto, solo habla con el adapter que corresponda según `channel.type`.
 */
export interface ChannelAdapter {
  sendTextMessage(params: { channel: Channel; to: string; text: string }): Promise<SendMessageResult>;
  testConnection(channel: Channel): Promise<TestConnectionResult>;
}
