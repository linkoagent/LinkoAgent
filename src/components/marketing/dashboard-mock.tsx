const kpis = [
  { label: "Conversaciones hoy", val: "312", delta: "↑ 12% vs ayer" },
  { label: "Activas ahora", val: "24", delta: "18 con IA · 6 con humano" },
  { label: "Tiempo resp. prom.", val: "00:42", delta: "↓ 9s" },
  { label: "Leads generados", val: "37", delta: "↑ 5" },
];

const bars = [38, 52, 44, 61, 57, 82, 49, 65, 58, 71, 66, 90, 74, 80];

const channels = [{ name: "WhatsApp", pct: 100, color: "bg-success" }];

export function MarketingDashboardMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-border bg-card-soft px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <div className="ml-1 font-display text-[11px] text-faint">app.linkoagent.com / dashboard</div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-card-soft p-3">
              <div className="font-display text-[10px] uppercase tracking-wide text-faint">{k.label}</div>
              <div className="mt-1 font-display text-lg text-foreground tabular-nums">{k.val}</div>
              <div className="mt-0.5 text-[11px] text-success">{k.delta}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <div className="rounded-xl bg-card-soft p-4">
            <div className="mb-3 font-display text-[11px] uppercase tracking-wide text-faint">
              Conversaciones · últimos 14 días
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${i === 5 || i === 11 ? "bg-star" : "bg-primary"} opacity-90`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-card-soft p-4">
            <div className="mb-3 font-display text-[11px] uppercase tracking-wide text-faint">Por canal</div>
            <div className="flex flex-col gap-2.5">
              {channels.map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-[12px]">
                  <span className="w-16 shrink-0 text-muted-foreground">{c.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div className={`h-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-display text-faint">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
