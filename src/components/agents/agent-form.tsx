"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AGENT_TYPE_LABELS } from "@/lib/plans";
import type { Agent, AgentType, Channel, KnowledgeSource } from "@prisma/client";

export interface AgentFormValues {
  name: string;
  type: AgentType;
  objective: string;
  tone: string;
  instructions: string;
  language: string;
  handoffRules: string;
  isActive: boolean;
  channelIds: string[];
  knowledgeSourceIds: string[];
}

export function AgentForm({
  agent,
  channels,
  knowledgeSources,
  selectedChannelIds = [],
  selectedSourceIds = [],
  calendarConnected = false,
  action,
  submitLabel = "Guardar agente",
}: {
  agent?: Agent;
  channels: Channel[];
  knowledgeSources: KnowledgeSource[];
  selectedChannelIds?: string[];
  selectedSourceIds?: string[];
  calendarConnected?: boolean;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
        });
      }}
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre del agente</Label>
          <Input id="name" name="name" required defaultValue={agent?.name} placeholder="Ej: Sofía" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            name="type"
            defaultValue={agent?.type ?? "ATENCION"}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {Object.entries(AGENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="objective">Objetivo</Label>
        <Input
          id="objective"
          name="objective"
          defaultValue={agent?.objective ?? ""}
          placeholder="Ej: resolver dudas y tomar pedidos de la cafetería"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tone">Tono de voz</Label>
        <Input id="tone" name="tone" defaultValue={agent?.tone ?? ""} placeholder="Ej: cercano, cálido, informal" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instructions">Instrucciones</Label>
        <Textarea
          id="instructions"
          name="instructions"
          required
          rows={5}
          defaultValue={agent?.instructions ?? ""}
          placeholder="Describí qué debe hacer el agente, qué información conoce y cómo debe comportarse."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="handoffRules">Reglas de derivación a humano</Label>
        <Textarea
          id="handoffRules"
          name="handoffRules"
          rows={2}
          defaultValue={agent?.handoffRules ?? ""}
          placeholder="Ej: reclamos, pedidos de cancelación, palabras como 'urgente'"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="language">Idioma</Label>
          <Input id="language" name="language" defaultValue={agent?.language ?? "es"} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch id="isActive" name="isActive" defaultChecked={agent?.isActive ?? true} />
          <Label htmlFor="isActive">Agente activo</Label>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg border border-border p-4">
        <div className="flex items-center gap-2">
          <Switch id="actionsEnabled" name="actionsEnabled" defaultChecked={agent?.actionsEnabled ?? false} disabled={!calendarConnected} />
          <Label htmlFor="actionsEnabled">Permitir que este agente reserve/cancele/reprograme turnos</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          {calendarConnected
            ? "Usa Google Calendar para consultar disponibilidad y confirmar turnos automáticamente."
            : "Conectá Google Calendar en Integraciones para poder activar esto."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Canales donde actúa</Label>
        <div className="flex flex-wrap gap-3">
          {channels.length === 0 && <p className="text-xs text-muted-foreground">Todavía no conectaste ningún canal.</p>}
          {channels.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
              <input
                type="checkbox"
                name="channelIds"
                value={c.id}
                defaultChecked={selectedChannelIds.includes(c.id)}
              />
              {c.type} {c.accountName ? `· ${c.accountName}` : ""}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Base de conocimiento</Label>
        <div className="flex flex-wrap gap-3">
          {knowledgeSources.length === 0 && (
            <p className="text-xs text-muted-foreground">Todavía no cargaste conocimiento.</p>
          )}
          {knowledgeSources.map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs">
              <input
                type="checkbox"
                name="knowledgeSourceIds"
                value={s.id}
                defaultChecked={selectedSourceIds.includes(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
