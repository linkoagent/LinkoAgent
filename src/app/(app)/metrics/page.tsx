import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getFilteredMetrics } from "@/lib/metrics";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CheckCircle2, Users, XCircle, ListChecks } from "lucide-react";

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; channelId?: string; agentId?: string; status?: string };
}) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const [channels, agents] = await Promise.all([
    prisma.channel.findMany({ where: { companyId: ctx.companyId } }),
    prisma.agent.findMany({ where: { companyId: ctx.companyId } }),
  ]);

  const filters = {
    from: searchParams.from ? new Date(searchParams.from) : undefined,
    to: searchParams.to ? new Date(searchParams.to) : undefined,
    channelId: searchParams.channelId || undefined,
    agentId: searchParams.agentId || undefined,
    status: searchParams.status || undefined,
  };

  const metrics = await getFilteredMetrics(ctx.companyId, filters);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Métricas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Filtrá por fecha, canal, agente o estado.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4" method="get">
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="from" className="text-muted-foreground">Desde</label>
          <input id="from" name="from" type="date" defaultValue={searchParams.from} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="to" className="text-muted-foreground">Hasta</label>
          <input id="to" name="to" type="date" defaultValue={searchParams.to} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="channelId" className="text-muted-foreground">Canal</label>
          <select id="channelId" name="channelId" defaultValue={searchParams.channelId ?? ""} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="">Todos</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>{c.type}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="agentId" className="text-muted-foreground">Agente</label>
          <select id="agentId" name="agentId" defaultValue={searchParams.agentId ?? ""} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="">Todos</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="status" className="text-muted-foreground">Estado</label>
          <select id="status" name="status" defaultValue={searchParams.status ?? ""} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="">Todos</option>
            <option value="OPEN">Abierto</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="HANDED_OFF">Derivado</option>
            <option value="RESOLVED">Resuelto</option>
            <option value="CLOSED">Cerrado</option>
          </select>
        </div>
        <button type="submit" className="h-9 rounded-lg bg-brand-button px-4 text-sm font-medium text-primary-foreground">
          Filtrar
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Conversaciones" value={String(metrics.total)} icon={ListChecks} />
        <MetricCard label="Tasa de resolución" value={`${metrics.resolutionRatePct}%`} icon={CheckCircle2} accent="success" />
        <MetricCard label="Tasa de derivación" value={`${metrics.handoffRatePct}%`} icon={Users} accent="star" />
        <MetricCard label="Cerradas" value={String(metrics.closed)} icon={XCircle} accent="heart" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground">Temas más consultados</h3>
          <div className="mt-3 flex flex-col gap-2">
            {metrics.topIntents.length === 0 && <p className="text-xs text-muted-foreground">Sin datos todavía.</p>}
            {metrics.topIntents.map(([intent, count]) => (
              <div key={intent} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{intent.replace(/_/g, " ")}</span>
                <span className="font-display tabular-nums text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground">Sentimiento del cliente</h3>
          <div className="mt-3 flex flex-col gap-2">
            {Object.entries(metrics.sentimentCounts).length === 0 && (
              <p className="text-xs text-muted-foreground">Sin datos todavía.</p>
            )}
            {Object.entries(metrics.sentimentCounts).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s}</span>
                <span className="font-display tabular-nums text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
