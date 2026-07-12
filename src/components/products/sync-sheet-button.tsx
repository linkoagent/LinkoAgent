"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** /products se sirve como Server Component: navegar de vuelta a la página puede mostrar una
 * versión cacheada del lado del cliente (Next.js Router Cache) en vez de volver a leer la
 * planilla. router.refresh() fuerza a re-renderizar el árbol de Server Components de la ruta
 * actual, trayendo los datos frescos (incluida cualquier columna nueva agregada en Sheets). */
export function SyncSheetButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      Sincronizar planilla
    </Button>
  );
}
