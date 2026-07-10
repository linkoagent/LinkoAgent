"use client";

import { useLocale, useMarketingContent } from "./locale-provider";
import { Reveal, StaggerGroup, StaggerItem, HoverLift } from "./reveal";

export function MarketingSteps() {
  const { locale } = useLocale();
  const { steps } = useMarketingContent();

  return (
    <section className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 max-w-2xl">
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">
            {locale === "es" ? "Cómo empezar" : "How to get started"}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {locale === "es" ? "Tu agente en 3 pasos." : "Your agent in 3 steps."}
          </h2>
        </Reveal>
        <StaggerGroup className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <StaggerItem key={s.n}>
              <HoverLift>
                <div className="rounded-2xl border border-border bg-background p-6">
                  <div className="font-display text-3xl font-bold text-primary">{s.n}</div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
