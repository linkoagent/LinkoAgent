"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { getInstagramAuthUrl, INSTAGRAM_MOCK, INSTAGRAM_OAUTH_STATE_COOKIE } from "@/lib/instagram/oauth";

/** Mismo patrón que connectGoogleCalendar/connectWhatsAppChannel: mock conecta al toque con datos
 * de perfil simulados, real hace el redirect OAuth estándar de "Instagram Login". */
export async function connectInstagramChannel(): Promise<void> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  if (INSTAGRAM_MOCK) {
    const existing = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "INSTAGRAM" } });
    const data = {
      companyId: ctx.companyId,
      type: "INSTAGRAM" as const,
      accountId: existing?.accountId ?? `mock-ig-${ctx.companyId}`,
      accountName: "cuenta.demo.linko",
      accessToken: "mock-access-token",
      status: "CONNECTED" as const,
      connectedAt: new Date(),
      lastError: null,
      metadata: { username: "cuenta.demo.linko", name: "Cuenta Demo", followersCount: 1240, profilePictureUrl: null },
    };
    if (existing) {
      await prisma.channel.update({ where: { id: existing.id }, data });
    } else {
      await prisma.channel.create({ data });
    }
    revalidatePath("/channels");
    redirect("/channels?instagramConnected=1");
  }

  const state = randomBytes(32).toString("hex");
  cookies().set(INSTAGRAM_OAUTH_STATE_COOKIE, `${state}:${ctx.companyId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  redirect(getInstagramAuthUrl(state));
}
