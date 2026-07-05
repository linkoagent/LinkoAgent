"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { testWhatsAppConnection } from "@/lib/whatsapp/client";

export async function connectWhatsAppChannel(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const accountName = String(formData.get("accountName") ?? "").trim();
  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const wabaId = String(formData.get("wabaId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();

  if (!phoneNumberId) return;

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

  revalidatePath("/channels");
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
