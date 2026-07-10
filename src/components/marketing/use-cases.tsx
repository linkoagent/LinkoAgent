"use client";

import { useLocale, useMarketingContent } from "./locale-provider";
import { Reveal, StaggerGroup, StaggerItem, HoverLift } from "./reveal";

export function UseCases() {
  const { locale } = useLocale();
  const { useCases } = useMarketingContent();

  return (
    <section id="soluciones" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mb-14 max-w-2xl">
        <span className="font-display text-[11px] uppercase tracking-wide text-faint">
          {locale === "es" ? "Soluciones" : "Solutions"}
        </span>
        <h2 className="mt-3 text-3xl font-bold text-foreground">
          {locale === "es" ? "Un agente distinto para cada tipo de negocio." : "A different agent for every type of business."}
        </h2>
      </Reveal>
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {useCases.map((c) => (
          <StaggerItem key={c.title}>
            <HoverLift>
              <div className="rounded-xl border border-border bg-card p-5">
                <h4 className="font-display text-[13.5px] text-foreground">{c.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </HoverLift>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
