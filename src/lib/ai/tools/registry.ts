import type { Agent } from "@prisma/client";
import { hasConnectedProvider } from "@/lib/agenda/providerFactory";
import { CALENDAR_TOOLS } from "./calendar";
import { INVENTORY_TOOLS } from "./inventory";
import { KNOWLEDGE_BASE_TOOLS } from "./knowledgeBase";
import { BUSINESS_TOOLS } from "./business";
import type { ToolDefinition } from "./types";

/**
 * Qué familias de tools están habilitadas para este agente, como lista de chequeos (no un `if`
 * hardcodeado) para que sumar la próxima familia de acciones no implique tocar el loop de
 * ejecución ni agentEngine.ts.
 */
export async function getToolsForAgent(agent: Agent): Promise<ToolDefinition[]> {
  if (!agent.actionsEnabled) return [];

  const tools: ToolDefinition[] = [];

  if (await hasConnectedProvider(agent.companyId)) {
    tools.push(...CALENDAR_TOOLS);
  }

  // Stock no depende de ninguna integración externa (todo vive en Product, local) — se ofrece
  // siempre que el agente tenga acciones habilitadas. La mutación (update_stock) igual queda
  // bloqueada dentro del propio tool si quien escribe no es un teléfono de staff autorizado.
  tools.push(...INVENTORY_TOOLS);

  // Igual que stock: vive 100% local (KnowledgeSource/KnowledgeChunk), sin integración externa.
  // Las mutaciones (add/update/delete) quedan bloqueadas dentro de cada tool si quien escribe no
  // es un teléfono de staff autorizado.
  tools.push(...KNOWLEDGE_BASE_TOOLS);

  // Envío de email (Resend, ya en modo mock si falta RESEND_API_KEY) — igual que el resto,
  // bloqueado a staff dentro del propio tool.
  tools.push(...BUSINESS_TOOLS);

  return tools;
}
