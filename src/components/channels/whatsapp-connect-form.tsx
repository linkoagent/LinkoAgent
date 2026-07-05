"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectWhatsAppChannel } from "@/lib/actions/channels";
import type { Channel } from "@prisma/client";

export function WhatsAppConnectForm({ channel }: { channel: Channel | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => connectWhatsAppChannel(formData))}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">Conectar WhatsApp Cloud API</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Estos datos se generan en Meta for Developers, en la app configurada con el producto WhatsApp Business Platform.
          Si todavía no tenés cuenta de Meta, dejá estos campos con cualquier valor: en modo simulado igual vas a poder
          probar todo el flujo desde el botón "Simular mensaje" más abajo.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountName">Nombre de la cuenta</Label>
          <Input id="accountName" name="accountName" defaultValue={channel?.accountName ?? ""} placeholder="Mi Negocio" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phoneNumberId">Phone Number ID</Label>
          <Input
            id="phoneNumberId"
            name="phoneNumberId"
            required
            defaultValue={channel?.phoneNumberId ?? ""}
            placeholder="1234567890"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wabaId">WhatsApp Business Account ID</Label>
          <Input id="wabaId" name="wabaId" defaultValue={channel?.wabaId ?? ""} placeholder="9876543210" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accessToken">Access token</Label>
          <Input id="accessToken" name="accessToken" type="password" placeholder="EAAG..." />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando..." : channel ? "Actualizar conexión" : "Conectar"}
      </Button>
    </form>
  );
}
