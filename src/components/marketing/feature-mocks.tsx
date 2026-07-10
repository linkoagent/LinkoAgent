function BrowserChrome({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card-soft px-4 py-3">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
      </div>
      <div className="ml-1 font-display text-[11px] text-faint">app.linkoagent.com{path}</div>
    </div>
  );
}

/** Mockup de /agents/new — se ve en la sección "Creá tu agente en minutos". */
export function AgentBuilderMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      <BrowserChrome path="/agents/new" />
      <div className="flex flex-col gap-3 p-5">
        <div className="rounded-xl bg-card-soft p-3">
          <div className="font-display text-[10px] uppercase tracking-wide text-faint">Rol</div>
          <div className="mt-1 text-sm text-foreground">Atención al cliente</div>
        </div>
        <div className="rounded-xl bg-card-soft p-3">
          <div className="font-display text-[10px] uppercase tracking-wide text-faint">Tono de marca</div>
          <div className="mt-1 text-sm text-foreground">Cercano, profesional, directo</div>
        </div>
        <div className="mt-1 rounded-xl bg-background p-3">
          <div className="ml-auto max-w-[75%] rounded-lg rounded-tr-sm bg-secondary px-3 py-2 text-[12.5px] text-foreground">
            ¿Hacen envíos a todo el país?
          </div>
          <div className="mt-2 max-w-[75%] rounded-lg rounded-tl-sm bg-brand-button px-3 py-2 text-[12.5px] text-white">
            Sí, envíos a todo el país en 24-48hs. ¿Querés que te pase el costo según tu zona?
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mockup de /metrics — versión compacta del que se usa en el Hero. */
export function AnalyticsMock() {
  const kpis = [
    { label: "Conversaciones hoy", val: "42" },
    { label: "% respondido IA", val: "77%" },
    { label: "Tiempo resp.", val: "00:38" },
  ];
  const bars = [38, 52, 44, 61, 57, 82, 65];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      <BrowserChrome path="/metrics" />
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-card-soft p-3">
              <div className="font-display text-[9.5px] uppercase tracking-wide text-faint">{k.label}</div>
              <div className="mt-1 font-display text-base text-foreground tabular-nums">{k.val}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-card-soft p-4">
          <div className="mb-3 font-display text-[11px] uppercase tracking-wide text-faint">Temas más consultados</div>
          <div className="flex h-20 items-end gap-1.5">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary opacity-90" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mockup de /inbox — lista de conversaciones como la ve el cliente de verdad. */
export function InboxMock() {
  const rows = [
    { name: "María G.", snippet: "¿Cuál es el horario de atención?", status: "Abierto", statusColor: "bg-success/15 text-success" },
    { name: "Javier P.", snippet: "Necesito hablar con una persona", status: "Derivado", statusColor: "bg-accent/15 text-accent" },
    { name: "Lucía R.", snippet: "Gracias, quedó todo claro", status: "Resuelto", statusColor: "bg-secondary text-muted-foreground" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      <BrowserChrome path="/inbox" />
      <div className="flex flex-col gap-2 p-4">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-3 rounded-xl bg-card-soft px-3.5 py-3">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-foreground">{r.name}</div>
              <div className="truncate text-[12px] text-muted-foreground">{r.snippet}</div>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 font-display text-[9.5px] uppercase tracking-wide ${r.statusColor}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
