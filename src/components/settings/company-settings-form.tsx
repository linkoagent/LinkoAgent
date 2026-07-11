"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCompanySettings } from "@/lib/actions/settings";
import type { Company } from "@prisma/client";

const DAYS: [string, string][] = [
  ["mon", "Lun"],
  ["tue", "Mar"],
  ["wed", "Mié"],
  ["thu", "Jue"],
  ["fri", "Vie"],
  ["sat", "Sáb"],
  ["sun", "Dom"],
];

export function CompanySettingsForm({ company }: { company: Company }) {
  const [pending, startTransition] = useTransition();
  const hours = (company.businessHours as { open?: string; close?: string; days?: string[] } | null) ?? {};

  return (
    <form
      action={(formData) => startTransition(() => updateCompanySettings(formData))}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h3 className="font-display text-sm font-semibold text-foreground">Perfil de la empresa</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required defaultValue={company.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="industry">Rubro</Label>
          <Input id="industry" name="industry" defaultValue={company.industry ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brandTone">Tono de marca</Label>
        <Input id="brandTone" name="brandTone" defaultValue={company.brandTone ?? ""} placeholder="Ej: cercano, directo, con humor" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Input id="timezone" name="timezone" defaultValue={company.timezone} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="openTime">Horario de apertura</Label>
          <Input id="openTime" name="openTime" type="time" defaultValue={hours.open ?? "09:00"} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="closeTime">Horario de cierre</Label>
          <Input id="closeTime" name="closeTime" type="time" defaultValue={hours.close ?? "18:00"} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Días de atención</Label>
        <div className="flex flex-wrap gap-3">
          {DAYS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" name={`day_${key}`} defaultChecked={hours.days?.includes(key) ?? ["mon","tue","wed","thu","fri"].includes(key)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staffPhoneNumbers">Números autorizados para acciones</Label>
        <Input
          id="staffPhoneNumbers"
          name="staffPhoneNumbers"
          defaultValue={company.staffPhoneNumbers ?? ""}
          placeholder="Ej: 5493511234567, 5493519876543"
        />
        <p className="text-xs text-muted-foreground">
          Teléfonos (con código de país, separados por coma) autorizados a pedirle al agente que modifique
          stock u otras acciones administrativas — para que un cliente no pueda hacerlo por accidente.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="outOfHoursMessage">Mensaje fuera de horario</Label>
        <Textarea
          id="outOfHoursMessage"
          name="outOfHoursMessage"
          rows={3}
          defaultValue={company.outOfHoursMessage ?? ""}
          placeholder="En este momento estamos fuera de horario de atención. Te respondemos apenas volvamos."
        />
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
