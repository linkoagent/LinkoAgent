import { normalizeWords } from "@/lib/ai/embeddings";
import type { InventoryItem } from "./types";

/** Heurística simple de singular/plural en español (no un stemmer completo): "sillas" -> "silla",
 * "azules" -> "azul", "colores" -> "color". Sin esto, "¿tenés sillas azules?" no matchea un
 * producto cargado como "Silla azul" porque normalizeWords compara palabras exactas. */
function singularize(word: string): string {
  if (word.length > 4 && word.endsWith("es") && !/[aeiou]$/.test(word.slice(0, -2))) {
    return word.slice(0, -2);
  }
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function normalizeWordsForMatching(text: string): string[] {
  return normalizeWords(text).map(singularize);
}

/** Busca por nombre entre ítems ya cargados en memoria: primero substring (case-insensitive),
 * si no hay resultados cae a superposición de palabras (mismo criterio que bestKnowledgeEntry en
 * provider.ts), tolerando diferencias simples de singular/plural. Función pura sobre un array —
 * así el desambiguado ({found:N, products:[...]}) es idéntico sin importar si los ítems vienen
 * de Postgres o de una Google Sheet. */
export function matchInventoryItems(items: InventoryItem[], query: string): InventoryItem[] {
  const lowerQuery = query.toLowerCase();
  const direct = items.filter((i) => i.name.toLowerCase().includes(lowerQuery));
  if (direct.length > 0) return direct.slice(0, 5);

  const queryWords = new Set(normalizeWordsForMatching(query));
  const scored = items
    .map((item) => ({ item, score: normalizeWordsForMatching(item.name).filter((w) => queryWords.has(w)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.item);
}
