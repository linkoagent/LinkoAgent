import { GRAPH_VERSION } from "@/lib/whatsapp/client";

/**
 * Intercambia el "code" que devuelve el popup de Embedded Signup (Facebook Login for
 * Business) por un access token de negocio. Requiere que la app de Meta tenga aprobados
 * whatsapp_business_management y whatsapp_business_messaging (App Review) — hasta entonces
 * esto sólo funciona para usuarios agregados como testers de la app en Meta.
 */
export async function exchangeEmbeddedSignupCode(code: string): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Falta configurar NEXT_PUBLIC_META_APP_ID / META_APP_SECRET");
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`No se pudo intercambiar el code de Embedded Signup (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/** Suscribe nuestra app al WABA del cliente para que su webhook nos llegue a nosotros. */
export async function subscribeAppToWaba(wabaId: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`No se pudo suscribir el webhook al WABA (${res.status}): ${await res.text()}`);
  }
}

/** Nombre/número verificado del teléfono, para mostrarlo en la UI en vez del ID pelado. */
export async function fetchPhoneNumberDisplayName(phoneNumberId: string, accessToken: string): Promise<string | null> {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.verified_name as string | undefined) ?? (data.display_phone_number as string | undefined) ?? null;
}
