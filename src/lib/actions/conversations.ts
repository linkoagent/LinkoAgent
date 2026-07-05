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

export async function sendManualReply(conversationId: string, text: string) {
  const ctx = await requireCompanyContext();
  if (!text.trim()) return;

  const conversation = await loadConversation(conversationId, ctx.companyId);
  if (!conversation) return;

  await prisma.message.create({
    data: { conversationId, sender: "HUMAN", content: text.trim() },
  });

  if (conversation.channel.type === "WHATSAPP") {
    await sendWhatsAppMessage({ channel: conversation.channel, to: conversation.customer.channelUserId, text: text.trim() });
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
