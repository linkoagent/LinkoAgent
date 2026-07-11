import type { KnowledgeSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addFaqKnowledgeEntry, processKnowledgeSource } from "@/lib/ai/knowledge";
import { normalizeWords } from "@/lib/ai/embeddings";
import { isStaff } from "./authz";
import type { ToolDefinition } from "./types";

function toolErrorResult(err: unknown): Record<string, unknown> {
  return { error: err instanceof Error ? err.message : "Error desconocido" };
}

/** Busca, entre las fuentes de conocimiento vinculadas a ESTE agente, las que matchean un tema
 * por nombre (substring) o, si no hay match directo, por superposición de palabras en nombre o
 * contenido — mismo criterio que findProductsByName en tools/inventory.ts. */
async function findKnowledgeSourcesByTopic(agentId: string, companyId: string, topic: string): Promise<KnowledgeSource[]> {
  const links = await prisma.agentKnowledgeSource.findMany({ where: { agentId }, select: { sourceId: true } });
  const sourceIds = links.map((l) => l.sourceId);
  if (sourceIds.length === 0) return [];

  const direct = await prisma.knowledgeSource.findMany({
    where: { id: { in: sourceIds }, companyId, name: { contains: topic, mode: "insensitive" } },
    take: 5,
  });
  if (direct.length > 0) return direct;

  const all = await prisma.knowledgeSource.findMany({ where: { id: { in: sourceIds }, companyId } });
  const topicWords = new Set(normalizeWords(topic));
  const scored = all
    .map((s) => ({
      source: s,
      score: normalizeWords(`${s.name} ${s.content ?? ""}`).filter((w) => topicWords.has(w)).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.source);
}

export const addKnowledgeFactTool: ToolDefinition = {
  name: "add_knowledge_fact",
  description:
    "Agrega un dato nuevo a la base de conocimiento (una FAQ, un precio, una promo, un horario especial, etc.) para que la IA lo use en futuras respuestas. Solo puede ejecutarlo el dueño/staff autorizado.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Título corto del dato (ej: 'Precio torta de chocolate', 'Promo de verano')." },
      content: { type: "string", description: "El contenido completo del dato, en texto claro." },
    },
    required: ["topic", "content"],
  },
  async execute(args, ctx) {
    try {
      if (!isStaff(ctx)) {
        return { error: "Esta acción solo la puede ejecutar el dueño o el staff del negocio desde un número autorizado." };
      }

      const topic = String(args.topic ?? "").trim();
      const content = String(args.content ?? "").trim();
      if (!topic || !content) return { error: "Faltan el tema y/o el contenido." };

      await addFaqKnowledgeEntry({ companyId: ctx.companyId, agentId: ctx.agentId, topic, content });

      return { added: true, topic };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const updateKnowledgeFactTool: ToolDefinition = {
  name: "update_knowledge_fact",
  description:
    "Actualiza un dato existente de la base de conocimiento (reemplaza el contenido, no lo suma). Si hay más de un dato que matchea el tema, devuelve la lista para preguntar cuál antes de ejecutar de nuevo. Solo puede ejecutarlo el dueño/staff autorizado.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Tema o título (o parte de él) del dato a actualizar." },
      newContent: { type: "string", description: "El contenido nuevo completo, reemplaza al anterior." },
    },
    required: ["topic", "newContent"],
  },
  async execute(args, ctx) {
    try {
      if (!isStaff(ctx)) {
        return { error: "Esta acción solo la puede ejecutar el dueño o el staff del negocio desde un número autorizado." };
      }

      const topic = String(args.topic ?? "").trim();
      const newContent = String(args.newContent ?? "").trim();
      if (!topic || !newContent) return { error: "Faltan el tema y/o el contenido nuevo." };

      const matches = await findKnowledgeSourcesByTopic(ctx.agentId, ctx.companyId, topic);
      if (matches.length === 0) return { found: 0 };
      if (matches.length > 1) {
        return { found: matches.length, items: matches.map((s) => ({ topic: s.name })) };
      }

      const [source] = matches;
      await prisma.knowledgeSource.update({ where: { id: source.id }, data: { content: newContent } });
      await processKnowledgeSource(source.id);

      return { updated: true, topic: source.name };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const deleteKnowledgeFactTool: ToolDefinition = {
  name: "delete_knowledge_fact",
  description:
    "Elimina un dato de la base de conocimiento (ej: una promo que ya terminó). Si hay más de un dato que matchea el tema, devuelve la lista para preguntar cuál antes de ejecutar de nuevo. Solo puede ejecutarlo el dueño/staff autorizado.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Tema o título (o parte de él) del dato a eliminar." },
    },
    required: ["topic"],
  },
  async execute(args, ctx) {
    try {
      if (!isStaff(ctx)) {
        return { error: "Esta acción solo la puede ejecutar el dueño o el staff del negocio desde un número autorizado." };
      }

      const topic = String(args.topic ?? "").trim();
      if (!topic) return { error: "Falta el tema a eliminar." };

      const matches = await findKnowledgeSourcesByTopic(ctx.agentId, ctx.companyId, topic);
      if (matches.length === 0) return { found: 0 };
      if (matches.length > 1) {
        return { found: matches.length, items: matches.map((s) => ({ topic: s.name })) };
      }

      const [source] = matches;
      await prisma.knowledgeSource.delete({ where: { id: source.id } });

      return { deleted: true, topic: source.name };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const KNOWLEDGE_BASE_TOOLS: ToolDefinition[] = [addKnowledgeFactTool, updateKnowledgeFactTool, deleteKnowledgeFactTool];
