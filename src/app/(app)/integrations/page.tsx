import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { connectGoogleCalendar } from "@/lib/actions/integrations";
import { connectGoogleSheets } from "@/lib/actions/integrationsSheets";
import { GOOGLE_CALENDAR_PROVIDER, GOOGLE_CALENDAR_MOCK } from "@/lib/googleCalendar/client";
import { GOOGLE_SHEETS_PROVIDER, GOOGLE_SHEETS_MOCK } from "@/lib/googleSheets/client";
import { GoogleCalendarStatusCard } from "@/components/integrations/google-calendar-status-card";
import { GoogleSheetsStatusCard } from "@/components/integrations/google-sheets-status-card";
import { Button } from "@/components/ui/button";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string; sheetsConnected?: string };
}) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const googleCalendar = await prisma.integration.findUnique({
    where: { companyId_provider: { companyId: ctx.companyId, provider: GOOGLE_CALENDAR_PROVIDER } },
  });
  const googleSheets = await prisma.integration.findUnique({
    where: { companyId_provider: { companyId: ctx.companyId, provider: GOOGLE_SHEETS_PROVIDER } },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Integraciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conectá Google Calendar para que el agente pueda reservar, cancelar y reprogramar turnos por vos. El resto de
          las integraciones llega en próximas etapas.
        </p>
      </div>

      {searchParams.connected && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          Google Calendar conectado correctamente.
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No se pudo conectar la integración ({searchParams.error}).
        </div>
      )}
      {searchParams.sheetsConnected && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          Google Sheets conectado correctamente.
        </div>
      )}

      {googleCalendar && googleCalendar.status === "CONNECTED" ? (
        <GoogleCalendarStatusCard integration={googleCalendar} />
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">Google Calendar</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {GOOGLE_CALENDAR_MOCK
                ? "Modo simulado: se conecta al toque, sin credenciales reales de Google."
                : "Vas a ser redirigido a Google para autorizar el acceso a tu calendario."}
            </p>
          </div>
          <form action={connectGoogleCalendar}>
            <Button type="submit" size="sm">
              Conectar Google Calendar
            </Button>
          </form>
        </div>
      )}

      {googleSheets && googleSheets.status === "CONNECTED" ? (
        <GoogleSheetsStatusCard integration={googleSheets} />
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">Google Sheets (stock)</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {GOOGLE_SHEETS_MOCK
                ? "Modo simulado: se conecta al toque, sin credenciales reales de Google."
                : "Vas a ser redirigido a Google para autorizar el acceso a tus planillas."}
            </p>
          </div>
          <form action={connectGoogleSheets}>
            <Button type="submit" size="sm">
              Conectar Google Sheets
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
