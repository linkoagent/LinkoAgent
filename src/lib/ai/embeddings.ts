// Embeddings de Google Gemini (capa gratuita, sin tarjeta). text-embedding-004 devuelve
// vectores de 768 dimensiones — si se cambia de modelo/proveedor, EMBEDDING_DIM y la columna
// "vector(768)" en KnowledgeChunk tienen que quedar en sintonía.
export const EMBEDDING_DIM = 768;
export const AI_MOCK = !process.env.GOOGLE_API_KEY || process.env.AI_MOCK_MODE === "true";

const GEMINI_EMBEDDING_MODEL = process.env.GOOGLE_EMBEDDING_MODEL || "text-embedding-004";

/**
 * Embedding determinístico (hash de caracteres) solo para desarrollo sin API key.
 * No tiene significado semántico real: sirve para ejercitar el pipeline (guardar,
 * consultar por similaridad coseno), no para relevancia real. Se reemplaza solo
 * por embeddings de Gemini en cuanto se carga GOOGLE_API_KEY.
 */
function mockEmbedding(text: string): number[] {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 7)) % EMBEDDING_DIM;
    vec[idx] += (text.charCodeAt(i) % 13) - 6;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export async function embedText(text: string): Promise<number[]> {
  if (AI_MOCK) return mockEmbedding(text);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text: text.slice(0, 8000) }] } }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini embeddings failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** Normaliza texto a una lista de palabras (sin acentos/puntuación) para comparar por superposición. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/** Parte un texto largo en fragmentos por párrafo, con un tamaño máximo aproximado. */
export function chunkText(content: string, maxLen = 800): string[] {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && (current + "\n\n" + p).length > maxLen) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [content.trim()].filter(Boolean);
}
