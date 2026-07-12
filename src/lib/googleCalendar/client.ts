import type { Integration } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { IntegrationAuthError } from "@/lib/ai/errors";
import { friendlyGoogleApiError } from "@/lib/googleApiError";

export const GOOGLE_CALENDAR_PROVIDER = "GOOGLE_CALENDAR" as const;
export const GOOGLE_CALENDAR_OAUTH_STATE_COOKIE = "google_calendar_oauth_state";

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

// Sin credenciales reales (o con GOOGLE_CALENDAR_MOCK_MODE=true), todo el flujo queda simulado
// — mismo criterio que WHATSAPP_MOCK_MODE/AI_MOCK_MODE/EMAIL_MOCK_MODE. queryFreeBusy no llama a
// Google: la disponibilidad se resuelve solo contra los Appointment locales.
export const GOOGLE_CALENDAR_MOCK = !CLIENT_ID || process.env.GOOGLE_CALENDAR_MOCK_MODE === "true";

// calendar.events (solo eventos) no alcanza para freeBusy.query, que usa check_availability —
// es un recurso distinto de la API. calendar (acceso completo) cubre eventos + freebusy.
const SCOPES = ["https://www.googleapis.com/auth/calendar", "openid", "email"];

function redirectUri() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/integrations/google-calendar/callback`;
}

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    // access_type=offline + prompt=consent son imprescindibles: sin esto Google solo manda
    // refresh_token la primera vez que el usuario da consentimiento, no en reconexiones.
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
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, friendlyGoogleApiError(res.status, await res.text(), "calendario"));
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
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, friendlyGoogleApiError(res.status, await res.text(), "calendario"));
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
  if (GOOGLE_CALENDAR_MOCK) return "mock-access-token";

  const expiresAt = integration.tokenExpiresAt?.getTime() ?? 0;
  const needsRefresh = !integration.accessToken || expiresAt < Date.now() + 2 * 60 * 1000;
  if (!needsRefresh) return integration.accessToken!;

  if (!integration.refreshToken) {
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, "No hay refresh token guardado; hay que reconectar Google Calendar.");
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
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: "ERROR", lastError: message },
    });
    throw err;
  }
}

export interface FreeBusyRange {
  start: string;
  end: string;
}

export async function queryFreeBusy(params: {
  accessToken: string;
  calendarId: string;
  timeMin: string;
  timeMax: string;
}): Promise<FreeBusyRange[]> {
  if (GOOGLE_CALENDAR_MOCK) return [];

  const { accessToken, calendarId, timeMin, timeMax } = params;
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, friendlyGoogleApiError(res.status, await res.text(), "calendario"));
  }
  const data = await res.json();
  return data.calendars?.[calendarId]?.busy ?? [];
}

export async function insertEvent(params: {
  accessToken: string;
  calendarId: string;
  summary: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
}): Promise<{ id: string }> {
  if (GOOGLE_CALENDAR_MOCK) return { id: `mock-event-${Date.now()}` };

  const { accessToken, calendarId, summary, description, startsAt, endsAt, timezone } = params;
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startsAt, timeZone: timezone },
      end: { dateTime: endsAt, timeZone: timezone },
    }),
  });
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, friendlyGoogleApiError(res.status, await res.text(), "calendario"));
  }
  const data = await res.json();
  return { id: data.id };
}

export async function patchEvent(params: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
}): Promise<void> {
  if (GOOGLE_CALENDAR_MOCK) return;

  const { accessToken, calendarId, eventId, startsAt, endsAt, timezone } = params;
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        start: { dateTime: startsAt, timeZone: timezone },
        end: { dateTime: endsAt, timeZone: timezone },
      }),
    }
  );
  if (!res.ok) {
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, friendlyGoogleApiError(res.status, await res.text(), "calendario"));
  }
}

export async function deleteEvent(params: { accessToken: string; calendarId: string; eventId: string }): Promise<void> {
  if (GOOGLE_CALENDAR_MOCK) return;

  const { accessToken, calendarId, eventId } = params;
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  // 410 Gone = ya estaba borrado en Google; lo tratamos como éxito (idempotente).
  if (!res.ok && res.status !== 410) {
    throw new IntegrationAuthError(GOOGLE_CALENDAR_PROVIDER, friendlyGoogleApiError(res.status, await res.text(), "calendario"));
  }
}
