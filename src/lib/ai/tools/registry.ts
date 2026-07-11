import type { Agent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GOOGLE_CALENDAR_PROVIDER } from "@/lib/googleCalendar/client";
import { CALENDAR_TOOLS } from "./calendar";
import { INVENTORY_TOOLS } from "./inventory";
import type { ToolDefinition } from "./types";

/**
 * Qué familias de tools están habilitadas para este agente, como lista de chequeos (no un `if`
 * hardcodeado) para que sumar la próxima familia de acciones no implique tocar el loop de
 * ejecución ni agentEngine.ts.
 */
export async function getToolsForAgent(agent: Agent): Promise<ToolDefinition[]> {
  if (!agent.actionsEnabled) return [];

  const tools: ToolDefinition[] = [];

  const calendarIntegration = await prisma.integration.findUnique({
    where: { companyId_provider: { companyId: agent.companyId, provider: GOOGLE_CALENDAR_PROVIDER } },
  });
  if (calendarIntegration?.status === "CONNECTED") {
    tools.push(...CALENDAR_TOOLS);
  }

  // Stock no depende de ninguna integración externa (todo vive en Product, local) — se ofrece
  // siempre que el agente tenga acciones habilitadas. La mutación (update_stock) igual queda
  // bloqueada dentro del propio tool si quien escribe no es un teléfono de staff autorizado.
  tools.push(...INVENTORY_TOOLS);

  return tools;
}
