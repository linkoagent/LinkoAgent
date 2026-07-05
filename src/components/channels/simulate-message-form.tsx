"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function SimulateMessageForm({ channelId }: { channelId: string }) {
  const [pending, startTransition] = useTransition();
  const [fromPhone, setFromPhone] = useState("+549111234567");
  const [fromName, setFromName] = useState("Cliente de prueba");
  const [text, setText] = useState("Hola, ¿cuál es el horario de atención?");
  const [result, setResult] = useState<{ reply?: string | null; conversationId?: string; autoReplied?: boolean } | null>(
    null
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/channels/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, fromPhone, fromName, text }),
      });
      const data = await res.json();
      setResult(data);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-star" /> Simular mensaje entrante
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Prueba el circuito completo (IA + conocimiento + inbox + métricas) sin necesitar una cuenta real de Meta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fromName">Nombre del cliente simulado</Label>
          <Input id="fromName" value={fromName} onChange={(e) => setFromName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fromPhone">Teléfono simulado</Label>
          <Input id="fromPhone" value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text">Mensaje</Label>
        <Input id="text" value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando..." : "Enviar mensaje simulado"}
      </Button>

      {result && (
        <div className="rounded-lg bg-secondary p-3 text-xs">
          {result.autoReplied ? (
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
