"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import {
  getAuthUrl,
  getFirstSheetTitle,
  getValidAccessToken,
  GOOGLE_SHEETS_MOCK,
  GOOGLE_SHEETS_PROVIDER,
  GOOGLE_SHEETS_OAUTH_STATE_COOKIE,
} from "@/lib/googleSheets/client";
import { GoogleSheetsInventoryProvider } from "@/lib/inventory/googleSheetsProvider";

/** Mismo patrón que connectGoogleCalendar: mock conecta al toque, real hace el redirect OAuth
 * estándar (por eso es <form action={...}>, no un fetch/transition). */
export async function connectGoogleSheets(): Promise<void> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  if (GOOGLE_SHEETS_MOCK) {
    await prisma.integration.upsert({
      where: { companyId_provider: { companyId: ctx.companyId, provider: GOOGLE_SHEETS_PROVIDER } },
      create: {
        companyId: ctx.companyId,
        provider: GOOGLE_SHEETS_PROVIDER,
        status: "CONNECTED",
        accountEmail: "mock@sheets.local",
        lastSyncAt: new Date(),
      },
      update: { status: "CONNECTED", accountEmail: "mock@sheets.local", lastError: null, lastSyncAt: new Date() },
    });
    revalidatePath("/integrations");
    redirect("/integrations?sheetsConnected=1");
  }

  const state = randomBytes(32).toString("hex");
  cookies().set(GOOGLE_SHEETS_OAUTH_STATE_COOKIE, `${state}:${ctx.companyId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  redirect(getAuthUrl(state));
}

export async function disconnectGoogleSheetsIntegration() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.integration.updateMany({
    where: { companyId: ctx.companyId, provider: GOOGLE_SHEETS_PROVIDER },
    data: {
      status: "DISCONNECTED",
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      accountEmail: null,
      spreadsheetId: null,
      lastError: null,
    },
  });
  revalidatePath("/integrations");
}

function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

/** Paso 2 de la conexión (a diferencia de Calendar, acá no hay un "calendario primario" por
 * defecto): detecta el nombre REAL de la primera hoja/pestaña de la planilla (nunca se puede
 * asumir "Hoja1" — depende del idioma de la cuenta de Google o de cómo la haya nombrado el
 * usuario) y valida que se pueda leer la fila 1 antes de guardar, para dar un error legible
 * temprano en vez de que recién falle la primera vez que la IA intente usarla. */
export async function setGoogleSheetsSpreadsheet(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const input = String(formData.get("spreadsheetInput") ?? "").trim();
  if (!input) return { ok: false, error: "Pegá la URL o el ID de tu Google Sheet." };

  const spreadsheetId = extractSpreadsheetId(input);

  const integration = await prisma.integration.findFirst({
    where: { companyId: ctx.companyId, provider: GOOGLE_SHEETS_PROVIDER, status: "CONNECTED" },
  });
  if (!integration) return { ok: false, error: "Primero conectá tu cuenta de Google." };

  let sheetName: string;
  try {
    const accessToken = await getValidAccessToken(integration);
    sheetName = await getFirstSheetTitle(spreadsheetId, accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { ok: false, error: `No pude abrir esa planilla: ${message}. Revisá que la URL/ID sea correcta y que la cuenta conectada tenga acceso.` };
  }

  // Se valida ANTES de persistir, contra un candidato en memoria (sin tocar la DB todavía): si
  // spreadsheetId/sheetName quedaran guardados con un list() que falla, la empresa queda
  // "conectada" a una planilla rota — y /products, que asume que Sheets conectado = legible,
  // se rompía por completo en vez de mostrar un error.
  try {
    const candidate = { ...integration, spreadsheetId, sheetName };
    const provider = new GoogleSheetsInventoryProvider(candidate);
    await provider.list();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      ok: false,
      error: `No pude leer los productos de "${sheetName}": ${message}. Revisá que la primera fila tenga encabezados (nombre, stock, precio, etc.).`,
    };
  }

  await prisma.integration.update({ where: { id: integration.id }, data: { spreadsheetId, sheetName } });

  revalidatePath("/integrations");
  revalidatePath("/products");
  return { ok: true };
}
