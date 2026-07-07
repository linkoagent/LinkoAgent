import { prisma } from "@/lib/prisma";
import { AI_MOCK, chunkText, embedText, normalizeWords, toVectorLiteral } from "@/lib/ai/embeddings";

/** Procesa una fuente de texto/FAQ: la parte en fragmentos y guarda sus embeddings. */
export async function processKnowledgeSource(sourceId: string) {
  const source = await prisma.knowledgeSource.findUniqueOrThrow({ where: { id: sourceId } });

  await prisma.knowledgeSource.update({ where: { id: sourceId }, data: { status: "PROCESSING" } });

  try {
    await prisma.knowledgeChunk.deleteMany({ where: { sourceId } });

    const rawText = source.content ?? "";
    const pieces = chunkText(rawText);

    for (const piece of pieces) {
      const chunk = await prisma.knowledgeChunk.create({
        data: {
          sourceId,
          companyId: source.companyId,
          content: piece,
          tokenCount: Math.round(piece.length / 4),
        },
      });
      const embedding = await embedText(piece);
      await prisma.$executeRawUnsafe(
        `UPDATE "KnowledgeChunk" SET embedding = $1::vector WHERE id = $2`,
        toVectorLiteral(embedding),
        chunk.id
      );
    }

    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: "READY", lastProcessedAt: new Date(), errorMessage: null },
    });
  } catch (err) {
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: "ERROR", errorMessage: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}

export interface KnowledgeMatch {
  id: string;
  content: string;
}

/**
 * Busca los fragmentos de conocimiento más relevantes para un agente.
 * Con Gemini configurado usa similaridad coseno real sobre pgvector;
 * en modo mock usa superposición de palabras (los embeddings simulados
 * no tienen significado semántico, así que buscar por ellos no serviría).
 */
export async function searchKnowledge(agentId: string, companyId: string, query: string, limit = 5): Promise<KnowledgeMatch[]> {
  const links = await prisma.agentKnowledgeSource.findMany({ where: { agentId }, select: { sourceId: true } });
  const sourceIds = links.map((l) => l.sourceId);
  if (sourceIds.length === 0) return [];

  if (AI_MOCK) {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { companyId, sourceId: { in: sourceIds } },
      select: { id: true, content: true },
      take: 300,
    });
    const queryWords = new Set(normalizeWords(query));
    const scored = chunks.map((c) => ({
      ...c,
      score: normalizeWords(c.content).filter((w) => queryWords.has(w)).length,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  const embedding = await embedText(query);
  const vectorLiteral = toVectorLiteral(embedding);
  const rows = await prisma.$queryRawUnsafe<KnowledgeMatch[]>(
    `SELECT id, content FROM "KnowledgeChunk"
     WHERE "companyId" = $1 AND "sourceId" = ANY($2::text[]) AND embedding IS NOT NULL
     ORDER BY embedding <=> $3::vector
     LIMIT $4`,
    companyId,
    sourceIds,
    vectorLiteral,
    limit
  );
  return rows;
}
