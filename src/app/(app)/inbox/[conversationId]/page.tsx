import { notFound } from "next/navigation";
import { requireCompanyContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CONVERSATION_STATUS_LABELS } from "@/lib/plans";
import { formatDateTime, cn, capitalizeLabel } from "@/lib/utils";
import {
  ReplyBox,
  AiPauseSwitch,
  ConversationLifecycleButtons,
  SummaryButton,
  NotesPanel,
  TagsPanel,
} from "@/components/inbox/actions";

const SENDER_LABEL: Record<string, string> = { CUSTOMER: "Cliente", AI: "IA", HUMAN: "Humano", SYSTEM: "Sistema" };

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const ctx = await requireCompanyContext();

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, companyId: ctx.companyId },
    include: {
      customer: true,
      channel: true,
      agent: true,
      assignedUser: true,
      messages: { orderBy: { createdAt: "asc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      tags: { include: { tag: true } },
    },
  });

  if (!conversation) notFound();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h1 className="font-display text-base font-semibold text-foreground">
              {conversation.customer.name ?? conversation.customer.phone ?? "Cliente"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {conversation.channel.type} · {conversation.customer.phone}
            </p>
          </div>
          <Badge variant="outline">{CONVERSATION_STATUS_LABELS[conversation.status] ?? conversation.status}</Badge>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ minHeight: 380, maxHeight: 560 }}>
          {conversation.messages.map((m) => {
            const isCustomer = m.sender === "CUSTOMER";
            return (
              <div key={m.id} className={cn("flex flex-col", isCustomer ? "items-start" : "items-end")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    isCustomer
                      ? "bg-secondary text-foreground"
                      : m.sender === "AI"
                        ? "bg-brand-button text-primary-foreground"
                        : "bg-star/20 text-foreground"
                  )}
                >
                  {m.content}
                </div>
                <span className="mt-1 text-[10.5px] text-muted-foreground">
                  {SENDER_LABEL[m.sender]} · {formatDateTime(m.createdAt)}
                </span>
              </div>
            );
          })}
          {conversation.messages.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay mensajes en esta conversación.</p>
          )}
        </div>

        <ReplyBox conversationId={conversation.id} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Control de IA
          </h3>
          <AiPauseSwitch conversationId={conversation.id} aiPaused={conversation.aiPaused} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acciones</h3>
          <ConversationLifecycleButtons conversationId={conversation.id} status={conversation.status} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Detección automática
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intención</span>
              <span className="text-foreground">
                {conversation.detectedIntent ? capitalizeLabel(conversation.detectedIntent) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sentimiento</span>
              <span className="text-foreground">
                {conversation.detectedSentiment ? capitalizeLabel(conversation.detectedSentiment) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agente</span>
              <span className="text-foreground">{conversation.agent?.name ?? "Sin asignar"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asignado a</span>
              <span className="text-foreground">{conversation.assignedUser?.name ?? "Nadie"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen IA</h3>
          <SummaryButton conversationId={conversation.id} summary={conversation.summary} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etiquetas</h3>
          <TagsPanel conversationId={conversation.id} tags={conversation.tags} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notas internas
          </h3>
          <NotesPanel conversationId={conversation.id} notes={conversation.notes} />
        </div>
      </div>
    </div>
  );
}
