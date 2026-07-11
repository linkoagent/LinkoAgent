import OpenAI from "openai";
import { normalizeWords } from "@/lib/ai/embeddings";
import { detectIntent } from "@/lib/ai/heuristics";
import { RateLimitError } from "@/lib/ai/errors";
import type { ToolDefinition } from "@/lib/ai/tools/types";

export const AI_MOCK = !process.env.GROQ_API_KEY || process.env.AI_MOCK_MODE === "true";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Groq expone una API compatible con el SDK de OpenAI, así que reutilizamos el mismo
// cliente apuntando a su baseURL en vez de reescribir la integración.
let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
  return client;
}

export interface ChatToolCall {
  id: string;
  name: string;
  /** JSON string sin parsear — cada tool valida/parsea sus propios argumentos. */
  arguments: string;
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; toolCalls?: ChatToolCall[] }
  | { role: "tool"; content: string; toolCallId: string };

export interface ChatResult {
  content: string;
  toolCalls?: ChatToolCall[];
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  model: string;
}

// Groq no cobra por el tier gratuito que usamos, así que el costo estimado queda en 0.
// Si en algún momento se pasa a un plan pago de Groq (u otro proveedor), actualizar acá.
const PRICING: Record<string, { input: number; output: number }> = {
  default: { input: 0, output: 0 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number) {
  const p = PRICING[model] ?? PRICING.default;
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}

function toOpenAITools(tools: ToolDefinition[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters as unknown as Record<string, unknown> },
  }));
}

function toOpenAIMessages(messages: ChatMessage[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return messages.map((m): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
    }
    if (m.role === "assistant") {
      return {
        role: "assistant",
        content: m.content,
        ...(m.toolCalls?.length
          ? { tool_calls: m.toolCalls.map((tc) => ({ id: tc.id, type: "function" as const, function: { name: tc.name, arguments: tc.arguments } })) }
          : {}),
      };
    }
    return { role: m.role, content: m.content };
  });
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

/** Fecha/hora de mañana a una hora fija, en formato naive local — solo para ejercitar el loop
 * de tool-calling en modo simulado, no necesita ser precisa de verdad. */
function mockGuessTomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T${String(hour).padStart(2, "0")}:00:00`;
}

/** Sintetiza un tool_call determinístico en base a la intención detectada por heurística, para
 * poder probar el loop completo (ejecución de tools reales) sin GROQ_API_KEY. */
function mockToolCall(lastUserText: string, tools: ToolDefinition[]): ChatToolCall[] | null {
  const intent = detectIntent(lastUserText);
  const hasTool = (name: string) => tools.some((t) => t.name === name);

  if (intent === "reserva" && hasTool("check_availability")) {
    return [{ id: "mock-tool-1", name: "check_availability", arguments: JSON.stringify({ startsAt: mockGuessTomorrowAt(10) }) }];
  }
  if (intent === "cancelacion" && hasTool("cancel_appointment")) {
    return [{ id: "mock-tool-1", name: "cancel_appointment", arguments: JSON.stringify({}) }];
  }
  return null;
}

function summarizeToolResultMock(toolContent: string): string {
  try {
    const data = JSON.parse(toolContent);
    if (data.booked) return `Listo, quedó reservado para ${data.startsAt}.`;
    if (data.available === true) return `Ese horario está libre (${data.startsAt}).`;
    if (data.available === false) return `Ese horario no está disponible (${data.reason ?? ""}).`;
    if (data.cancelled) return `Cancelé el turno del ${data.startsAt}.`;
    if (data.rescheduled) return `Reprogramé el turno para ${data.startsAt}.`;
    if (data.found === 0) return "No encontré ningún turno activo para cancelar/reprogramar.";
    if (typeof data.found === "number" && data.found > 1) return "Tenés más de un turno activo, decime cuál.";
    if (data.error) return `No pude completar la acción: ${data.error}`;
  } catch {
    // sigue al mensaje genérico
  }
  return "Ya procesé tu pedido.";
}

function isUserMessage(m: ChatMessage): m is ChatMessage & { role: "user" } {
  return m.role === "user";
}

function mockReply(messages: ChatMessage[], tools?: ToolDefinition[]): ChatResult {
  const promptTokens = Math.round(messages.reduce((s, m) => s + (m.content?.length ?? 0), 0) / 4);

  const hasToolResult = messages.some((m) => m.role === "tool");
  if (tools?.length && !hasToolResult) {
    const lastUser = [...messages].reverse().find(isUserMessage);
    const toolCalls = lastUser ? mockToolCall(lastUser.content, tools) : null;
    if (toolCalls) {
      return { content: "", toolCalls, promptTokens, completionTokens: 0, totalTokens: promptTokens, costUsd: 0, model: "mock" };
    }
  }

  if (hasToolResult) {
    const toolMsg = [...messages].reverse().find((m) => m.role === "tool")!;
    const content = `(modo simulado) ${summarizeToolResultMock(toolMsg.content)}`;
    const completionTokens = Math.round(content.length / 4);
    return { content, promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, costUsd: 0, model: "mock" };
  }

  const lastUser = [...messages].reverse().find(isUserMessage);
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const knowledgeMatch = system.match(/CONOCIMIENTO:\n([\s\S]*?)(\n\n[A-ZÁÉÍÓÚ ]+:|$)/);
  const knowledgeBlock = knowledgeMatch?.[1];

  let content: string;
  if (knowledgeBlock && lastUser) {
    const entry = bestKnowledgeEntry(knowledgeBlock, lastUser.content);
    if (entry) {
      const answer = entry.match(/Respuesta:\s*([\s\S]+)/i)?.[1]?.trim() ?? entry;
      content = `(modo simulado) ${answer} ¿Te sirve o preferís que te derive con una persona del equipo?`;
    } else {
      content = `(modo simulado) Recibí tu mensaje: "${lastUser?.content ?? ""}". Todavía no tengo suficiente información cargada — probá sumar contenido en la Base de Conocimiento para que pueda responder mejor.`;
    }
  } else {
    content = `(modo simulado) Recibí tu mensaje: "${lastUser?.content ?? ""}". Todavía no tengo suficiente información cargada — probá sumar contenido en la Base de Conocimiento para que pueda responder mejor.`;
  }

  const completionTokens = Math.round(content.length / 4);
  return { content, promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, costUsd: 0, model: "mock" };
}

const INLINE_FUNCTION_CALL_REGEX = /<function=([a-zA-Z_][a-zA-Z0-9_]*)(\{[\s\S]*?\})<\/function>/g;

/**
 * Groq/Llama a veces "alucina" el formato de la llamada a función como texto plano
 * (`<function=nombre{"arg":"valor"}</function>`) en vez de emitirla en el campo estructurado
 * `tool_calls`. Pasa de dos formas distintas: (a) Groq rechaza la respuesta entera con 400
 * `tool_use_failed` pero incluye el texto en `error.failed_generation`, o (b) — más grave y
 * silenciosa — Groq devuelve un 200 normal con esta sintaxis cruda mezclada dentro del `content`
 * visible, que sin este chequeo se le manda al cliente tal cual por WhatsApp. En ambos casos el
 * modelo sí eligió bien la función y los argumentos, solo falló el formato de vuelta — se
 * recupera el tool_call y se saca el texto crudo de lo que ve el cliente.
 */
function extractInlineFunctionCalls(text: string): ChatToolCall[] {
  const calls: ChatToolCall[] = [];
  let match: RegExpExecArray | null;
  let i = 0;
  const regex = new RegExp(INLINE_FUNCTION_CALL_REGEX);
  while ((match = regex.exec(text)) !== null) {
    calls.push({ id: `recovered-${Date.now()}-${i++}`, name: match[1], arguments: match[2] });
  }
  return calls;
}

function stripInlineFunctionCalls(text: string): string {
  return text.replace(new RegExp(INLINE_FUNCTION_CALL_REGEX), "").trim();
}

export async function chatComplete(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResult> {
  if (AI_MOCK) return mockReply(messages, tools);

  let res;
  try {
    res = await getClient().chat.completions.create({
      model: MODEL,
      messages: toOpenAIMessages(messages),
      temperature: 0.4,
      ...(tools?.length ? { tools: toOpenAITools(tools), tool_choice: "auto" } : {}),
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError && err.status === 429) {
      throw new RateLimitError("groq", "Se alcanzó el límite de uso gratuito de Groq (rate limit), no el límite de conversaciones del plan.");
    }
    if (err instanceof OpenAI.APIError && err.status === 400 && (err as { code?: string }).code === "tool_use_failed") {
      const failedGeneration = (err as { error?: { failed_generation?: string } }).error?.failed_generation;
      const recoveredCalls = typeof failedGeneration === "string" ? extractInlineFunctionCalls(failedGeneration) : [];
      if (recoveredCalls.length > 0) {
        return {
          content: "",
          toolCalls: recoveredCalls,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          model: MODEL,
        };
      }
    }
    throw err;
  }

  const promptTokens = res.usage?.prompt_tokens ?? 0;
  const completionTokens = res.usage?.completion_tokens ?? 0;
  const choice = res.choices[0];
  const structuredToolCalls = choice?.message?.tool_calls
    ?.filter((tc) => tc.type === "function")
    .map((tc) => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }));

  const rawContent = choice?.message?.content ?? "";
  // A veces Groq NO tira error: devuelve 200 con esta sintaxis cruda mezclada adentro del
  // content normal. Si no se detecta acá, esto se manda tal cual al cliente por WhatsApp.
  const inlineToolCalls = extractInlineFunctionCalls(rawContent);
  const content = inlineToolCalls.length > 0 ? stripInlineFunctionCalls(rawContent) : rawContent;
  const toolCalls = [...(structuredToolCalls ?? []), ...inlineToolCalls];

  return {
    content,
    toolCalls: toolCalls.length ? toolCalls : undefined,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    costUsd: estimateCost(MODEL, promptTokens, completionTokens),
    model: MODEL,
  };
}
