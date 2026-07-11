"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompanyHoliday, deleteCompanyHoliday } from "@/lib/actions/holidays";

interface Holiday {
  id: string;
  date: Date;
  endDate: Date | null;
  label: string | null;
  recurringYearly: boolean;
}

function formatHolidayDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function HolidaysManager({ holidays }: { holidays: Holiday[] }) {
  const [pending, startTransition] = useTransition();
  const [recurring, setRecurring] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">Feriados y vacaciones</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Días en los que el agente no debe ofrecer turnos. Un feriado fijo se repite todos los años (solo importa
          el mes/día); una vacación es un rango puntual de un año específico.
        </p>
      </div>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            await createCompanyHoliday(formData);
            formRef.current?.reset();
            setRecurring(false);
          })
        }
        className="grid gap-3 sm:grid-cols-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="holiday-date">Desde</Label>
          <Input id="holiday-date" name="date" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="holiday-endDate">Hasta (opcional)</Label>
          <Input id="holiday-endDate" name="endDate" type="date" disabled={recurring} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="holiday-label">Etiqueta</Label>
          <Input id="holiday-label" name="label" placeholder="Ej: Navidad, Vacaciones de verano" />
        </div>
        <div className="flex flex-col gap-1.5 justify-end">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="recurringYearly"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            Se repite todos los años
          </label>
          <Button type="submit" size="sm" disabled={pending}>
            Agregar
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        {holidays.map((h) => (
          <div key={h.id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-xs">
            <span className="text-foreground">
              {h.label ?? (h.recurringYearly ? "Feriado" : "Vacaciones")} · {formatHolidayDate(h.date)}
              {h.endDate ? ` a ${formatHolidayDate(h.endDate)}` : ""}
              {h.recurringYearly ? " (todos los años)" : ""}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Eliminar"
              disabled={pending}
              onClick={() => startTransition(() => deleteCompanyHoliday(h.id))}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        {holidays.length === 0 && <p className="text-xs text-muted-foreground">Todavía no cargaste feriados ni vacaciones.</p>}
      </div>
    </div>
  );
}
