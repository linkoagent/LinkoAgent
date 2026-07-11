import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getDashboardData(companyId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const rangeStart = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

  const conversationIds = (await prisma.conversation.findMany({ where: { companyId }, select: { id: true } })).map(
    (c) => c.id
  );

  const [
    activeCount,
    todayCount,
    resolvedCount,
    pendingCount,
    handedOffCount,
    channels,
    agents,
    subscription,
    usageAgg,
    aiMessageCount,
    humanMessageCount,
    leadsCount,
    appointmentsCount,
    voiceMessagesCount,
    conversationsPerDayRaw,
    frtRaw,
  ] = await Promise.all([
    prisma.conversation.count({ where: { companyId, status: { notIn: ["CLOSED", "RESOLVED"] } } }),
    prisma.conversation.count({ where: { companyId, createdAt: { gte: todayStart } } }),
    prisma.conversation.count({ where: { companyId, status: "RESOLVED" } }),
    prisma.conversation.count({ where: { companyId, status: "PENDING" } }),
    prisma.conversation.count({ where: { companyId, status: "HANDED_OFF" } }),
    prisma.channel.findMany({ where: { companyId } }),
    prisma.agent.findMany({ where: { companyId } }),
    prisma.subscription.findUnique({ where: { companyId }, include: { plan: true } }),
    prisma.aiUsageLog.aggregate({ where: { companyId }, _sum: { totalTokens: true, costUsd: true } }),
    prisma.message.count({ where: { conversationId: { in: conversationIds }, sender: "AI" } }),
    prisma.message.count({ where: { conversationId: { in: conversationIds }, sender: "HUMAN" } }),
    prisma.lead.count({ where: { companyId } }),
    prisma.appointment.count({ where: { companyId, status: "CONFIRMED", createdAt: { gte: rangeStart } } }),
    prisma.message.count({
      where: { conversationId: { in: conversationIds }, isVoiceMessage: true, createdAt: { gte: rangeStart } },
    }),
    prisma.$queryRawUnsafe<{ day: Date; count: number }[]>(
      `SELECT DATE("createdAt") as day, COUNT(*)::int as count
       FROM "Conversation" WHERE "companyId" = $1 AND "createdAt" >= $2
       GROUP BY day ORDER BY day ASC`,
      companyId,
      rangeStart
    ),
    prisma.$queryRawUnsafe<{ avg_seconds: number | null }[]>(
      `SELECT AVG(EXTRACT(EPOCH FROM (fr."createdAt" - fc."createdAt"))) as avg_seconds
       FROM "Conversation" c
       JOIN LATERAL (
         SELECT "createdAt" FROM "Message" WHERE "conversationId" = c.id AND sender = 'CUSTOMER' ORDER BY "createdAt" ASC LIMIT 1
       ) fc ON true
       JOIN LATERAL (
         SELECT "createdAt" FROM "Message" WHERE "conversationId" = c.id AND sender IN ('AI','HUMAN') AND "createdAt" > fc."createdAt" ORDER BY "createdAt" ASC LIMIT 1
       ) fr ON true
       WHERE c."companyId" = $1`,
      companyId
    ),
  ]);

  const totalMessages = aiMessageCount + humanMessageCount;
  const aiSharePct = totalMessages > 0 ? Math.round((aiMessageCount / totalMessages) * 100) : 0;

  const conversationsPerDay: { date: string; count: number }[] = [];
  const byDay = new Map(conversationsPerDayRaw.map((r) => [new Date(r.day).toISOString().slice(0, 10), r.count]));
  for (let i = 13; i >= 0; i--) {
    const d = new Date(rangeStart.getTime() + (13 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    conversationsPerDay.push({ date: key, count: byDay.get(key) ?? 0 });
  }

  const frtSeconds = frtRaw[0]?.avg_seconds ? Math.round(Number(frtRaw[0].avg_seconds)) : null;

  return {
    activeCount,
    todayCount,
    resolvedCount,
    pendingCount,
    handedOffCount,
    channels,
    agents,
    activeAgentsCount: agents.filter((a) => a.isActive).length,
    connectedChannelsCount: channels.filter((c) => c.status === "CONNECTED").length,
    subscription,
    tokensUsed: usageAgg._sum.totalTokens ?? 0,
    costUsd: usageAgg._sum.costUsd ?? 0,
    aiMessageCount,
    humanMessageCount,
    aiSharePct,
    leadsCount,
    appointmentsCount,
    voiceMessagesCount,
    conversationsPerDay,
    frtSeconds,
  };
}

export function formatSeconds(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

export interface MetricsFilters {
  from?: Date;
  to?: Date;
  channelId?: string;
  agentId?: string;
  status?: string;
}

export async function getFilteredMetrics(companyId: string, filters: MetricsFilters) {
  const where = {
    companyId,
    ...(filters.channelId ? { channelId: filters.channelId } : {}),
    ...(filters.agentId ? { agentId: filters.agentId } : {}),
    ...(filters.status ? { status: filters.status as any } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const conversations = await prisma.conversation.findMany({
    where,
    select: {
      id: true,
      status: true,
      detectedIntent: true,
      detectedSentiment: true,
      channelId: true,
      agentId: true,
      createdAt: true,
    },
  });

  const total = conversations.length;
  const resolved = conversations.filter((c) => c.status === "RESOLVED").length;
  const handedOff = conversations.filter((c) => c.status === "HANDED_OFF").length;
  const closed = conversations.filter((c) => c.status === "CLOSED").length;

  const intentCounts = new Map<string, number>();
  const sentimentCounts = new Map<string, number>();
  for (const c of conversations) {
    if (c.detectedIntent) intentCounts.set(c.detectedIntent, (intentCounts.get(c.detectedIntent) ?? 0) + 1);
    if (c.detectedSentiment) sentimentCounts.set(c.detectedSentiment, (sentimentCounts.get(c.detectedSentiment) ?? 0) + 1);
  }

  const topIntents = [...intentCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return {
    total,
    resolved,
    handedOff,
    closed,
    resolutionRatePct: total > 0 ? Math.round((resolved / total) * 100) : 0,
    handoffRatePct: total > 0 ? Math.round((handedOff / total) * 100) : 0,
    topIntents,
    sentimentCounts: Object.fromEntries(sentimentCounts),
  };
}
