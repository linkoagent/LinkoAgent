"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { testChannelConnection, disconnectChannel } from "@/lib/actions/channels";
import { formatDateTime } from "@/lib/utils";
import type { Channel } from "@prisma/client";

export function ChannelStatusCard({ channel }: { channel: Channel }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; mocked?: boolean } | null>(null);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">WhatsApp</h3>
          <p className="text-xs text-muted-foreground">{channel.accountName || channel.phoneNumberId}</p>
        </div>
        <Badge variant={channel.status === "CONNECTED" ? "success" : "outline"}>{channel.status}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">ID de cuenta</dt>
          <dd className="text-foreground">{channel.accountId ?? channel.phoneNumberId}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Conectado desde</dt>
          <dd className="text-foreground" suppressHydrationWarning>
            {channel.connectedAt ? formatDateTime(channel.connectedAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Último mensaje</dt>
          <dd className="text-foreground" suppressHydrationWarning>
            {channel.lastMessageAt ? formatDateTime(channel.lastMessageAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Errores</dt>
          <dd className="text-destructive">{channel.lastError ?? "Ninguno"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await testChannelConnection(channel.id);
              setResult(res);
            })
          }
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Probar conexión
        </Button>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(() => disconnectChannel(channel.id))}>
          Desconectar
        </Button>
        {result && (
          <span className="flex items-center gap-1 text-xs">
            {result.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
            {result.ok ? "Conexión OK" : "Falló la conexión"} {result.mocked ? "(modo simulado)" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
