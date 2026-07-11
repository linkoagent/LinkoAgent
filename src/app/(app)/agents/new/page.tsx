import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AgentForm } from "@/components/agents/agent-form";
import { createAgent } from "@/lib/actions/agents";
import { GOOGLE_CALENDAR_PROVIDER } from "@/lib/googleCalendar/client";

export default async function NewAgentPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const [channels, knowledgeSources, calendarIntegration] = await Promise.all([
    prisma.channel.findMany({ where: { companyId: ctx.companyId } }),
    prisma.knowledgeSource.findMany({ where: { companyId: ctx.companyId } }),
    prisma.integration.findUnique({
      where: { companyId_provider: { companyId: ctx.companyId, provider: GOOGLE_CALENDAR_PROVIDER } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Nuevo agente</h1>
        <p className="mt-1 text-sm text-muted-foreground">Definí su rol, tono e instrucciones.</p>
      </div>
      <AgentForm
        channels={channels}
        knowledgeSources={knowledgeSources}
        calendarConnected={calendarIntegration?.status === "CONNECTED"}
        action={createAgent}
        submitLabel="Crear agente"
      />
    </div>
  );
}
