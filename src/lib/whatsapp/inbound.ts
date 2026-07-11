import type { Channel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectIntent, detectSentiment } from "@/lib/ai/heuristics";
import { searchKnowledge } from "@/lib/ai/knowledge";
import { runAgentOnMessage, summarizeVoiceTranscript } from "@/lib/ai/agentEngine";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media";
import { transcribeAudio, TRANSCRIPTION_SUMMARY_THRESHOLD } from "@/lib/ai/transcription";
import { registerNewConversationUsage } from "@/lib/billing";
import { RateLimitError } from "@/lib/ai/errors";
import { notifyHumanHandoff } from "@/lib/notifications";

export interface InboundWhatsAppMessage {
  channel: Channel;
  fromPhone: string;
  fromName?: string | null;
  text: string;
  audio?: { mediaId: string; mimeType: string };
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
  audio,
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

  let transcription: { text: string; language: string | null; confidence: number | null } | null = null;
  if (audio) {
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

  let result;
  try {
    const knowledgeChunks = await searchKnowledge(agent.id, channel.companyId, text);
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 21,
    });

    result = await runAgentOnMessage({
      agent,
      knowledgeChunks,
      history: history.slice(0, -1),
      customerMessage: text,
      customerId: customer.id,
      conversationId: conversation.id,
      customerPhone: fromPhone,
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      const reason = `Se derivó a un humano porque se alcanzó el límite de uso gratuito de ${err.provider === "groq" ? "Groq" : "Gemini"} (no es el límite de conversaciones del plan).`;
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: "HANDED_OFF", aiPaused: true },
      });
      await prisma.humanHandoff.create({ data: { conversationId: conversation.id, reason } });
      await notifyHumanHandoff(conversation.id, reason);
      return { conversation, autoReplied: false as const };
    }
    throw err;
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

  try {
    await sendWhatsAppMessage({ channel, to: fromPhone, text: result.content });
  } catch (err) {
    // El mensaje de la IA ya quedó guardado en el historial (con el texto real, no el error):
    // lo único que falló fue la entrega por WhatsApp. En vez de dejar la conversación en el
    // limbo sin que nadie se entere, se deriva a un humano — el cliente no debería quedarse
    // esperando una respuesta que nunca va a llegar sin que nadie de tu equipo lo note.
    const error = err instanceof Error ? err.message : "Error enviando el mensaje por WhatsApp";
    const reason = "No se pudo entregar la respuesta del agente por WhatsApp (falla de conexión con Meta) — revisar el canal.";
    await prisma.channel.update({ where: { id: channel.id }, data: { lastError: error } });
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
