import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { WhatsAppConnectForm } from "@/components/channels/whatsapp-connect-form";
import { ChannelStatusCard } from "@/components/channels/channel-status-card";
import { SimulateMessageForm } from "@/components/channels/simulate-message-form";
import { EmbeddedSignupButton } from "@/components/channels/embedded-signup-button";

export default async function ChannelsPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const whatsappChannel = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "WHATSAPP" } });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Canales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Instagram y Messenger llegan en la próxima etapa — el MVP arranca con WhatsApp Cloud API.
        </p>
      </div>

      {whatsappChannel && <ChannelStatusCard channel={whatsappChannel} />}
      <EmbeddedSignupButton />
      <WhatsAppConnectForm channel={whatsappChannel} />
      {whatsappChannel && <SimulateMessageForm channelId={whatsappChannel.id} />}

      {ctx.role === "SUPER_ADMIN" && (
        <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Webhook para conectar con Meta (solo vos)</p>
          <p className="mt-1">
            Configurá en tu app de Meta for Developers la URL de callback apuntando a{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">/api/webhooks/whatsapp</code> de este
            dominio, con el token de verificación definido en <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">WHATSAPP_WEBHOOK_VERIFY_TOKEN</code>.
          </p>
        </div>
      )}
    </div>
  );
}
