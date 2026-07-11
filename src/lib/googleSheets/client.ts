import type { Integration } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { IntegrationAuthError } from "@/lib/ai/errors";

export const GOOGLE_SHEETS_PROVIDER = "GOOGLE_SHEETS" as const;
export const GOOGLE_SHEETS_OAUTH_STATE_COOKIE = "google_sheets_oauth_state";

// Mismas credenciales que Google Calendar: son de un proyecto de Google Cloud genérico (no
// específicas de Calendar pese al nombre), así que se reusan para no pedirle al usuario que
// cargue otra variable más en Vercel.
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

// Override independiente del de Calendar: como GOOGLE_CALENDAR_CLIENT_ID ya está seteado real en
// producción, sin esto Sheets quedaría real desde el día uno sin poder probarlo en modo mock.
export const GOOGLE_SHEETS_MOCK = !CLIENT_ID || process.env.GOOGLE_SHEETS_MOCK_MODE === "true";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "openid", "email"];

function redirectUri() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/integrations/google-sheets/callback`;
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID || "",
      client_secret: CLIENT_SECRET || "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_SHEETS_PROVIDER, `No se pudo intercambiar el código de Google (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID || "",
      client_secret: CLIENT_SECRET || "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_SHEETS_PROVIDER, `Token de Google Sheets inválido o revocado (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function fetchAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.email ?? null;
}

/** Devuelve un access token válido, refrescándolo (y persistiéndolo) si está por vencer. */
export async function getValidAccessToken(integration: Integration): Promise<string> {
  if (GOOGLE_SHEETS_MOCK) return "mock-access-token";

  const expiresAt = integration.tokenExpiresAt?.getTime() ?? 0;
  const needsRefresh = !integration.accessToken || expiresAt < Date.now() + 2 * 60 * 1000;
  if (!needsRefresh) return integration.accessToken!;

  if (!integration.refreshToken) {
    throw new IntegrationAuthError(GOOGLE_SHEETS_PROVIDER, "No hay refresh token guardado; hay que reconectar Google Sheets.");
  }

  try {
    const tokens = await refreshAccessToken(integration.refreshToken);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await prisma.integration.update({
      where: { id: integration.id },
      data: { accessToken: tokens.access_token, tokenExpiresAt: newExpiresAt, status: "CONNECTED", lastError: null },
    });
    return tokens.access_token;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.integration.update({ where: { id: integration.id }, data: { status: "ERROR", lastError: message } });
    throw err;
  }
}

export interface SheetValues {
  values: string[][];
}

/** GET .../values/{range} — sin body. `values` puede venir más corto que el rango pedido (filas
 * vacías al final) y celdas intermedias faltar en el array de esa fila; quien llame no debe
 * asumir longitud fija por fila. */
export async function getValuesRange(spreadsheetId: string, range: string, accessToken: string): Promise<string[][]> {
  if (GOOGLE_SHEETS_MOCK) return [];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_SHEETS_PROVIDER, `No se pudo leer la planilla (${res.status}): ${await res.text()}`);
  }
  const data: SheetValues = await res.json();
  return data.values ?? [];
}

/** PUT .../values/{range}?valueInputOption=USER_ENTERED — actualiza una celda/rango puntual sin
 * reescribir el resto de la hoja. */
export async function updateRange(spreadsheetId: string, range: string, values: unknown[][], accessToken: string): Promise<void> {
  if (GOOGLE_SHEETS_MOCK) return;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ range, majorDimension: "ROWS", values }),
    }
  );
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_SHEETS_PROVIDER, `No se pudo actualizar la planilla (${res.status}): ${await res.text()}`);
  }
}
