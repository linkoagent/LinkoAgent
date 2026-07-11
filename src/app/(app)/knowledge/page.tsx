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

const CORRECTION_TYPE_LABEL: Record<string, string> = { CORRECTION: "Corregida", APPROVAL: "Aprobada" };

export default async function KnowledgePage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const [sources, corrections] = await Promise.all([
    prisma.knowledgeSource.findMany({
      where: { companyId: ctx.companyId },
      include: { _count: { select: { chunks: true } } },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.messageCorrection.findMany({
      where: { companyId: ctx.companyId },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const readyCount = sources.filter((s) => s.status === "READY").length;
  const processingCount = sources.filter((s) => s.status === "PROCESSING" || s.status === "PENDING").length;
  const errorCount = sources.filter((s) => s.status === "ERROR").length;
  const lastSync = sources.reduce<Date | null>((latest, s) => {
    if (!s.lastProcessedAt) return latest;
    return !latest || s.lastProcessedAt > latest ? s.lastProcessedAt : latest;
  }, null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Base de conocimiento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrená a tus agentes con FAQs, texto propio, o subiendo Word, Excel o CSV. Cada fuente se indexa para
          que la puedan buscar por significado. El agente también puede agregar, actualizar y borrar datos acá
          directamente por WhatsApp (solo el staff autorizado).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Documentos</div>
          <div className="mt-1 font-display text-xl text-foreground">{sources.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Listos</div>
          <div className="mt-1 font-display text-xl text-success">{readyCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Procesando</div>
          <div className="mt-1 font-display text-xl text-accent">{processingCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Con error</div>
          <div className="mt-1 font-display text-xl text-destructive">{errorCount}</div>
        </div>
      </div>
      {lastSync && (
        <p className="text-xs text-muted-foreground">Última sincronización: {formatDate(lastSync)}</p>
      )}

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
                {s.lastProcessedAt ? ` · Última sincronización: ${formatDate(s.lastProcessedAt)}` : ""}
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

      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">Historial de aprendizaje</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada vez que corregís o aprobás una respuesta de la IA desde el Inbox, queda un registro acá.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {corrections.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={c.type === "CORRECTION" ? "warning" : "success"}>{CORRECTION_TYPE_LABEL[c.type]}</Badge>
              <span className="text-muted-foreground">
                {c.createdBy.name} · {formatDate(c.createdAt)}
              </span>
            </div>
            {c.customerMessage && <p className="mt-2 text-muted-foreground">Pregunta: {c.customerMessage}</p>}
            <p className="mt-1 text-foreground">Respuesta original: {c.originalContent}</p>
            {c.correctedContent && <p className="mt-1 text-success">Corregida a: {c.correctedContent}</p>}
          </div>
        ))}
        {corrections.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Todavía no corregiste ni aprobaste ninguna respuesta.
          </p>
        )}
      </div>
    </div>
  );
}
