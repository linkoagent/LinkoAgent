"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateAgendaSettings } from "@/lib/actions/agendaSettings";
import type { Company } from "@prisma/client";

export function AgendaSettingsForm({ company }: { company: Company }) {
  const [pending, startTransition] = useTransition();
  const [hasLunchBreak, setHasLunchBreak] = useState(!!(company.lunchBreakStart && company.lunchBreakEnd));

  return (
    <form
      action={(formData) => startTransition(() => updateAgendaSettings(formData))}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h3 className="font-display text-sm font-semibold text-foreground">Reglas de agenda</h3>
      <p className="text-xs text-muted-foreground">
        Cómo el agente reserva turnos por WhatsApp: duración, tiempo entre turnos, almuerzo y cuántos turnos
        simultáneos permitís (útil si tenés varias sillas/profesionales compartiendo el mismo calendario).
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="appointmentDurationMinutes">Duración de turno (min)</Label>
          <Input
            id="appointmentDurationMinutes"
            name="appointmentDurationMinutes"
            type="number"
            min={5}
            step={5}
            defaultValue={company.appointmentDurationMinutes}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="appointmentBufferMinutes">Buffer entre turnos (min)</Label>
          <Input
            id="appointmentBufferMinutes"
            name="appointmentBufferMinutes"
            type="number"
            min={0}
            step={5}
            defaultValue={company.appointmentBufferMinutes}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxSimultaneousAppointments">Máximo de turnos simultáneos</Label>
          <Input
            id="maxSimultaneousAppointments"
            name="maxSimultaneousAppointments"
            type="number"
            min={1}
            defaultValue={company.maxSimultaneousAppointments}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Switch id="hasLunchBreak" checked={hasLunchBreak} onCheckedChange={setHasLunchBreak} />
          <Label htmlFor="hasLunchBreak">Tener pausa/almuerzo</Label>
          <input type="hidden" name="hasLunchBreak" value={hasLunchBreak ? "on" : ""} />
        </div>
        {hasLunchBreak && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lunchBreakStart">Desde</Label>
              <Input id="lunchBreakStart" name="lunchBreakStart" type="time" defaultValue={company.lunchBreakStart ?? "13:00"} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lunchBreakEnd">Hasta</Label>
              <Input id="lunchBreakEnd" name="lunchBreakEnd" type="time" defaultValue={company.lunchBreakEnd ?? "14:00"} />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : "Guardar reglas de agenda"}
      </Button>
    </form>
  );
}
