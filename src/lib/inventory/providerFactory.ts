import { prisma } from "@/lib/prisma";
import { GOOGLE_SHEETS_PROVIDER } from "@/lib/googleSheets/client";
import { LocalInventoryProvider } from "./localProvider";
import { GoogleSheetsInventoryProvider } from "./googleSheetsProvider";
import type { InventoryProvider } from "./types";

/**
 * A diferencia de getAgendaProviderForCompany, esta factory NUNCA devuelve null: "sin stock
 * conectado" no es un estado válido, siempre hay que poder leer/escribir algo. Si no hay Google
 * Sheets conectada (o falta el spreadsheetId), cae al proveedor local (Product de Postgres).
 */
export async function getInventoryProviderForCompany(companyId: string): Promise<InventoryProvider> {
  const integration = await prisma.integration.findUnique({
    where: { companyId_provider: { companyId, provider: GOOGLE_SHEETS_PROVIDER } },
  });
  if (integration?.status === "CONNECTED" && integration.spreadsheetId) {
    return new GoogleSheetsInventoryProvider(integration);
  }
  return new LocalInventoryProvider(companyId);
}

export async function isSheetsConnected(companyId: string): Promise<boolean> {
  const provider = await getInventoryProviderForCompany(companyId);
  return provider.provider === GOOGLE_SHEETS_PROVIDER;
}
