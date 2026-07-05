/**
 * Detección de sentimiento e intención por reglas simples (sin costo de API).
 * Es deliberadamente heurístico para el MVP; se puede reemplazar más adelante
 * por una clasificación con el mismo modelo de chat si hace falta más precisión.
 */

export type Sentiment = "positivo" | "neutral" | "negativo";

const NEGATIVE_WORDS = [
  "mal",
  "pesimo",
  "pésimo",
  "horrible",
  "enojado",
  "molesto",
  "reclamo",
  "no funciona",
  "estafa",
  "terrible",
  "nunca mas",
];

const POSITIVE_WORDS = ["gracias", "genial", "excelente", "buenisimo", "buenísimo", "perfecto", "me encanta", "genio"];

export function detectSentiment(text: string): Sentiment {
  const t = text.toLowerCase();
  if (NEGATIVE_WORDS.some((w) => t.includes(w))) return "negativo";
  if (POSITIVE_WORDS.some((w) => t.includes(w))) return "positivo";
  return "neutral";
}

const INTENT_PATTERNS: [RegExp, string][] = [
  [/precio|costo|cu[aá]nto sale|presupuesto|vale/i, "consulta_precio"],
  [/turno|reserva|reservar|cita|agendar/i, "reserva"],
  [/horario|abren|cierran|atienden/i, "horarios"],
  [/cancelar|dar de baja|anular/i, "cancelacion"],
  [/hola|buen[oa]s|que tal/i, "saludo"],
  [/humano|persona real|hablar con alguien/i, "pedido_humano"],
];

export function detectIntent(text: string): string {
  for (const [pattern, intent] of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return "consulta_general";
}

const HANDOFF_TRIGGERS = [
  "hablar con una persona",
  "quiero un humano",
  "atencion urgente",
  "atención urgente",
  "reclamo",
  "cancelar",
  "estafa",
  "quiero hablar con alguien",
];

export function shouldHandoffToHuman(text: string, extraRules?: string | null): boolean {
  const t = text.toLowerCase();
  if (HANDOFF_TRIGGERS.some((w) => t.includes(w))) return true;
  if (extraRules) {
    const customKeywords = extraRules
      .toLowerCase()
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (customKeywords.some((k) => t.includes(k))) return true;
  }
  return false;
}
