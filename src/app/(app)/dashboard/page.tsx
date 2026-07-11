import {
  MessageCircle,
  Clock,
  CheckCircle2,
  Users,
  Bot,
  Radio,
  Gauge,
  Coins,
  CalendarCheck,
  Mic,
} from "lucide-react";
import { requireCompanyContext } from "@/lib/tenant";
import { getDashboardData, formatSeconds } from "@/lib/metrics";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ConversationsChart } from "@/components/dashboard/conversations-chart";
import { AiHumanChart } from "@/components/dashboard/ai-human-chart";
import { formatUsd } from "@/lib/utils";

export default async function DashboardPage() {
  const ctx = await requireCompanyContext();
  const data = await getDashboardData(ctx.companyId);

  const plan = data.subscription?.plan;
  const usagePct = plan ? Math.round((data.subscription!.conversationsUsed / plan.maxConversationsMonth) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Hola, {ctx.userName.split(" ")[0]} ✦</h1>
        <p className="mt-1 text-sm text-muted-foreground">Así viene {ctx.companyName} hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Conversaciones activas" value={String(data.activeCount)} icon={MessageCircle} />
        <MetricCard label="Conversaciones hoy" value={String(data.todayCount)} icon={MessageCircle} accent="star" />
        <MetricCard label="Resueltas" value={String(data.resolvedCount)} icon={CheckCircle2} accent="success" />
        <MetricCard label="Derivadas a humano" value={String(data.handedOffCount)} icon={Users} accent="heart" />
        <MetricCard label="Tiempo prom. de respuesta" value={formatSeconds(data.frtSeconds)} icon={Clock} />
        <MetricCard label="% respondido por IA" value={`${data.aiSharePct}%`} icon={Bot} accent="primary" />
        <MetricCard label="Leads generados" value={String(data.leadsCount)} icon={Users} accent="star" />
        <MetricCard label="Turnos reservados (14 días)" value={String(data.appointmentsCount)} icon={CalendarCheck} accent="success" />
        <MetricCard label="Audios procesados (14 días)" value={String(data.voiceMessagesCount)} icon={Mic} accent="primary" />
        <MetricCard
          label="Canales conectados"
          value={`${data.connectedChannelsCount}/${data.channels.length || 0}`}
          icon={Radio}
        />
        <MetricCard label="Agentes activos" value={String(data.activeAgentsCount)} icon={Bot} />
        <MetricCard label="Uso del plan" value={plan ? `${usagePct}%` : "—"} hint={plan?.name} icon={Gauge} accent="star" />
        <MetricCard label="Tokens consumidos" value={data.tokensUsed.toLocaleString("es-AR")} icon={Coins} />
        <MetricCard label="Costo estimado del mes" value={formatUsd(data.costUsd)} icon={Coins} accent="heart" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground">Conversaciones por día</h3>
          <p className="text-xs text-muted-foreground">Últimos 14 días</p>
          <div className="mt-2">
            <ConversationsChart data={data.conversationsPerDay} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground">IA vs. humano</h3>
          <p className="text-xs text-muted-foreground">Mensajes enviados en total</p>
          <div className="mt-6 flex justify-center">
            <AiHumanChart ai={data.aiMessageCount} human={data.humanMessageCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
