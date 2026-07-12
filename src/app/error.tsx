"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logomark, Wordmark } from "@/components/logomark";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Logomark size={40} />
          <Wordmark className="text-2xl" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/20">
          <h1 className="font-display text-lg font-semibold text-foreground">Algo salió mal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tuvimos un problema inesperado al cargar esta página. Podés intentar de nuevo — si el problema sigue,
            avisanos.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => reset()} className="w-full">
              Reintentar
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/dashboard">Ir al panel</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
