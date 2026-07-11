"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disconnectGoogleCalendarIntegration } from "@/lib/actions/integrations";
import { formatDateTime } from "@/lib/utils";
import type { Integration } from "@prisma/client";

const STATUS_VARIANT = {
  CONNECTED: "success",
  DISCONNECTED: "outline",
  ERROR: "destructive",
} as const;

export function GoogleCalendarStatusCard({ integration }: { integration: Integration }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">Google Calendar</h3>
          <p className="text-xs text-muted-foreground">{integration.accountEmail ?? "Sin cuenta conectada"}</p>
        </div>
        <Badge variant={STATUS_VARIANT[integration.status]}>{integration.status}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Calendario</dt>
          <dd className="text-foreground">{integration.calendarId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Última sincronización</dt>
          <dd className="text-foreground">{integration.lastSyncAt ? formatDateTime(integration.lastSyncAt) : "—"}</dd>
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
          onClick={() => startTransition(() => disconnectGoogleCalendarIntegration())}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Desconectar
        </Button>
      </div>
    </div>
  );
}
