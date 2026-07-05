"use client";

import { useState } from "react";
import { Send, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatEntry = { sender: "CUSTOMER" | "AI"; content: string; handoff?: boolean };

export function TestChat({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    const nextHistory = [...messages, { sender: "CUSTOMER" as const, content: text }];
    setMessages(nextHistory);
    setLoading(true);

    const res = await fetch(`/api/agents/${agentId}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: messages }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessages((prev) => [...prev, { sender: "AI", content: data.reply, handoff: data.shouldHandoff }]);
    } else {
      setMessages((prev) => [...prev, { sender: "AI", content: `Error: ${data.error ?? "no se pudo responder"}` }]);
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-display text-sm font-semibold text-foreground">Chat de prueba</h3>
        <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Escribí como si fueras un cliente para ver cómo responde el agente antes de activarlo.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.sender === "CUSTOMER" ? "items-start" : "items-end")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                m.sender === "CUSTOMER" ? "bg-secondary text-foreground" : "bg-brand-button text-primary-foreground"
              )}
            >
              {m.content}
            </div>
            {m.handoff && (
              <span className="mt-1 flex items-center gap-1 text-[10.5px] text-star">
                <AlertTriangle className="h-3 w-3" /> derivaría a un humano
              </span>
            )}
          </div>
        ))}
        {loading && <p className="text-xs text-muted-foreground">Pensando…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribí un mensaje..." />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
