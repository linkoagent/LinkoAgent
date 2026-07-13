import { NextResponse } from "next/server";
import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { INSTAGRAM_GRAPH_VERSION } from "@/lib/instagram/client";
import { subscribeInstagramWebhooks } from "@/lib/instagram/oauth";

/**
 * Diagnóstico temporal (solo admin de la empresa): confirma contra la API real de Meta si la
 * cuenta conectada quedó de verdad suscripta al webhook de mensajes — nuestro propio código
 * nunca lo vuelve a chequear después de conectar, solo confía en que subscribeInstagramWebhooks
 * no haya tirado error en su momento. Además reintenta la suscripción por las dudas.
 */
export async function GET() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const channel = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "INSTAGRAM" } });
  if (!channel || !channel.accessToken || !channel.accountId) {
    return NextResponse.json({ error: "No hay un canal de Instagram conectado con token." }, { status: 404 });
  }

  const checkRes = await fetch(`https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}/${channel.accountId}/subscribed_apps`, {
    headers: { Authorization: `Bearer ${channel.accessToken}` },
  });
  const checkData = await checkRes.json().catch(() => null);

  let resubscribeResult: { ok: boolean; error?: string } = { ok: true };
  try {
    await subscribeInstagramWebhooks(channel.accessToken);
  } catch (err) {
    resubscribeResult = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({
    accountId: channel.accountId,
    graphVersion: INSTAGRAM_GRAPH_VERSION,
    subscribedAppsCheck: { status: checkRes.status, data: checkData },
    resubscribeAttempt: resubscribeResult,
  });
}
