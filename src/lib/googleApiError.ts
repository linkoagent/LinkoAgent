interface GoogleErrorBody {
  error?: { code?: number; message?: string; status?: string };
}

/** Convierte una respuesta de error cruda de una API de Google (un JSON tipo
 * {error:{code,message,status}}) en un mensaje entendible en español — sin esto, el usuario veía
 * el JSON crudo de Google tal cual (ej. "Unable to parse range: Hoja1!A:Z"). */
export function friendlyGoogleApiError(status: number, bodyText: string, context: "calendario" | "planilla"): string {
  let parsed: GoogleErrorBody | null = null;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = null;
  }
  const message = parsed?.error?.message ?? "";
  const errStatus = parsed?.error?.status ?? "";

  if (status === 401 || errStatus === "UNAUTHENTICATED") {
    return `La conexión con Google expiró o fue revocada. Desconectá y volvé a conectar el ${context} desde Integraciones.`;
  }
  if (status === 403 || errStatus === "PERMISSION_DENIED") {
    return `La cuenta de Google conectada no tiene permiso para acceder a este ${context}. Revisá que sea la cuenta correcta.`;
  }
  if (status === 404 || errStatus === "NOT_FOUND") {
    return `No encontramos ese ${context} en Google. Revisá que el link o ID sea correcto.`;
  }
  if (/unable to parse range/i.test(message)) {
    return "No encontramos esa hoja dentro de la planilla. Puede que la hayas renombrado o borrado — probá sincronizar de nuevo.";
  }
  if (status === 429 || errStatus === "RESOURCE_EXHAUSTED") {
    return "Google está limitando las solicitudes por ahora. Esperá un momento y probá de nuevo.";
  }
  return `Hubo un problema al conectar con Google (código ${status}). Probá de nuevo en unos minutos, y si sigue avisanos.`;
}
