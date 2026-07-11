/** Convierte cualquier excepción en el resultado JSON que se le devuelve al modelo, y la loguea
 * antes: el catch de cada tool nunca deja propagar el error (así lo exige ToolDefinition), pero
 * eso significa que sin este log el error real queda invisible tanto en Vercel como en el modelo,
 * que solo ve un mensaje genérico. */
export function toolErrorResult(toolName: string, err: unknown): Record<string, unknown> {
  console.error(`[tools:${toolName}] Error inesperado:`, err);
  return { error: err instanceof Error ? err.message : "Error desconocido" };
}
