"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { disconnectGoogleSheetsIntegration, setGoogleSheetsSpreadsheet } from "@/lib/actions/integrationsSheets";
import { formatDateTime } from "@/lib/utils";
import type { Integration } from "@prisma/client";
import { useState } from "react";

const STATUS_VARIANT = {
  CONNECTED: "success",
  DISCONNECTED: "outline",
  ERROR: "destructive",
} as const;

export function GoogleSheetsStatusCard({ integration }: { integration: Integration }) {
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    setSaving(true);
    const result = await setGoogleSheetsSpreadsheet(formData);
    setSaving(false);
    if (!result.ok) setFormError(result.error ?? "Error desconocido.");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Google Sheets (stock)</h3>
          <p className="text-xs text-muted-foreground">{integration.accountEmail ?? "Sin cuenta conectada"}</p>
        </div>
        <Badge variant={STATUS_VARIANT[integration.status]}>{integration.status}</Badge>
      </div>

      {integration.spreadsheetId ? (
        <>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Planilla</dt>
              <dd className="text-foreground">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${integration.spreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Abrir en Google Sheets
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hoja</dt>
              <dd className="text-foreground">{integration.sheetName ?? "Hoja1"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Última sincronización</dt>
              <dd className="text-foreground" suppressHydrationWarning>
                {integration.lastSyncAt ? formatDateTime(integration.lastSyncAt) : "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Errores</dt>
              <dd className="text-destructive">{integration.lastError ?? "Ninguno"}</dd>
            </div>
          </dl>
          <div>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => disconnectGoogleSheetsIntegration())}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Desconectar
            </Button>
          </div>
        </>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Cuenta conectada. Ahora pegá la URL o el ID de la Google Sheet donde llevás tus productos o servicios —
            usamos la que ya tengas armada, solo necesita encabezados en la fila 1 (nombre, y opcionalmente stock,
            precio, SKU, unidad, en cualquier orden).
          </p>
          <div className="flex gap-2">
            <Input name="spreadsheetInput" placeholder="https://docs.google.com/spreadsheets/d/..." className="text-xs" />
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Guardar
            </Button>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
        </form>
      )}
    </div>
  );
}
