"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import {
  getAuthUrl,
  GOOGLE_CALENDAR_MOCK,
  GOOGLE_CALENDAR_PROVIDER,
  GOOGLE_CALENDAR_OAUTH_STATE_COOKIE,
} from "@/lib/googleCalendar/client";

/**
 * Arranca la conexión de Google Calendar. En modo mock (sin credenciales reales) queda
 * conectado al toque, sin salir de la app, igual que el resto de las integraciones simuladas
 * (WhatsApp/Groq/Gemini/Resend). En modo real hace el redirect estándar de OAuth de Google —
 * se llama desde un <form action={connectGoogleCalendar}>, no desde un fetch/transition,
 * porque redirect() dentro de una Server Action requiere ese patrón para navegar el browser.
 */
export async function connectGoogleCalendar(): Promise<void> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  if (GOOGLE_CALENDAR_MOCK) {
    await prisma.integration.upsert({
      where: { companyId_provider: { companyId: ctx.companyId, provider: GOOGLE_CALENDAR_PROVIDER } },
      create: {
        companyId: ctx.companyId,
        provider: GOOGLE_CALENDAR_PROVIDER,
        status: "CONNECTED",
        accountEmail: "mock@integration.local",
        lastSyncAt: new Date(),
      },
      update: { status: "CONNECTED", accountEmail: "mock@integration.local", lastError: null, lastSyncAt: new Date() },
    });
    revalidatePath("/integrations");
    redirect("/integrations?connected=1");
  }

  // El state solo prueba que el redirect que vuelve es el mismo que arrancamos acá (CSRF) y
  // que la empresa activa no cambió en el medio — nunca se confía en un companyId que venga
  // del round-trip de Google para identidad de tenant.
  const state = randomBytes(32).toString("hex");
  cookies().set(GOOGLE_CALENDAR_OAUTH_STATE_COOKIE, `${state}:${ctx.companyId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  redirect(getAuthUrl(state));
}

export async function disconnectGoogleCalendarIntegration() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.integration.updateMany({
    where: { companyId: ctx.companyId, provider: GOOGLE_CALENDAR_PROVIDER },
    data: {
      status: "DISCONNECTED",
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      accountEmail: null,
      lastError: null,
    },
  });
  revalidatePath("/integrations");
}
