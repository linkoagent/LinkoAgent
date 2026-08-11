"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeEmbeddedSignup } from "@/lib/actions/channels";

interface FacebookLoginResponse {
  authResponse?: { code?: string };
}

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; xfbml: boolean; version: string }) => void;
      login: (callback: (response: FacebookLoginResponse) => void, params: Record<string, unknown>) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const CONFIG_ID = process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID;
const configured = Boolean(APP_ID && CONFIG_ID);

// Meta entrega el "code" (callback de FB.login) y el waba_id/phone_number_id (postMessage aparte)
// de forma asincrónica e independiente — no hay garantía de cuál de los dos llega primero. Si
// completamos apenas llega el code, casi siempre ganamos la carrera y nos quedamos sin sesión.
const SESSION_DATA_GRACE_MS = 8000;

export function EmbeddedSignupButton() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionData = useRef<{ wabaId?: string; phoneNumberId?: string }>({});
  const codeRef = useRef<string | null>(null);
  const coexistenceRef = useRef(false);
  const settledRef = useRef(false);
  const graceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGraceTimer = useCallback(() => {
    if (graceTimer.current) {
      clearTimeout(graceTimer.current);
      graceTimer.current = null;
    }
  }, []);

  const tryComplete = useCallback(() => {
    if (settledRef.current) return;
    const code = codeRef.current;
    const { wabaId, phoneNumberId } = sessionData.current;
    // En coexistence el postMessage nunca trae phoneNumberId (el número ya está registrado, no
    // se elige) — el server lo resuelve solo. En el flujo estándar sí hace falta tenerlo ya.
    if (!code || !wabaId || (!phoneNumberId && !coexistenceRef.current)) return;

    settledRef.current = true;
    clearGraceTimer();

    completeEmbeddedSignup({ code, wabaId, phoneNumberId, coexistence: coexistenceRef.current }).then((res) => {
      if (res.ok) {
        window.location.reload();
        return;
      }
      setStatus("error");
      setError(res.error ?? "No se pudo completar la conexión");
    });
  }, [clearGraceTimer]);

  useEffect(() => {
    if (!configured) return;

    const ALLOWED_ORIGINS = [
      "https://www.facebook.com",
      "https://web.facebook.com",
      "https://business.facebook.com",
    ];

    function handleMessage(event: MessageEvent) {
      // eslint-disable-next-line no-console -- debug temporal para diagnosticar Embedded Signup en prod, sacar después
      console.log("[embedded-signup] mensaje recibido, origin:", event.origin, "data:", event.data);
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;

        if (data.event === "CANCEL") {
          settledRef.current = true;
          clearGraceTimer();
          setStatus("idle");
          return;
        }

        if (data.data?.waba_id) sessionData.current.wabaId = data.data.waba_id;
        if (data.data?.phone_number_id) sessionData.current.phoneNumberId = data.data.phone_number_id;
        tryComplete();
      } catch {
        // mensajes de Facebook ajenos al embedded signup; se ignoran
      }
    }
    window.addEventListener("message", handleMessage);

    if (window.FB) {
      setSdkReady(true);
      return () => window.removeEventListener("message", handleMessage);
    }

    window.fbAsyncInit = () => {
      window.FB?.init({ appId: APP_ID!, xfbml: false, version: "v20.0" });
      setSdkReady(true);
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/es_LA/sdk.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      clearGraceTimer();
    };
  }, [tryComplete, clearGraceTimer]);

  function handleClick() {
    if (!window.FB) return;
    setStatus("pending");
    setError(null);
    settledRef.current = false;
    codeRef.current = null;
    sessionData.current = {};

    window.FB.login(
      (response) => {
        // eslint-disable-next-line no-console -- debug temporal para diagnosticar Embedded Signup en prod, sacar después
        console.log("[embedded-signup] respuesta de FB.login:", response);
        const code = response?.authResponse?.code;
        if (!code) {
          setStatus("idle");
          return;
        }
        codeRef.current = code;

        // El code llegó pero puede que el postMessage con waba_id/phone_number_id todavía no —
        // le damos un margen antes de avisar que Meta no mandó esos datos.
        graceTimer.current = setTimeout(() => {
          if (settledRef.current) return;
          settledRef.current = true;
          setStatus("error");
          setError("Meta no devolvió el WhatsApp Business Account o el número elegido. Probá de nuevo.");
        }, SESSION_DATA_GRACE_MS);

        tryComplete();
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        // "setup" es obligatorio para que Meta reconozca esto como un lanzamiento real del wizard
        // de WhatsApp: sin él, el popup completaba un login genérico de Facebook (con code, pero
        // sin jamás mostrar los pasos de elegir WABA/número ni mandar el postMessage
        // WA_EMBEDDED_SIGNUP) — la causa real de "Meta no devolvió el WhatsApp Business Account".
        // featureType vacío = flujo estándar; queda listo para "whatsapp_business_app_onboarding"
        // el día que haya un número elegible para coexistence.
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      }
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Conectar con un click (próximamente)</p>
        <p className="mt-1">
          Falta que Meta apruebe la Business Verification y el App Review de WhatsApp para esta app, y crear la
          configuración de Embedded Signup en WhatsApp Manager. Mientras tanto, conectá el canal con el formulario
          de abajo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">Conectar WhatsApp con un click</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          El cliente inicia sesión con su propia cuenta de Meta Business y elige su número de WhatsApp. No hace
          falta pedirle ningún dato técnico.
        </p>
      </div>
      <Button type="button" onClick={handleClick} disabled={!sdkReady || status === "pending"} className="w-fit">
        {status === "pending" ? "Conectando..." : "Conectar WhatsApp"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
