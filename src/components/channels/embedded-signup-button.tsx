"use client";

import { useEffect, useRef, useState } from "react";
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

export function EmbeddedSignupButton() {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionData = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  useEffect(() => {
    if (!configured) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.data) {
          if (data.data.waba_id) sessionData.current.wabaId = data.data.waba_id;
          if (data.data.phone_number_id) sessionData.current.phoneNumberId = data.data.phone_number_id;
        }
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

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleClick() {
    if (!window.FB) return;
    setStatus("pending");
    setError(null);

    window.FB.login(
      (response) => {
        const code = response?.authResponse?.code;
        if (!code) {
          setStatus("idle");
          return;
        }

        completeEmbeddedSignup({
          code,
          wabaId: sessionData.current.wabaId,
          phoneNumberId: sessionData.current.phoneNumberId,
        }).then((res) => {
          if (res.ok) {
            window.location.reload();
            return;
          }
          setStatus("error");
          setError(res.error ?? "No se pudo completar la conexión");
        });
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { sessionInfoVersion: "3" },
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
