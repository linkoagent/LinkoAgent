/**
 * Se tira cuando Groq o Gemini devuelven 429 (límite de uso gratuito alcanzado). Es un tipo
 * distinto del límite de conversaciones del plan, para poder diferenciar el motivo real de la
 * derivación a humano en cada caso.
 */
export class RateLimitError extends Error {
  constructor(public provider: "groq" | "gemini", message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}
