"use client";

import { useState } from "react";
import Link from "next/link";
import { plansUSD, usdToArs } from "@/data/marketing";

function formatPrice(price: number | null, currency: string) {
  if (price === null) return "A medida";
  const value = currency === "ARS" ? Math.round((price * usdToArs) / 100) * 100 : price;
  const symbol = currency === "ARS" ? "AR$" : "US$";
  return `${symbol} ${value.toLocaleString("es-AR")}`;
}

export function MarketingPricing() {
  const [currency, setCurrency] = useState<"USD" | "ARS">("USD");

  return (
    <section id="precios" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">Precios</span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Un plan para cada etapa del negocio.</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Suscripción mensual + implementación inicial. Sin permanencia mínima.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {(["USD", "ARS"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-full px-4 py-1.5 font-display text-[12px] transition ${
                currency === c ? "bg-primary text-white" : "text-faint hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {plansUSD.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col gap-5 rounded-2xl border bg-card p-6 ${
              plan.featured ? "border-primary shadow-lg shadow-primary/10" : "border-border"
            }`}
          >
            {plan.featured && (
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 font-display text-[10.5px] text-white">
                Más elegido
              </span>
            )}
            <div>
              <h3 className="font-display text-base text-foreground">{plan.name}</h3>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">{plan.tagline}</p>
            </div>

            <div>
              <div className="font-display text-3xl text-foreground tabular-nums">
                {formatPrice(plan.price, currency)}
                {plan.price !== null && <span className="font-sans text-[13px] text-faint"> /mes</span>}
              </div>
              <div className="mt-1 font-display text-[11px] text-faint">
                {plan.setup !== null ? `Implementación desde ${formatPrice(plan.setup, currency)}` : "Implementación a medida"}
              </div>
            </div>

            <ul className="flex flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                  <span className="mt-0.5 font-display text-primary">›</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.price === null ? "/#contacto" : "/signup"}
              className={`mt-auto rounded-lg px-4 py-2.5 text-center font-display text-[12.5px] transition ${
                plan.featured
                  ? "bg-primary text-white hover:bg-primary-dim"
                  : "border border-border text-foreground hover:border-faint"
              }`}
            >
              {plan.price === null ? "Hablar con ventas" : "Empezar ahora"}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center font-display text-[11px] text-faint">
        Cotización en ARS de referencia (US$1 ≈ AR${usdToArs.toLocaleString("es-AR")}) — ajustable según el tipo de cambio vigente.
      </p>
    </section>
  );
}
