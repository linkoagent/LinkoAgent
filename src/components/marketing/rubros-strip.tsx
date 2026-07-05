import { rubros } from "@/data/marketing";

export function RubrosStrip() {
  return (
    <section className="border-y border-border bg-card py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-display text-[11px] uppercase tracking-wide text-faint">
          Pensado para negocios que reciben muchas conversaciones por día
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {rubros.map((r) => (
            <span key={r} className="rounded-full border border-border px-3.5 py-1.5 text-[13px] text-muted-foreground">
              {r}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
