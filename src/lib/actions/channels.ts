"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { testWhatsAppConnection } from "@/lib/whatsapp/client";
import {
  exchangeEmbeddedSignupCode,
  subscribeAppToWaba,
  fetchPhoneNumberDisplayName,
} from "@/lib/whatsapp/embeddedSignup";

export interface ConnectWhatsAppResult {
  ok: boolean;
  error?: string;
}

export async function connectWhatsAppChannel(formData: FormData): Promise<ConnectWhatsAppResult> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const accountName = String(formData.get("accountName") ?? "").trim();
  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const wabaId = String(formData.get("wabaId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();

  if (!phoneNumberId) return { ok: false, error: "Falta el Phone Number ID" };

  try {
    const existing = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "WHATSAPP" } });

    if (existing) {
      await prisma.channel.update({
        where: { id: existing.id },
        data: {
          accountName: accountName || existing.accountName,
          phoneNumberId,
          wabaId: wabaId || null,
          accessToken: accessToken || null,
          status: "CONNECTED",
          connectedAt: new Date(),
          lastError: null,
        },
      });
    } else {
      await prisma.channel.create({
        data: {
          companyId: ctx.companyId,
          type: "WHATSAPP",
          accountName: accountName || null,
          phoneNumberId,
          wabaId: wabaId || null,
          accessToken: accessToken || null,
          status: "CONNECTED",
          connectedAt: new Date(),
        },
      });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Ese Phone Number ID ya está conectado a otra cuenta de Linko." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Error conectando el canal" };
  }

  revalidatePath("/channels");
  return { ok: true };
}

export interface EmbeddedSignupResult {
  ok: boolean;
  error?: string;
}

/**
 * Completa la conexión iniciada por el botón de Embedded Signup: intercambia el code por un
 * access token de negocio, suscribe nuestro webhook al WABA elegido, y guarda el canal como
 * si lo hubieras cargado a mano en /channels. wabaId/phoneNumberId vienen de los mensajes
 * postMessage que manda el popup de Meta durante el flujo (no del code en sí).
 */
export async function completeEmbeddedSignup(params: {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
}): Promise<EmbeddedSignupResult> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const { code, wabaId, phoneNumberId } = params;

  if (!wabaId || !phoneNumberId) {
    return { ok: false, error: "Meta no devolvió el WhatsApp Business Account o el número elegido. Probá de nuevo." };
  }

  try {
    const accessToken = await exchangeEmbeddedSignupCode(code);
    await subscribeAppToWaba(wabaId, accessToken);
    const accountName = await fetchPhoneNumberDisplayName(phoneNumberId, accessToken);

    const existing = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "WHATSAPP" } });
    const data = {
      companyId: ctx.companyId,
      type: "WHATSAPP" as const,
      accountName,
      phoneNumberId,
      wabaId,
      accessToken,
      status: "CONNECTED" as const,
      connectedAt: new Date(),
      lastError: null,
    };

    if (existing) {
      await prisma.channel.update({ where: { id: existing.id }, data });
    } else {
      await prisma.channel.create({ data });
    }

    revalidatePath("/channels");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error conectando WhatsApp" };
  }
}

export async function disconnectChannel(channelId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.channel.updateMany({
    where: { id: channelId, companyId: ctx.companyId },
    data: { status: "DISCONNECTED", connectedAt: null },
  });
  revalidatePath("/channels");
}

export async function testChannelConnection(channelId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const channel = await prisma.channel.findFirst({ where: { id: channelId, companyId: ctx.companyId } });
  if (!channel) return { ok: false, mocked: false, error: "Canal no encontrado" };

  const result = await testWhatsAppConnection(channel);

  await prisma.channel.update({
    where: { id: channelId },
    data: { lastError: result.ok ? null : "error" in result ? result.error ?? "Error de conexión" : "Error de conexión" },
  });

  revalidatePath("/channels");
  return result;
}
