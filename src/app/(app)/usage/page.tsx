import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { formatDate, formatUsd } from "@/lib/utils";

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-display tabular-nums text-foreground">
          {used.toLocaleString("es-AR")} / {max >= 999999 ? "∞" : max.toLocaleString("es-AR")}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-brand-button" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function UsagePage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const [subscription, agentsCount, channelsCount, usersCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { companyId: ctx.companyId }, include: { plan: true } }),
    prisma.agent.count({ where: { companyId: ctx.companyId } }),
    prisma.channel.count({ where: { companyId: ctx.companyId, status: "CONNECTED" } }),
    prisma.membership.count({ where: { companyId: ctx.companyId } }),
  ]);

  if (!subscription) {
    return <p className="text-sm text-muted-foreground">Esta empresa todavía no tiene un plan asignado.</p>;
  }

  const { plan } = subscription;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Uso y plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan actual: {plan.name}.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <UsageBar used={subscription.conversationsUsed} max={plan.maxConversationsMonth} label="Conversaciones este mes" />
          <UsageBar used={agentsCount} max={plan.maxAgents} label="Agentes de IA" />
          <UsageBar used={channelsCount} max={plan.maxChannels} label="Canales conectados" />
          <UsageBar used={usersCount} max={plan.maxUsers} label="Usuarios del equipo" />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precio mensual</span>
            <span className="font-display text-foreground">US$ {plan.priceUsd}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tokens consumidos</span>
            <span className="font-display tabular-nums text-foreground">{subscription.tokensUsed.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Costo estimado de IA</span>
            <span className="font-display text-foreground">{formatUsd(subscription.costUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Próxima facturación</span>
            <span className="font-display text-foreground">{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span className="font-display text-foreground">{subscription.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
