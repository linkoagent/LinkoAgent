"use client";

import { useLocale, useMarketingContent } from "./locale-provider";
import { Reveal, StaggerGroup, StaggerItem, HoverLift } from "./reveal";

export function MarketingBenefits() {
  const { locale } = useLocale();
  const { benefits } = useMarketingContent();

  return (
    <section className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 max-w-2xl">
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">
            {locale === "es" ? "Por qué Linko Agent" : "Why Linko Agent"}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {locale === "es" ? "Menos tiempo respondiendo, más tiempo vendiendo." : "Less time replying, more time selling."}
          </h2>
        </Reveal>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <StaggerItem key={b.title}>
              <HoverLift>
                <div className="rounded-2xl bg-background p-6">
                  <h4 className="font-bold text-foreground">{b.title}</h4>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{b.body}</p>
                </div>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
