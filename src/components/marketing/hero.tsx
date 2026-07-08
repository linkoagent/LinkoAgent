import Link from "next/link";
import { hero } from "@/data/marketing";
import { MarketingDashboardMock } from "./dashboard-mock";

export function MarketingHero() {
  return (
    <section id="top" className="bg-brand-glow px-6 pb-20 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary-soft/15 px-3 py-1 font-display text-[11px] uppercase tracking-wide text-primary">
            {hero.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl">{hero.title}</h1>
          <p className="mt-4 font-display text-lg text-foreground">{hero.subtitle}</p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{hero.body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-brand-button px-6 py-3 font-display text-[13px] text-white shadow-[0_10px_30px_-8px_hsl(258_92%_71%/0.6)] transition hover:brightness-110"
            >
              Crear cuenta gratis
            </Link>
            <a
              href="https://wa.me/5493516362806"
              className="rounded-lg border border-border bg-card px-6 py-3 font-display text-[13px] text-foreground transition hover:border-faint"
            >
              Hablar por WhatsApp
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {hero.chips.map((c) => (
              <span key={c} className="rounded-full border border-border px-3 py-1 font-display text-[11px] text-faint">
                {c}
              </span>
            ))}
          </div>
        </div>

        <MarketingDashboardMock />
      </div>
    </section>
  );
}
