import Link from "next/link";
import { features } from "@/data/marketing";

export function MarketingFeatures() {
  return (
    <section id="producto" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <span className="font-display text-[11px] uppercase tracking-wide text-faint">Producto</span>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Todo lo que necesitás para no perder una conversación.</h2>
      </div>

      <div className="flex flex-col gap-20">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
          >
            <div>
              <span className="font-display text-[11px] uppercase tracking-wide text-heart">{f.kicker}</span>
              <h3 className="mt-2 text-2xl font-bold text-foreground">{f.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                    <span className="mt-0.5 font-display text-primary">›</span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-lg bg-brand-button px-5 py-2.5 font-display text-[12.5px] text-white transition hover:brightness-110"
                >
                  {f.cta}
                </Link>
                <a
                  href="/#contacto"
                  className="rounded-lg border border-border px-5 py-2.5 font-display text-[12.5px] text-muted-foreground transition hover:border-faint"
                >
                  Agendar demo
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="flex h-56 flex-col justify-between rounded-xl bg-background p-5">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                </div>
                <div className="font-display text-5xl font-bold text-border">{String(i + 1).padStart(2, "0")}</div>
                <div className="font-display text-[11px] text-faint">{f.kicker}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
