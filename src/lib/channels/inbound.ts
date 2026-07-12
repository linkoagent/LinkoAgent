import type { Channel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectIntent, detectSentiment } from "@/lib/ai/heuristics";
import { searchKnowledge } from "@/lib/ai/knowledge";
import { runAgentOnMessage, summarizeVoiceTranscript } from "@/lib/ai/agentEngine";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media";
import { transcribeAudio, TRANSCRIPTION_SUMMARY_THRESHOLD } from "@/lib/ai/transcription";
import { registerNewConversationUsage } from "@/lib/billing";
import { RateLimitError } from "@/lib/ai/errors";
import { notifyHumanHandoff } from "@/lib/notifications";
import { getChannelAdapter } from "./registry";

export interface InboundChannelMessage {
  channel: Channel;
  /** Identidad del cliente en ese canal: número de teléfono en WhatsApp, IGSID en Instagram. */
  channelUserId: string;
  fromName?: string | null;
  text: string;
  /** Solo WhatsApp lo usa hoy — audio en otros canales queda fuera de esta fase a propósito. */
  audio?: { mediaId: string; mimeType: string };
  channelMessageId?: string;
}

/**
 * Corazón del flujo conversacional, agnóstico de canal: crea/recupera cliente y conversación,
 * guarda el mensaje entrante, y si la IA no está pausada, genera y envía la respuesta a través
 * del adapter del canal que corresponda (WhatsApp, Instagram, o el que siga). La usan tanto los
 * webhooks reales de cada plataforma como sus simuladores de mensajes.
 */
