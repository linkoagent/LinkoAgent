import { NextResponse } from "next/server";
import type { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPreapproval } from "@/lib/mercadopago/client";

const BILLING_PERIOD_DAYS = 30;

/**
 * Mercado Pago manda notificaciones de "subscription_preapproval" (o el formato viejo
 * "preapproval") por query string o por body, según el tipo de integración. No confiamos en
 * el estado que venga en la notificación: siempre volvemos a consultar el preapproval contra
 * la API de Mercado Pago con nuestro propio access token antes de aplicar ningún cambio.
 */
async function handleNotification(req: Request) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

  let preapprovalId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!preapprovalId && req.method === "POST") {
    try {
      const body = await req.json();
      preapprovalId = body?.data?.id ?? null;
    } catch {
      preapprovalId = null;
    }
  }

  if (!preapprovalId || (topic && topic !== "subscription_preapproval" && topic !== "preapproval")) {
    return NextResponse.json({ ok: true });
  }

  const preapproval = await getPreapproval(preapprovalId);
  const [companyId, tier] = (preapproval.externalReference ?? "").split(":");
  if (!companyId || !tier) return NextResponse.json({ ok: true });

  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  if (!subscription || subscription.mpPreapprovalId !== preapproval.id) {
    return NextResponse.json({ ok: true });
  }

  if (preapproval.status === "authorized") {
    const plan = await prisma.plan.findUnique({ where: { tier: tier as PlanTier } });
    if (plan) {
      await prisma.subscription.update({
        where: { companyId },
        data: {
          planId: plan.id,
          status: "active",
          currentPeriodEnd: new Date(Date.now() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        },
      });
    }
  } else {
    await prisma.subscription.update({ where: { companyId }, data: { status: preapproval.status } });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  return handleNotification(req);
}

export async function GET(req: Request) {
  return handleNotification(req);
}
