import OpenAI from "openai";
import { normalizeWords } from "@/lib/ai/embeddings";

export const AI_MOCK = !process.env.OPENAI_API_KEY || process.env.AI_MOCK_MODE === "true";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  model: string;
}

// Precios de referencia aproximados (USD por 1M tokens). Ajustar si cambia el modelo/proveedor.
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  default: { input: 0.15, output: 0.6 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number) {
  const p = PRICING[model] ?? PRICING.default;
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}

/**
 * Busca, dentro del bloque de conocimiento recuperado, el fragmento (línea o
 * párrafo) que más palabras comparte con el último mensaje del cliente. Los
 * chunks reales pueden agrupar varias preguntas/respuestas juntas, así que no
 * alcanza con tomar la primera línea: hay que rankear dentro del bloque.
 */
function bestKnowledgeEntry(knowledgeBlock: string, query: string): string | null {
  const entries = knowledgeBlock
    .replace(/^\[\d+\]\s*/gm, "")
    .split(/\n\s*\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  if (entries.length === 0) return null;

  const queryWords = new Set(normalizeWords(query));
  let best = entries[0];
  let bestScore = -1;
  for (const entry of entries) {
    const score = normalizeWords(entry).filter((w) => queryWords.has(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best;
}

function mockReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const knowledgeMatch = system.match(/CONOCIMIENTO:\n([\s\S]*?)(\n\n[A-ZÁÉÍÓÚ ]+:|$)/);
  const knowledgeBlock = knowledgeMatch?.[1];

  if (knowledgeBlock && lastUser) {
    const entry = bestKnowledgeEntry(knowledgeBlock, lastUser.content);
    if (entry) {
      const answer = entry.match(/Respuesta:\s*([\s\S]+)/i)?.[1]?.trim() ?? entry;
      return `(modo simulado) ${answer} ¿Te sirve o preferís que te derive con una persona del equipo?`;
    }
  }
  return `(modo simulado) Recibí tu mensaje: "${lastUser?.content ?? ""}". Todavía no tengo suficiente información cargada — probá sumar contenido en la Base de Conocimiento para que pueda responder mejor.`;
}

export async function chatComplete(messages: ChatMessage[]): Promise<ChatResult> {
  if (AI_MOCK) {
    const content = mockReply(messages);
    const promptTokens = Math.round(messages.reduce((s, m) => s + m.content.length, 0) / 4);
    const completionTokens = Math.round(content.length / 4);
    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      costUsd: 0,
      model: "mock",
    };
  }

  const res = await getClient().chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.4,
  });

  const promptTokens = res.usage?.prompt_tokens ?? 0;
  const completionTokens = res.usage?.completion_tokens ?? 0;

  return {
    content: res.choices[0]?.message?.content ?? "",
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    costUsd: estimateCost(MODEL, promptTokens, completionTokens),
    model: MODEL,
  };
}
