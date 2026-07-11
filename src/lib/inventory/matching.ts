import { normalizeWords } from "@/lib/ai/embeddings";
import type { InventoryItem } from "./types";

/** Busca por nombre entre ítems ya cargados en memoria: primero substring (case-insensitive),
 * si no hay resultados cae a superposición de palabras (mismo criterio que bestKnowledgeEntry en
 * provider.ts). Función pura sobre un array — así el desambiguado ({found:N, products:[...]})
 * es idéntico sin importar si los ítems vienen de Postgres o de una Google Sheet. */
export function matchInventoryItems(items: InventoryItem[], query: string): InventoryItem[] {
  const lowerQuery = query.toLowerCase();
  const direct = items.filter((i) => i.name.toLowerCase().includes(lowerQuery));
  if (direct.length > 0) return direct.slice(0, 5);

  const queryWords = new Set(normalizeWords(query));
  const scored = items
    .map((item) => ({ item, score: normalizeWords(item.name).filter((w) => queryWords.has(w)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.item);
}
