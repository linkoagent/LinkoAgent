import { prisma } from "@/lib/prisma";
import { GOOGLE_CALENDAR_PROVIDER } from "@/lib/googleCalendar/client";
import { GoogleCalendarProvider } from "./googleCalendarProvider";
import type { AgendaProvider } from "./types";

/** Único archivo de todo lib/agenda/ que conoce nombres concretos de proveedor — agregar Outlook
 * mañana es un caso nuevo acá, sin tocar rules.ts, service.ts ni los tools de IA. */
const SUPPORTED_PROVIDERS = [GOOGLE_CALENDAR_PROVIDER];

export async function getAgendaProviderForCompany(companyId: string): Promise<AgendaProvider | null> {
  const integration = await prisma.integration.findFirst({
    where: { companyId, provider: { in: SUPPORTED_PROVIDERS }, status: "CONNECTED" },
  });
  if (!integration) return null;

  if (integration.provider === GOOGLE_CALENDAR_PROVIDER) {
    return new GoogleCalendarProvider(integration);
  }
  return null;
}

export async function hasConnectedProvider(companyId: string): Promise<boolean> {
  return (await getAgendaProviderForCompany(companyId)) !== null;
}
