import type { Agent, Message } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { chatComplete, type ChatMessage, type ChatResult } from "@/lib/ai/provider";
import { runWithTools } from "@/lib/ai/toolRuntime";
import { getToolsForAgent } from "@/lib/ai/tools/registry";
import { shouldHandoffToHuman } from "@/lib/ai/heuristics";
import { AGENT_TYPE_LABELS } from "@/lib/plans";
import type { KnowledgeMatch } from "@/lib/ai/knowledge";

function buildSystemPrompt(agent: Agent, knowledgeChunks: KnowledgeMatch[], timezone: string, hasActions: boolean) {
  const knowledgeBlock = knowledgeChunks.length
    ? `CONOCIMIENTO:\n${knowledgeChunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")}`
    : null;

  // Imprescindible para que el modelo resuelva "mañana"/"el viernes que viene" correctamente
  // cuando usa los tools de turnos — sin esto no tiene forma de saber qué día es hoy.
  const now = formatInTimeZone(new Date(), timezone, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  const dateContext = `Fecha y hora actual: ${now} (zona horaria ${timezone}). Cuando uses tools de turnos, resolvé siempre fechas relativas ("mañana", "el viernes que viene") contra esta fecha, y pasá el parámetro de fecha/hora en formato YYYY-MM-DDTHH:mm:ss, sin offset de zona (se interpreta como hora local de la empresa).`;

  return [
    `Sos "${agent.name}", un agente de IA de tipo "${AGENT_TYPE_LABELS[agent.type] ?? agent.type}" que atiende por chat en nombre de una empresa.`,
    agent.objective ? `Objetivo: ${agent.objective}` : null,
    agent.tone ? `Tono de voz: ${agent.tone}` : null,
    `Instrucciones específicas: ${agent.instructions}`,
    agent.handoffRules ? `Reglas de derivación a un humano: ${agent.handoffRules}` : null,
    knowledgeBlock,
    hasActions ? dateContext : null,
    `Respondé siempre en ${agent.language === "es" ? "español rioplatense" : agent.language}, de forma breve, clara y cordial. Si no tenés información suficiente para responder con precisión, decilo con honestidad en vez de inventar datos, y proponé derivar a una persona del equipo.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export interface AgentRunResult extends ChatResult {
  shouldHandoff: boolean;
}

export async function runAgentOnMessage(params: {
  agent: Agent;
  knowledgeChunks: KnowledgeMatch[];
  history: Pick<Message, "sender" | "content">[];
  customerMessage: string;
  customerId?: string;
  conversationId?: string;
  customerPhone?: string;
}): Promise<AgentRunResult> {
  const { agent, knowledgeChunks, history, customerMessage, customerId, conversationId, customerPhone } = params;

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: agent.companyId },
    select: { timezone: true, businessHours: true, staffPhoneNumbers: true },
  });
  const staffPhoneNumbers = (company.staffPhoneNumbers ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const tools = await getToolsForAgent(agent);
  const systemPrompt = buildSystemPrompt(agent, knowledgeChunks, company.timezone, tools.length > 0);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map(
      (m): ChatMessage => ({
        role: m.sender === "CUSTOMER" ? "user" : "assistant",
        content: m.content,
      })
    ),
    { role: "user", content: customerMessage },
  ];

  const result = tools.length
    ? await runWithTools({
        messages,
        tools,
        context: {
          companyId: agent.companyId,
          agentId: agent.id,
          customerId: customerId ?? null,
          conversationId: conversationId ?? null,
          customerPhone: customerPhone ?? null,
          staffPhoneNumbers,
          timezone: company.timezone,
          businessHours: company.businessHours,
        },
      })
    : await chatComplete(messages);

  const shouldHandoff = shouldHandoffToHuman(customerMessage, agent.handoffRules);

  return { ...result, shouldHandoff };
}

/** Resumen interno de un audio transcripto largo (no se le manda al cliente, es solo para que
 * el equipo pueda escanear la conversación rápido en el Inbox sin leer la transcripción entera). */
export async function summarizeVoiceTranscript(transcript: string): Promise<string> {
  const result = await chatComplete([
    {
      role: "system",
      content: "Resumí el siguiente audio transcripto de un cliente en 1-2 oraciones, en español, mencionando el pedido o consulta concreta.",
    },
    { role: "user", content: transcript },
  ]);
  return result.content;
}

export async function summarizeMessages(messages: Pick<Message, "sender" | "content">[]): Promise<string> {
  const transcript = messages
    .map((m) => `${m.sender === "CUSTOMER" ? "Cliente" : m.sender === "AI" ? "Agente IA" : m.sender === "HUMAN" ? "Agente humano" : "Sistema"}: ${m.content}`)
    .join("\n");

  const result = await chatComplete([
    {
      role: "system",
      content:
        "Resumí la siguiente conversación de atención al cliente en máximo 3 oraciones, en español, mencionando el motivo de contacto y cómo quedó la situación.",
    },
    { role: "user", content: transcript },
  ]);

  return result.content;
}
