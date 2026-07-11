"use client";

import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { MessageCorrectionActions } from "@/components/inbox/actions";
import type { Message } from "@prisma/client";

const SENDER_LABEL: Record<string, string> = { CUSTOMER: "Cliente", AI: "IA", HUMAN: "Humano", SYSTEM: "Sistema" };

export function ConversationMessages({ messages }: { messages: Message[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Se abre siempre mostrando el último mensaje, no el primero — sin esto el chat arranca
  // scrolleado arriba del todo y hay que bajar a mano para ver lo más reciente.
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((m) => {
        const isCustomer = m.sender === "CUSTOMER";
        return (
          <div key={m.id} className={cn("flex flex-col", isCustomer ? "items-start" : "items-end")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                isCustomer
                  ? "bg-secondary text-foreground"
                  : m.sender === "AI"
                    ? "bg-brand-button text-primary-foreground"
                    : "bg-star/20 text-foreground"
              )}
            >
              {m.isVoiceMessage && (
                <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide opacity-70">
                  <Mic className="h-3 w-3" /> Audio transcripto
                  {m.transcriptionLanguage ? ` · ${m.transcriptionLanguage}` : ""}
                </div>
              )}
              {m.content}
              {m.transcriptionSummary && (
                <p className="mt-1.5 border-t border-black/10 pt-1.5 text-xs italic opacity-80">
                  Resumen: {m.transcriptionSummary}
                </p>
              )}
            </div>
            <span className="mt-1 text-[10.5px] text-muted-foreground">
              {SENDER_LABEL[m.sender]} · {formatDateTime(m.createdAt)}
              {m.isVoiceMessage && m.transcriptionConfidence != null ? ` · Confianza ${Math.round(m.transcriptionConfidence * 100)}%` : ""}
            </span>
            {m.sender === "AI" && <MessageCorrectionActions messageId={m.id} />}
          </div>
        );
      })}
      {messages.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay mensajes en esta conversación.</p>}
    </div>
  );
}
