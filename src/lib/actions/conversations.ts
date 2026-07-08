"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyContext } from "@/lib/tenant";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { summarizeMessages } from "@/lib/ai/agentEngine";

async function loadConversation(conversationId: string, companyId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, companyId },
    include: { channel: true, customer: true },
  });
}

export interface SendManualReplyResult {
  ok: boolean;
  error?: string;
}

export async function sendManualReply(conversationId: string, text: string): Promise<SendManualReplyResult> {
  const ctx = await requireCompanyContext();
  if (!text.trim()) return { ok: false, error: "El mensaje está vacío" };

  const conversation = await loadConversation(conversationId, ctx.companyId);
  if (!conversation) return { ok: false, error: "Conversación no encontrada" };

  // Se guarda primero, pase lo que pase con el envío: si WhatsApp lo rechaza (ej. se cerró la
  // ventana de 24hs desde el último mensaje del cliente), igual queda registrado en el
  // historial en vez de perderse junto con la excepción.
  await prisma.message.create({
    data: { conversationId, sender: "HUMAN", content: text.trim() },
  });

  if (conversation.channel.type === "WHATSAPP") {
    try {
      await sendWhatsAppMessage({ channel: conversation.channel, to: conversation.customer.channelUserId, text: text.trim() });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Error enviando el mensaje por WhatsApp";
      await prisma.channel.update({ where: { id: conversation.channel.id }, data: { lastError: error } });
      revalidatePath(`/inbox/${conversationId}`);
      return { ok: false, error };
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      status: "IN_PROGRESS",
      assignedUserId: conversation.assignedUserId ?? ctx.userId,
    },
  });

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
  return { ok: true };
}

export async function toggleAiPause(conversationId: string, aiPaused: boolean) {
  const ctx = await requireCompanyContext();
  await prisma.conversation.updateMany({
    where: { id: conversationId, companyId: ctx.companyId },
    data: { aiPaused },
  });
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function assignToMe(conversationId: string) {
  const ctx = await requireCompanyContext();
  await prisma.conversation.updateMany({
    where: { id: conversationId, companyId: ctx.companyId },
    data: { assignedUserId: ctx.userId, aiPaused: true, status: "IN_PROGRESS" },
  });
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function closeConversation(conversationId: string) {
  const ctx = await requireCompanyContext();
  await prisma.conversation.updateMany({
    where: { id: conversationId, companyId: ctx.companyId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function reopenConversation(conversationId: string) {
  const ctx = await requireCompanyContext();
  await prisma.conversation.updateMany({
    where: { id: conversationId, companyId: ctx.companyId },
    data: { status: "OPEN", closedAt: null },
  });
  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export async function addNote(conversationId: string, body: string) {
  const ctx = await requireCompanyContext();
  if (!body.trim()) return;
  await prisma.note.create({
    data: { companyId: ctx.companyId, conversationId, authorUserId: ctx.userId, body: body.trim() },
  });
  revalidatePath(`/inbox/${conversationId}`);
}

export async function addTag(conversationId: string, tagName: string) {
  const ctx = await requireCompanyContext();
  const name = tagName.trim();
  if (!name) return;

  const tag = await prisma.tag.upsert({
    where: { companyId_name: { companyId: ctx.companyId, name } },
    update: {},
    create: { companyId: ctx.companyId, name },
  });

  await prisma.conversationTag.upsert({
    where: { conversationId_tagId: { conversationId, tagId: tag.id } },
    update: {},
    create: { conversationId, tagId: tag.id },
  });

  revalidatePath(`/inbox/${conversationId}`);
}

export async function removeTag(conversationId: string, tagId: string) {
  await requireCompanyContext();
  await prisma.conversationTag.deleteMany({ where: { conversationId, tagId } });
  revalidatePath(`/inbox/${conversationId}`);
}

export async function generateSummary(conversationId: string) {
  const ctx = await requireCompanyContext();
  const conversation = await loadConversation(conversationId, ctx.companyId);
  if (!conversation) return;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { sender: true, content: true },
  });
  if (messages.length === 0) return;

  const summary = await summarizeMessages(messages);
  await prisma.conversation.update({ where: { id: conversationId }, data: { summary } });
  revalidatePath(`/inbox/${conversationId}`);
}
