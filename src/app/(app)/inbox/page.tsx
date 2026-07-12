import Link from "next/link";
import { requireCompanyContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon } from "@/components/channels/channel-icon";
import { CONVERSATION_STATUS_LABELS, CHANNEL_TYPE_LABELS } from "@/lib/plans";
import { formatDateTime, capitalizeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChannelType } from "@prisma/client";

const TABS = [
  { key: "all", label: "Todas", statuses: undefined },
  { key: "open", label: "Abiertas", statuses: ["NEW", "OPEN", "IN_PROGRESS"] },
  { key: "handoff", label: "Derivadas / pendientes", statuses: ["HANDED_OFF", "PENDING"] },
  { key: "closed", label: "Resueltas / cerradas", statuses: ["RESOLVED", "CLOSED"] },
] as const;

const CHANNEL_FILTERS = [
  { key: "all", label: "Todos los canales", type: undefined },
  { key: "whatsapp", label: "WhatsApp", type: "WHATSAPP" as ChannelType },
  { key: "instagram", label: "Instagram", type: "INSTAGRAM" as ChannelType },
] as const;

const SENTIMENT_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  positivo: "success",
  neutral: "outline",
  negativo: "destructive",
};

export default async function InboxPage({ searchParams }: { searchParams: { tab?: string; channel?: string } }) {
  const ctx = await requireCompanyContext();
  const activeTab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const activeChannelFilter = CHANNEL_FILTERS.find((c) => c.key === searchParams.channel) ?? CHANNEL_FILTERS[0];

  const conversations = await prisma.conversation.findMany({
    where: {
      companyId: ctx.companyId,
      ...(activeTab.statuses ? { status: { in: activeTab.statuses as any } } : {}),
      ...(activeChannelFilter.type ? { channel: { type: activeChannelFilter.type } } : {}),
    },
    include: { customer: true, channel: true, agent: true, assignedUser: true },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todas las conversaciones de tus canales conectados.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/inbox?tab=${tab.key}&channel=${activeChannelFilter.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab.key === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
          {CHANNEL_FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={`/inbox?tab=${activeTab.key}&channel=${filter.key}`}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeChannelFilter.key === filter.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.type && <ChannelIcon type={filter.type} />}
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {conversations.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No hay conversaciones en esta vista todavía. Probá simular un mensaje desde Canales.
          </div>
        )}

        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/inbox/${c.id}`}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-xs text-primary">
                {(c.customer.name ?? c.customer.phone ?? "?").slice(0, 2).toUpperCase()}
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
                  <ChannelIcon type={c.channel.type} className="h-2.5 w-2.5" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">
                  {c.customer.name ?? c.customer.phone ?? "Cliente sin nombre"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {CHANNEL_TYPE_LABELS[c.channel.type] ?? c.channel.type} · {c.agent?.name ?? "Sin agente"} {c.assignedUser ? `· ${c.assignedUser.name}` : ""}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {c.detectedSentiment && (
                <Badge variant={SENTIMENT_VARIANT[c.detectedSentiment] ?? "outline"}>{capitalizeLabel(c.detectedSentiment)}</Badge>
              )}
              {c.aiPaused && <Badge variant="warning">IA pausada</Badge>}
              <Badge variant="outline">{CONVERSATION_STATUS_LABELS[c.status] ?? c.status}</Badge>
              <span className="hidden text-muted-foreground sm:inline">{formatDateTime(c.lastMessageAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
