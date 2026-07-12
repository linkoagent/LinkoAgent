import { notFound } from "next/navigation";
import { requireCompanyContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ChannelIcon } from "@/components/channels/channel-icon";
import { CONVERSATION_STATUS_LABELS, CHANNEL_TYPE_LABELS } from "@/lib/plans";
import { capitalizeLabel } from "@/lib/utils";
import {
  ReplyBox,
  AiPauseSwitch,
  ConversationLifecycleButtons,
  SummaryButton,
  NotesPanel,
  TagsPanel,
} from "@/components/inbox/actions";
import { ConversationMessages } from "@/components/inbox/conversation-messages";

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
      <div className="flex h-[75vh] min-h-[520px] flex-col rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h1 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <ChannelIcon type={conversation.channel.type} />
              {conversation.customer.name ?? conversation.customer.phone ?? "Cliente"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {CHANNEL_TYPE_LABELS[conversation.channel.type] ?? conversation.channel.type}
              {conversation.customer.phone ? ` · ${conversation.customer.phone}` : ""}
            </p>
          </div>
          <Badge variant="outline">{CONVERSATION_STATUS_LABELS[conversation.status] ?? conversation.status}</Badge>
        </div>

        <ConversationMessages messages={conversation.messages} />

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
