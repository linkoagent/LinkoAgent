import OpenAI, { toFile } from "openai";
import { RateLimitError } from "@/lib/ai/errors";

export const TRANSCRIPTION_MOCK = !process.env.GROQ_API_KEY || process.env.AI_MOCK_MODE === "true";
const MODEL = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";

/** A partir de este largo de transcripción se genera un resumen interno además del texto completo. */
export const TRANSCRIPTION_SUMMARY_THRESHOLD = 400;

// Mismo criterio que provider.ts: Groq expone un endpoint de transcripción (Whisper) compatible
// con el SDK de OpenAI, así que reutilizamos el mismo tipo de cliente apuntando a su baseURL.
let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
  return client;
}

export interface TranscriptionResult {
  text: string;
  language: string | null;
  /** Heurística 0-1 derivada de los log-probs de Whisper, no una probabilidad real de acierto. */
  confidence: number | null;
}

function mockTranscription(): TranscriptionResult {
  return {
    text: "(transcripción simulada) Hola, quería consultar por un turno para mañana a la tarde.",
    language: "es",
    confidence: 0.92,
  };
}

function guessExtension(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  return "ogg";
}

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
  if (TRANSCRIPTION_MOCK) return mockTranscription();

  const file = await toFile(buffer, `audio.${guessExtension(mimeType)}`, { type: mimeType });

  let res;
  try {
    res = await getClient().audio.transcriptions.create({
      file,
      model: MODEL,
      response_format: "verbose_json",
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError && err.status === 429) {
      throw new RateLimitError("groq", "Se alcanzó el límite de uso gratuito de Groq (transcripción de audio), no el límite de conversaciones del plan.");
    }
    throw err;
  }

  // El SDK tipa la respuesta genéricamente como { text }; con response_format:"verbose_json"
  // Groq además devuelve "language" y "segments" (con avg_logprob por segmento), sin tipado
  // propio en el SDK — se accede con un cast acotado a esta función.
  const verbose = res as unknown as { text: string; language?: string; segments?: Array<{ avg_logprob?: number }> };

  let confidence: number | null = null;
  if (verbose.segments?.length) {
    const avgLogprob = verbose.segments.reduce((s, seg) => s + (seg.avg_logprob ?? 0), 0) / verbose.segments.length;
    confidence = Math.max(0, Math.min(1, Math.exp(avgLogprob)));
  }

  return { text: verbose.text ?? "", language: verbose.language ?? null, confidence };
}