export async function processInboundChannelMessage({
  channel,
  channelUserId,
  fromName,
  text,
  audio,
  channelMessageId,
}: InboundChannelMessage) {
  const customer = await prisma.customer.upsert({
    where: {
      companyId_channelType_channelUserId: {
        companyId: channel.companyId,
        channelType: channel.type,
        channelUserId,
      },
    },
    update: { lastContactAt: new Date(), ...(fromName ? { name: fromName } : {}) },
    create: {
      companyId: channel.companyId,
      channelType: channel.type,
      channelUserId,
      // El teléfono es un campo de display específico de WhatsApp — en otros canales (Instagram)
      // no hay un teléfono real, channelUserId ya es la identidad (IGSID).
      phone: channel.type === "WHATSAPP" ? channelUserId : null,
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

  let transcription: { text: string; language: string | null; confidence: number | null } | null = null;
  if (audio && channel.type === "WHATSAPP") {
    try {
      const media = await downloadWhatsAppMedia(audio.mediaId, channel);
      transcription = await transcribeAudio(media.buffer, media.mimeType);
      text = transcription.text.trim() || "[Audio sin voz detectable]";
    } catch {
      // Si falla la descarga o la transcripción, seguimos igual: se guarda el mensaje como
      // placeholder en vez de perder el contacto del cliente, y sin voice metadata (no hay nada
      // real que mostrar). El agente de IA va a responder que no pudo entender el audio.
      text = "[No pudimos transcribir este audio]";
    }
  }

  let transcriptionSummary: string | null = null;
  if (audio && transcription && transcription.text.length > TRANSCRIPTION_SUMMARY_THRESHOLD) {
    try {
      transcriptionSummary = await summarizeVoiceTranscript(transcription.text);
    } catch {
      transcriptionSummary = null;
    }
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "CUSTOMER",
      content: text,
      channelMessageId,
      ...(audio
        ? {
            isVoiceMessage: true,
            audioMediaId: audio.mediaId,
            transcriptionLanguage: transcription?.language ?? null,
            transcriptionConfidence: transcription?.confidence ?? null,
            transcriptionSummary,
          }
        : {}),
    },
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
    const reason = "Se alcanzó el límite de conversaciones mensuales del plan.";
    await prisma.humanHandoff.create({ data: { conversationId: conversation.id, reason } });
    await notifyHumanHandoff(conversation.id, reason);
    return { conversation, autoReplied: false as const };
  }

  let agent = conversation.agentId ? await prisma.agent.findUnique({ where: { id: conversation.agentId } }) : null;
  let agentChannel = agent ? await prisma.agentChannel.findUnique({ where: { agentId_channelId: { agentId: agent.id, channelId: channel.id } } }) : null;

  if (!agent) {
    const match = await prisma.agent.findFirst({
      where: { companyId: channel.companyId, isActive: true, channels: { some: { channelId: channel.id } } },
      orderBy: { createdAt: "asc" },
      include: { channels: { where: { channelId: channel.id } } },
    });
    if (match) {
      agent = match;
      agentChannel = match.channels[0] ?? null;
      conversation = await prisma.conversation.update({ where: { id: conversation.id }, data: { agentId: agent.id } });
    }
  }

  if (conversation.aiPaused || !agent) {
    return { conversation, autoReplied: false as const };
  }

  let result;
  try {
    const knowledgeChunks = await searchKnowledge(agent.id, channel.companyId, text);
    // orderBy desc + take + reverse (no asc + take): con "asc" quedaban los 21 mensajes MÁS
    // VIEJOS de toda la conversación, congelados para siempre en vez de los más recientes —
    // pasados los 21 mensajes totales, el modelo perdía todo el contexto reciente.
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 21,
    });
    const history = recentMessages.reverse();

    result = await runAgentOnMessage({
      agent,
      knowledgeChunks,
      history: history.slice(0, -1),
      customerMessage: text,
      customerId: customer.id,
      conversationId: conversation.id,
      customerPhone: channelUserId,
      toneOverride: agentChannel?.toneOverride,
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      // err.message ya distingue de qué modelo se trata (texto vs transcripción de audio, cada
      // uno con su propia cuota en Groq) — antes se descartaba a favor de un texto genérico que
      // no permitía saber cuál de los dos se había quedado sin cuota.
      const reason = `Se derivó a un humano: ${err.message}`;
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: "HANDED_OFF", aiPaused: true },
      });
      await prisma.humanHandoff.create({ data: { conversationId: conversation.id, reason } });
      await notifyHumanHandoff(conversation.id, reason);
      return { conversation, autoReplied: false as const };
    }
    // Cualquier otro error (ej. un bug en un tool, un fallo real de la API de Google/Groq no
    // contemplado como RateLimitError) NO debe dejar al cliente sin ninguna respuesta — antes
    // esto se relanzaba y rompía todo el webhook en silencio. Se loguea para poder diagnosticar
    // y se deriva a un humano igual que los otros casos de fallo.
    console.error("[inbound] Error inesperado generando la respuesta del agente:", err);
    const reason = "El agente de IA tuvo un error inesperado generando la respuesta — revisar el canal.";
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "HANDED_OFF", aiPaused: true },
    });
    await prisma.humanHandoff.create({ data: { conversationId: conversation.id, reason } });
    await notifyHumanHandoff(conversation.id, reason);
    return { conversation, autoReplied: false as const };
  }

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
    const reason = "El agente de IA detectó que la consulta requiere atención humana.";
    await prisma.humanHandoff.create({ data: { conversationId: conversation.id, fromAgentId: agent.id, reason } });
    await notifyHumanHandoff(conversation.id, reason);
  }

  const sendResult = await getChannelAdapter(channel.type).sendTextMessage({ channel, to: channelUserId, text: result.content });
  if (!sendResult.ok) {
    // El mensaje de la IA ya quedó guardado en el historial (con el texto real, no el error):
    // lo único que falló fue la entrega. En vez de dejar la conversación en el limbo sin que
    // nadie se entere, se deriva a un humano — el cliente no debería quedarse esperando una
    // respuesta que nunca va a llegar sin que nadie de tu equipo lo note.
    const reason = `No se pudo entregar la respuesta del agente por ${channel.type} (${sendResult.error ?? "falla de conexión"}) — revisar el canal.`;
    await prisma.channel.update({ where: { id: channel.id }, data: { lastError: sendResult.error ?? "Error de entrega" } });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "HANDED_OFF", aiPaused: true },
    });
    await prisma.humanHandoff.create({ data: { conversationId: conversation.id, fromAgentId: agent.id, reason } });
    await notifyHumanHandoff(conversation.id, reason);
    return { conversation, autoReplied: false as const };
  }

  return { conversation, autoReplied: true as const, reply: result.content, handedOff: result.shouldHandoff };
}
