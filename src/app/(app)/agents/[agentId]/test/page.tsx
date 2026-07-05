import { notFound } from "next/navigation";
import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { TestChat } from "@/components/agents/test-chat";

export default async function AgentTestPage({ params }: { params: { agentId: string } }) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const agent = await prisma.agent.findFirst({ where: { id: params.agentId, companyId: ctx.companyId } });
  if (!agent) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Probar a {agent.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta conversación no se guarda ni cuenta como uso del plan: es solo para validar la configuración.
        </p>
      </div>
      <TestChat agentId={agent.id} />
    </div>
  );
}
