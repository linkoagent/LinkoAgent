import { benefits } from "@/data/marketing";

export function MarketingBenefits() {
  return (
    <section className="border-y border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <span className="font-display text-[11px] uppercase tracking-wide text-faint">Por qué Linko Agent</span>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Menos tiempo respondiendo, más tiempo vendiendo.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl bg-background p-6">
              <h4 className="font-bold text-foreground">{b.title}</h4>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
