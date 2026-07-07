import type { Channel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectIntent, detectSentiment } from "@/lib/ai/heuristics";
import { searchKnowledge } from "@/lib/ai/knowledge";
import { runAgentOnMessage } from "@/lib/ai/agentEngine";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { registerNewConversationUsage } from "@/lib/billing";

export interface InboundWhatsAppMessage {
  channel: Channel;
  fromPhone: string;
  fromName?: string | null;
  text: string;
  channelMessageId?: string;
}

/**
 * Corazón del flujo conversacional: crea/recupera cliente y conversación, guarda el
 * mensaje entrante, y si la IA no está pausada, genera y envía la respuesta.
 * La usan tanto el webhook real de Meta como el simulador de mensajes.
 */
export async function processInboundWhatsAppMessage({
  channel,
  fromPhone,
  fromName,
  text,
  channelMessageId,
}: InboundWhatsAppMessage) {
  const customer = await prisma.customer.upsert({
    where: {
      companyId_channelType_channelUserId: {
        companyId: channel.companyId,
        channelType: "WHATSAPP",
        channelUserId: fromPhone,
      },
    },
    update: { lastContactAt: new Date(), ...(fromName ? { name: fromName } : {}) },
    create: {
      companyId: channel.companyId,
      channelType: "WHATSAPP",
      channelUserId: fromPhone,
      phone: fromPhone,
      name: fromName ?? null,
    },
  });

  let conversation = await prisma.conversation.findFirst({
    where: {
      companyId: channel.companyId,
      customerId: customer.id,
      channelId: channel.id,
      status: { notIn: ["CLOSED", "RESOLVED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  let overLimit = false;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        companyId: channel.companyId,
        channelId: channel.id,
        customerId: customer.id,
        status: "OPEN",
      },
    });

    ({ overLimit } = await registerNewConversationUsage(channel.companyId));
  }

  // Meta reintenta el webhook si no respondemos 200 a tiempo (o si hubo un error): sin este
  // chequeo, cada reintento generaba un mensaje de cliente duplicado y una respuesta de IA
  // (y un cobro de tokens) por cada reintento del mismo mensaje.
  if (channelMessageId) {
    const alreadyProcessed = await prisma.message.findFirst({
      where: { conversationId: conversation.id, channelMessageId },
      select: { id: true },
    });
    if (alreadyProcessed) {
      return { conversation, autoReplied: false as const };
    }
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, sender: "CUSTOMER", content: text, channelMessageId },
  });

  const sentiment = detectSentiment(text);
  const intent = detectIntent(text);

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), detectedSentiment: sentiment, detectedIntent: intent },
  });

  await prisma.channel.update({ where: { id: channel.id }, data: { lastMessageAt: new Date(), lastError: null } });

  if (overLimit) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "HANDED_OFF", aiPaused: true },
    });
    await prisma.humanHandoff.create({
      data: {
        conversationId: conversation.id,
        reason: "Se alcanzó el límite de conversaciones mensuales del plan.",
      },
    });
    return { conversation, autoReplied: false as const };
  }

  let agent = conversation.agentId ? await prisma.agent.findUnique({ where: { id: conversation.agentId } }) : null;

  if (!agent) {
    agent = await prisma.agent.findFirst({
      where: { companyId: channel.companyId, isActive: true, channels: { some: { channelId: channel.id } } },
      orderBy: { createdAt: "asc" },
    });
    if (agent) {
      conversation = await prisma.conversation.update({ where: { id: conversation.id }, data: { agentId: agent.id } });
    }
  }

  if (conversation.aiPaused || !agent) {
    return { conversation, autoReplied: false as const };
  }

  const knowledgeChunks = await searchKnowledge(agent.id, channel.companyId, text);
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 21,
  });

  const result = await runAgentOnMessage({
    agent,
    knowledgeChunks,
    history: history.slice(0, -1),
    customerMessage: text,
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "AI",
      content: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      costUsd: result.costUsd,
    },
  });

  await prisma.aiUsageLog.create({
    data: {
      companyId: channel.companyId,
      agentId: agent.id,
      conversationId: conversation.id,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      costUsd: result.costUsd,
    },
  });

  await prisma.subscription.updateMany({
    where: { companyId: channel.companyId },
    data: { tokensUsed: { increment: result.totalTokens }, costUsd: { increment: result.costUsd } },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      status: result.shouldHandoff ? "HANDED_OFF" : "OPEN",
      aiPaused: result.shouldHandoff ? true : conversation.aiPaused,
    },
  });

  if (result.shouldHandoff) {
    await prisma.humanHandoff.create({
      data: {
        conversationId: conversation.id,
        fromAgentId: agent.id,
        reason: "El agente de IA detectó que la consulta requiere atención humana.",
      },
    });
  }

  await sendWhatsAppMessage({ channel, to: fromPhone, text: result.content });

  return { conversation, autoReplied: true as const, reply: result.content, handedOff: result.shouldHandoff };
}
