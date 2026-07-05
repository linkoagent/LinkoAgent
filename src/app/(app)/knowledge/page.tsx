import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { NewSourceForm } from "@/components/knowledge/new-source-form";
import { SourceActions } from "@/components/knowledge/source-actions";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  READY: "success",
  PROCESSING: "warning",
  PENDING: "outline",
  ERROR: "destructive",
};

export default async function KnowledgePage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const sources = await prisma.knowledgeSource.findMany({
    where: { companyId: ctx.companyId },
    include: { _count: { select: { chunks: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Base de conocimiento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrená a tus agentes con FAQs y texto propio. Cada fuente se indexa para que la puedan buscar por significado.
        </p>
      </div>

      <NewSourceForm />

      <div className="flex flex-col gap-3">
        {sources.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{s.name}</h3>
                <Badge variant="outline">{s.type}</Badge>
                <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cargado el {formatDate(s.uploadedAt)} · {s._count.chunks} fragmentos indexados
                {s.errorMessage ? ` · Error: ${s.errorMessage}` : ""}
              </p>
            </div>
            <SourceActions sourceId={s.id} />
          </div>
        ))}

        {sources.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Todavía no cargaste conocimiento para tus agentes.
          </div>
        )}
      </div>
    </div>
  );
}
