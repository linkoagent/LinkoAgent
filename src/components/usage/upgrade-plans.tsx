"use client";

import { useState, useTransition } from "react";
import type { PlanTier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { startPlanCheckout } from "@/lib/actions/billing";
import { PLAN_DEFS, planPriceArs } from "@/lib/plans";

const PAID_TIERS: Exclude<PlanTier, "ENTERPRISE">[] = ["STARTER", "PRO", "BUSINESS"];

export function UpgradePlans({ currentTier }: { currentTier: PlanTier }) {
  const [pendingTier, setPendingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubscribe(tier: Exclude<PlanTier, "ENTERPRISE">) {
    setError(null);
    setPendingTier(tier);
    startTransition(async () => {
      const res = await startPlanCheckout(tier);
      if (res.ok && res.url) {
        window.location.href = res.url;
        return;
      }
      setError(res.error ?? "No se pudo iniciar el checkout de Mercado Pago");
      setPendingTier(null);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">Cambiar de plan</h3>
      <p className="text-xs text-muted-foreground">
        Se abre el checkout de Mercado Pago. El plan se actualiza acá solo cuando Mercado Pago confirma el pago.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {PAID_TIERS.map((tier) => {
          const def = PLAN_DEFS[tier];
          const isCurrent = tier === currentTier;
          return (
            <div key={tier} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="font-display text-sm text-foreground">{def.name}</div>
              <div className="font-display text-lg text-foreground">
                AR$ {planPriceArs(def.priceUsd).toLocaleString("es-AR")}
                <span className="text-xs text-muted-foreground"> /mes</span>
              </div>
              <Button
                type="button"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || (pending && pendingTier === tier)}
                onClick={() => handleSubscribe(tier)}
              >
                {isCurrent ? "Plan actual" : pending && pendingTier === tier ? "Redirigiendo..." : "Suscribirme"}
              </Button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
