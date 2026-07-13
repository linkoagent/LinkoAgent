import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { WhatsAppConnectForm } from "@/components/channels/whatsapp-connect-form";
import { ChannelStatusCard } from "@/components/channels/channel-status-card";
import { SimulateMessageForm } from "@/components/channels/simulate-message-form";
import { EmbeddedSignupButton } from "@/components/channels/embedded-signup-button";
import { InstagramStatusCard } from "@/components/channels/instagram-status-card";
import { InstagramSimulateForm } from "@/components/channels/instagram-simulate-form";
import { connectInstagramChannel } from "@/lib/actions/instagramChannel";
import { INSTAGRAM_MOCK } from "@/lib/instagram/oauth";
import { Button } from "@/components/ui/button";

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: { error?: string; instagramConnected?: string };
}) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const [whatsappChannel, instagramChannel] = await Promise.all([
    prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "WHATSAPP" } }),
    prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "INSTAGRAM" } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Canales</h1>
        <p className="mt-1 text-sm text-muted-foreground">WhatsApp e Instagram Direct.</p>
      </div>

      {searchParams.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No se pudo conectar el canal ({searchParams.error}).
        </div>
      )}
      {searchParams.instagramConnected && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          Instagram conectado correctamente.
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-foreground">WhatsApp</h2>
        {whatsappChannel && whatsappChannel.status === "CONNECTED" && <ChannelStatusCard channel={whatsappChannel} />}
        <div className="mt-3 flex flex-col gap-3">
          <EmbeddedSignupButton />
          <WhatsAppConnectForm channel={whatsappChannel} />
          {whatsappChannel && whatsappChannel.status === "CONNECTED" && <SimulateMessageForm channelId={whatsappChannel.id} />}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-foreground">Instagram</h2>
        {instagramChannel && instagramChannel.status === "CONNECTED" ? (
          <div className="flex flex-col gap-3">
            <InstagramStatusCard channel={instagramChannel} />
            <InstagramSimulateForm channelId={instagramChannel.id} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">Instagram Direct</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {INSTAGRAM_MOCK
                  ? "Modo simulado: se conecta al toque, sin credenciales reales de Meta."
                  : "Vas a ser redirigido a Instagram para autorizar el acceso a tus mensajes directos."}
              </p>
            </div>
            <form action={connectInstagramChannel}>
              <Button type="submit" size="sm">
                Conectar Instagram
              </Button>
            </form>
          </div>
        )}
      </div>

      {ctx.role === "SUPER_ADMIN" && (
        <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Webhooks para conectar con Meta (solo vos)</p>
          <p className="mt-1">
            WhatsApp: URL de callback apuntando a{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">/api/webhooks/whatsapp</code>, token en{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">WHATSAPP_WEBHOOK_VERIFY_TOKEN</code>.
          </p>
          <p className="mt-1">
            Instagram: URL de callback apuntando a{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">/api/webhooks/instagram</code>, token en{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-foreground">INSTAGRAM_WEBHOOK_VERIFY_TOKEN</code>.
          </p>
        </div>
      )}
    </div>
  );
}
