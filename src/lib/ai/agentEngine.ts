import type { Agent, Message } from "@prisma/client";
import { chatComplete, type ChatMessage, type ChatResult } from "@/lib/ai/provider";
import { shouldHandoffToHuman } from "@/lib/ai/heuristics";
import { AGENT_TYPE_LABELS } from "@/lib/plans";
import type { KnowledgeMatch } from "@/lib/ai/knowledge";

function buildSystemPrompt(agent: Agent, knowledgeChunks: KnowledgeMatch[]) {
  const knowledgeBlock = knowledgeChunks.length
    ? `CONOCIMIENTO:\n${knowledgeChunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")}`
    : null;

  return [
    `Sos "${agent.name}", un agente de IA de tipo "${AGENT_TYPE_LABELS[agent.type] ?? agent.type}" que atiende por chat en nombre de una empresa.`,
    agent.objective ? `Objetivo: ${agent.objective}` : null,
    agent.tone ? `Tono de voz: ${agent.tone}` : null,
    `Instrucciones específicas: ${agent.instructions}`,
    agent.handoffRules ? `Reglas de derivación a un humano: ${agent.handoffRules}` : null,
    knowledgeBlock,
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
}): Promise<AgentRunResult> {
  const { agent, knowledgeChunks, history, customerMessage } = params;

  const systemPrompt = buildSystemPrompt(agent, knowledgeChunks);

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

  const result = await chatComplete(messages);
  const shouldHandoff = shouldHandoffToHuman(customerMessage, agent.handoffRules);

  return { ...result, shouldHandoff };
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
