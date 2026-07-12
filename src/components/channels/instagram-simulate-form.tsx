"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function InstagramSimulateForm({ channelId }: { channelId: string }) {
  const [pending, startTransition] = useTransition();
  const [fromUserId, setFromUserId] = useState("igsid_1234567890");
  const [fromName, setFromName] = useState("Cliente de prueba");
  const [text, setText] = useState("Hola, ¿cuál es el horario de atención?");
  const [isEcho, setIsEcho] = useState(false);
  const [result, setResult] = useState<{ reply?: string | null; conversationId?: string; autoReplied?: boolean; ignored?: string } | null>(
    null
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/channels/instagram/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, fromUserId, fromName, text, isEcho }),
      });
      const data = await res.json();
      setResult(data);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-star" /> Simular DM entrante
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Prueba el circuito completo (IA + conocimiento + inbox + métricas) sin necesitar una cuenta real de Meta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ig-fromName">Nombre del cliente simulado</Label>
          <Input id="ig-fromName" value={fromName} onChange={(e) => setFromName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ig-fromUserId">IGSID simulado</Label>
          <Input id="ig-fromUserId" value={fromUserId} onChange={(e) => setFromUserId(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ig-text">Mensaje</Label>
        <Input id="ig-text" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="ig-isEcho" checked={isEcho} onCheckedChange={setIsEcho} />
        <Label htmlFor="ig-isEcho">
          Simular eco (is_echo) — debe ignorarse, no generar conversación
        </Label>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando..." : "Enviar mensaje simulado"}
      </Button>

      {result && (
        <div className="rounded-lg bg-secondary p-3 text-xs">
          {result.ignored ? (
            <p className="text-foreground">Se ignoró correctamente (motivo: {result.ignored}), como corresponde con un eco.</p>
          ) : result.autoReplied ? (
            <p className="text-foreground">
              El agente respondió: <span className="text-muted-foreground">“{result.reply}”</span>
            </p>
          ) : (
            <p className="text-foreground">Mensaje recibido, pero la IA no respondió automáticamente (¿está pausada o sin agente asignado?).</p>
          )}
          {result.conversationId && (
            <Link href={`/inbox/${result.conversationId}`} className="mt-2 inline-block text-primary hover:underline">
              Ver conversación en el Inbox →
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
