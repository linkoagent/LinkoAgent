import type { ChannelType } from "@prisma/client";
import { whatsappAdapter } from "@/lib/whatsapp/adapter";
import { instagramAdapter } from "@/lib/instagram/adapter";
import type { ChannelAdapter } from "./types";

/** Único archivo de todo el sistema de canales que conoce qué adapter concreto corresponde a
 * cada ChannelType — agregar Messenger/Web Chat mañana es un caso nuevo acá, sin tocar
 * inbound.ts, conversations.ts ni ninguna otra lógica genérica. */
const ADAPTERS: Partial<Record<ChannelType, ChannelAdapter>> = {
  WHATSAPP: whatsappAdapter,
  INSTAGRAM: instagramAdapter,
};

export function getChannelAdapter(type: ChannelType): ChannelAdapter {
  const adapter = ADAPTERS[type];
  if (!adapter) throw new Error(`No hay un adaptador implementado todavía para el canal ${type}.`);
  return adapter;
}
