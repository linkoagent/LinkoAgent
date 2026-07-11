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

/**
 * Se tira cuando falla el token de una integración externa (Google Calendar, etc.): revocado,
 * expirado, o refresh_token inválido. Nunca debe propagarse sin capturar desde la ejecución de
 * un tool — quien la atrapa marca la Integration como ERROR y devuelve un resultado de texto
 * para que el modelo se lo explique al cliente o dispare handoff.
 */
export class IntegrationAuthError extends Error {
  constructor(public provider: string, message: string) {
    super(message);
    this.name = "IntegrationAuthError";
  }
}
