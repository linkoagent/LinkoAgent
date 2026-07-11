"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { addFaqKnowledgeEntry } from "@/lib/ai/knowledge";

/** Busca el mensaje del cliente inmediatamente anterior a un mensaje de la IA, para guardar
 * "qué pregunta disparó esta respuesta" junto con la corrección/aprobación. */
async function findTriggeringCustomerMessage(conversationId: string, aiMessageCreatedAt: Date) {
  return prisma.message.findFirst({
    where: { conversationId, sender: "CUSTOMER", createdAt: { lte: aiMessageCreatedAt } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Corrige una respuesta incorrecta de la IA. A diferencia de aprobar, esto sí "enseña" algo
 * nuevo: la corrección queda guardada como un dato de la base de conocimiento (misma función que
 * usa el tool add_knowledge_fact), para que la próxima vez que alguien pregunte algo parecido el
 * agente responda con la versión corregida.
 */
export async function correctMessage(messageId: string, correctedContent: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const message = await prisma.message.findFirst({
    where: { id: messageId, sender: "AI", conversation: { companyId: ctx.companyId } },
    include: { conversation: true },
  });
  if (!message) return { ok: false as const, error: "Mensaje no encontrado." };

  const trimmed = correctedContent.trim();
  if (!trimmed) return { ok: false as const, error: "Falta el texto corregido." };

  const triggeringMessage = await findTriggeringCustomerMessage(message.conversationId, message.createdAt);

  await prisma.messageCorrection.create({
    data: {
      companyId: ctx.companyId,
      agentId: message.conversation.agentId,
      conversationId: message.conversationId,
      messageId: message.id,
      type: "CORRECTION",
      customerMessage: triggeringMessage?.content ?? "",
      originalContent: message.content,
      correctedContent: trimmed,
      createdByUserId: ctx.userId,
    },
  });

  if (message.conversation.agentId) {
    await addFaqKnowledgeEntry({
      companyId: ctx.companyId,
      agentId: message.conversation.agentId,
      topic: triggeringMessage?.content.slice(0, 80) || `Corrección ${new Date().toISOString()}`,
      content: `Pregunta: ${triggeringMessage?.content ?? "(sin registrar)"}\nRespuesta correcta: ${trimmed}`,
    });
  }

  revalidatePath(`/inbox/${message.conversationId}`);
  revalidatePath("/knowledge");
  return { ok: true as const };
}

/** Aprobar solo deja un registro de que esa respuesta estuvo bien — no genera conocimiento nuevo
 * (aprobar no le enseña nada a la IA que no supiera ya), es una marca de calidad/historial. */
export async function approveMessage(messageId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const message = await prisma.message.findFirst({
    where: { id: messageId, sender: "AI", conversation: { companyId: ctx.companyId } },
    include: { conversation: true },
  });
  if (!message) return { ok: false as const, error: "Mensaje no encontrado." };

  const triggeringMessage = await findTriggeringCustomerMessage(message.conversationId, message.createdAt);

  await prisma.messageCorrection.create({
    data: {
      companyId: ctx.companyId,
      agentId: message.conversation.agentId,
      conversationId: message.conversationId,
      messageId: message.id,
      type: "APPROVAL",
      customerMessage: triggeringMessage?.content ?? "",
      originalContent: message.content,
      createdByUserId: ctx.userId,
    },
  });

  revalidatePath(`/inbox/${message.conversationId}`);
  return { ok: true as const };
}
