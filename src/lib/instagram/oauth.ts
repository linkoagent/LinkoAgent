import { IntegrationAuthError } from "@/lib/ai/errors";
import { INSTAGRAM_GRAPH_VERSION } from "./client";

export const INSTAGRAM_OAUTH_STATE_COOKIE = "instagram_oauth_state";

const CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_APP_SECRET;

// Sin credenciales reales (o con INSTAGRAM_MOCK_MODE=true), todo el flujo queda simulado — mismo
// criterio que WHATSAPP_MOCK_MODE/GOOGLE_SHEETS_MOCK_MODE.
export const INSTAGRAM_MOCK = !CLIENT_ID || process.env.INSTAGRAM_MOCK_MODE === "true";

// "Instagram Login" (graph.instagram.com/instagram.com), no "Facebook Login for Business" — no
// exige que el cliente tenga una Página de Facebook vinculada a su cuenta profesional, que muchos
// negocios chicos no tienen armada. Ver plan: developers.facebook.com/docs/instagram-platform.
const SCOPES = ["instagram_business_basic", "instagram_business_manage_messages"];

function redirectUri() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/channels/instagram/callback`;
}

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES.join(","),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

interface ShortLivedTokenResponse {
  access_token: string;
  user_id: number;
}

/** POST api.instagram.com (no graph.instagram.com) — código de autorización por un token de
 * corta duración (~1 hora). */
export async function exchangeCodeForShortLivedToken(code: string): Promise<ShortLivedTokenResponse> {
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID || "",
      client_secret: CLIENT_SECRET || "",
      grant_type: "authorization_code",
      redirect_uri: redirectUri(),
      code,
    }),
  });
  if (!res.ok) {
    throw new IntegrationAuthError("instagram", `No se pudo intercambiar el código de Instagram (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // segundos, ~60 días
}

/** A diferencia del token de sistema de WhatsApp (no vence), el de Instagram Login vence a los
 * 60 días — hay que canjear el de corta duración por este apenas se conecta. */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: CLIENT_SECRET || "",
    access_token: shortLivedToken,
  });
  const res = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`);
  if (!res.ok) {
    throw new IntegrationAuthError("instagram", `No se pudo generar un token de larga duración (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** El token debe tener al menos 24hs para poder refrescarse — se llama de forma perezosa (al
 * usarse), mismo criterio que getValidAccessToken de Google Calendar, no hay cron. */
export async function refreshLongLivedToken(accessToken: string): Promise<LongLivedTokenResponse> {
  const params = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: accessToken });
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?${params.toString()}`);
  if (!res.ok) {
    throw new IntegrationAuthError("instagram", `Token de Instagram inválido o revocado (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** Activa la entrega de webhooks para la cuenta recién conectada — es por cuenta, no por
 * Business Manager como en WhatsApp. */
export async function subscribeInstagramWebhooks(accessToken: string): Promise<void> {
  const res = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/me/subscribed_apps?subscribed_fields=messages`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new IntegrationAuthError("instagram", `No se pudo activar el webhook de Instagram (${res.status}): ${await res.text()}`);
  }
}

export interface InstagramProfile {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  followersCount: number | null;
}

/** No hay campo `account_type` documentado en este endpoint — se omite (solo cuentas
 * profesionales pueden completar Instagram Login de todos modos). */
export async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const res = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/me?fields=user_id,username,name,profile_picture_url,followers_count`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new IntegrationAuthError("instagram", `No se pudo leer el perfil de Instagram (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return {
    userId: String(data.user_id),
    username: data.username,
    name: data.name ?? null,
    profilePictureUrl: data.profile_picture_url ?? null,
    followersCount: data.followers_count ?? null,
  };
}

/** Nombre de quien escribe (análogo a contacts[0].profile.name de WhatsApp) — solo funciona una
 * vez que esa persona ya escribió (consentimiento implícito), y falla en silencio si bloqueó a
 * la cuenta; por eso el caller debe tolerar que devuelva null. */
export async function fetchInstagramSenderName(accountAccessToken: string, igsid: string): Promise<string | null> {
  try {
    const res = await fetch(`https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/${igsid}?fields=name,username`, {
      headers: { Authorization: `Bearer ${accountAccessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.name ?? data.username ?? null;
  } catch {
    return null;
  }
}
