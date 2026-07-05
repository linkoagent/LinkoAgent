"use client";

import { useTransition, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addTeamMember, removeTeamMember } from "@/lib/actions/settings";
import { ROLE_LABELS } from "@/lib/plans";

interface MembershipRow {
  id: string;
  role: string;
  user: { name: string; email: string };
}

export function TeamPanel({ memberships, currentUserId }: { memberships: MembershipRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">Equipo</h3>

      <div className="flex flex-col gap-2">
        {memberships.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm">
            <div>
              <p className="text-foreground">{m.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {m.user.email} · {ROLE_LABELS[m.role] ?? m.role}
              </p>
            </div>
            {m.user.email && m.id !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                onClick={() => startTransition(() => removeTeamMember(m.id))}
                aria-label="Quitar del equipo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            await addTeamMember(formData);
            formRef.current?.reset();
          })
        }
        className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="member-name">Nombre</Label>
          <Input id="member-name" name="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="member-email">Email</Label>
          <Input id="member-email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="member-role">Rol</Label>
          <select id="member-role" name="role" className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="AGENT_HUMAN">Agente humano</option>
            <option value="COMPANY_ADMIN">Admin de empresa</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Le mandamos un email para que cree su propia contraseña y entre a la cuenta.
        </p>
        <Button type="submit" disabled={pending} className="w-fit sm:col-span-2">
          Agregar al equipo
        </Button>
      </form>
    </div>
  );
}
