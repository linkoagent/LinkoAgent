import Link from "next/link";
import { Plus, MessageSquareText } from "lucide-react";
import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENT_TYPE_LABELS } from "@/lib/plans";

export default async function AgentsPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const agents = await prisma.agent.findMany({
    where: { companyId: ctx.companyId },
    include: { channels: { include: { channel: true } }, _count: { select: { conversations: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Agentes de IA</h1>
          <p className="mt-1 text-sm text-muted-foreground">Creá y entrená a tu equipo de agentes.</p>
        </div>
        <Button asChild>
          <Link href="/agents/new">
            <Plus className="h-4 w-4" /> Nuevo agente
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground">{agent.name}</h3>
                <p className="text-xs text-muted-foreground">{AGENT_TYPE_LABELS[agent.type] ?? agent.type}</p>
              </div>
              <Badge variant={agent.isActive ? "success" : "outline"}>{agent.isActive ? "Activo" : "Inactivo"}</Badge>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{agent.instructions}</p>
            <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
              <span>{agent.channels.map((c) => c.channel.type).join(", ") || "Sin canal"}</span>
              <span className="flex items-center gap-1">
                <MessageSquareText className="h-3.5 w-3.5" /> {agent._count.conversations}
              </span>
            </div>
          </Link>
        ))}

        {agents.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Todavía no creaste ningún agente.{" "}
            <Link href="/agents/new" className="text-primary hover:underline">
              Creá el primero
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}
