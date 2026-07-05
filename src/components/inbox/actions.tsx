"use client";

import { useState, useTransition } from "react";
import { Send, Pause, Play, UserCheck, CheckCircle2, RotateCcw, Sparkles, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  sendManualReply,
  toggleAiPause,
  assignToMe,
  closeConversation,
  reopenConversation,
  addNote,
  addTag,
  removeTag,
  generateSummary,
} from "@/lib/actions/conversations";

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const value = text;
    setText("");
    startTransition(() => sendManualReply(conversationId, value));
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border p-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribir una respuesta manual..."
        rows={2}
        className="flex-1"
      />
      <Button type="submit" disabled={pending || !text.trim()} size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function AiPauseSwitch({ conversationId, aiPaused }: { conversationId: string; aiPaused: boolean }) {
  const [checked, setChecked] = useState(!aiPaused);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm">
        {checked ? <Play className="h-4 w-4 text-success" /> : <Pause className="h-4 w-4 text-star" />}
        <span>{checked ? "IA respondiendo" : "IA pausada"}</span>
      </div>
      <Switch
        checked={checked}
        disabled={pending}
        onCheckedChange={(value) => {
          setChecked(value);
          startTransition(() => toggleAiPause(conversationId, !value));
        }}
      />
    </div>
  );
}

export function ConversationLifecycleButtons({
  conversationId,
  status,
}: {
  conversationId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const isClosed = status === "CLOSED" || status === "RESOLVED";

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => assignToMe(conversationId))}
      >
        <UserCheck className="h-4 w-4" /> Tomar conversación
      </Button>
      {isClosed ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => reopenConversation(conversationId))}
        >
          <RotateCcw className="h-4 w-4" /> Reabrir
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => closeConversation(conversationId))}
        >
          <CheckCircle2 className="h-4 w-4" /> Cerrar conversación
        </Button>
      )}
    </div>
  );
}

export function SummaryButton({ conversationId, summary }: { conversationId: string; summary: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="subtle"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => generateSummary(conversationId))}
      >
        <Sparkles className="h-4 w-4" /> {summary ? "Regenerar resumen" : "Generar resumen"}
      </Button>
      {summary && <p className="rounded-lg bg-secondary p-3 text-xs leading-relaxed text-foreground">{summary}</p>}
    </div>
  );
}

export function NotesPanel({
  conversationId,
  notes,
}: {
  conversationId: string;
  notes: { id: string; body: string; author: { name: string }; createdAt: Date }[];
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      {notes.map((n) => (
        <div key={n.id} className="rounded-lg bg-secondary p-2.5 text-xs">
          <p className="text-foreground">{n.body}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">{n.author.name}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nota interna..."
          className="h-9 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !text.trim()}
          onClick={() => {
            const value = text;
            setText("");
            startTransition(() => addNote(conversationId, value));
          }}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
}

export function TagsPanel({
  conversationId,
  tags,
}: {
  conversationId: string;
  tags: { tagId: string; tag: { id: string; name: string } }[];
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge key={t.tagId} variant="outline" className="gap-1">
            <TagIcon className="h-3 w-3" />
            {t.tag.name}
            <button
              type="button"
              onClick={() => startTransition(() => removeTag(conversationId, t.tagId))}
              aria-label={`Quitar etiqueta ${t.tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nueva etiqueta..."
          className="h-9 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !text.trim()}
          onClick={() => {
            const value = text;
            setText("");
            startTransition(() => addTag(conversationId, value));
          }}
        >
          +
        </Button>
      </div>
    </div>
  );
}
