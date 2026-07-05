import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareCode, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { AgentForm } from "@/components/agents/agent-form";
import { updateAgent, deleteAgent } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";

export default async function EditAgentPage({ params }: { params: { agentId: string } }) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const [agent, channels, knowledgeSources] = await Promise.all([
    prisma.agent.findFirst({
      where: { id: params.agentId, companyId: ctx.companyId },
      include: { channels: true, knowledgeSources: true },
    }),
    prisma.channel.findMany({ where: { companyId: ctx.companyId } }),
    prisma.knowledgeSource.findMany({ where: { companyId: ctx.companyId } }),
  ]);

  if (!agent) notFound();

  const updateWithId = async (formData: FormData) => {
    "use server";
    await updateAgent(agent.id, formData);
  };
  const deleteThis = async () => {
    "use server";
    await deleteAgent(agent.id);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{agent.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Editá su configuración o probalo antes de activarlo.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="subtle">
            <Link href={`/agents/${agent.id}/test`}>
              <MessageSquareCode className="h-4 w-4" /> Probar agente
            </Link>
          </Button>
          <form action={deleteThis}>
            <Button type="submit" variant="destructive" size="icon" aria-label="Eliminar agente">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <AgentForm
        agent={agent}
        channels={channels}
        knowledgeSources={knowledgeSources}
        selectedChannelIds={agent.channels.map((c) => c.channelId)}
        selectedSourceIds={agent.knowledgeSources.map((s) => s.sourceId)}
        action={updateWithId}
      />
    </div>
  );
}
