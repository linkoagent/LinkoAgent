"use server";

import type { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { createPreapproval, isMercadoPagoMock } from "@/lib/mercadopago/client";
import { PLAN_DEFS, planPriceArs } from "@/lib/plans";

export interface StartPlanCheckoutResult {
  ok: boolean;
  url?: string;
  mocked?: boolean;
  error?: string;
}

/**
 * Arranca el checkout de Mercado Pago para pasar (o renovar) al plan elegido. No cambia el
 * plan todavía: eso lo hace el webhook cuando Mercado Pago confirma que la suscripción quedó
 * autorizada (ver src/app/api/webhooks/mercadopago/route.ts). Enterprise no tiene precio fijo,
 * así que no pasa por acá — se coordina manualmente por el formulario de contacto.
 */
export async function startPlanCheckout(tier: Exclude<PlanTier, "ENTERPRISE">): Promise<StartPlanCheckoutResult> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const user = await prisma.user.findUnique({ where: { id: ctx.userId } });
  if (!user) return { ok: false, error: "Usuario no encontrado" };

  const planDef = PLAN_DEFS[tier];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const preapproval = await createPreapproval({
      reason: `Linko Agent — Plan ${planDef.name} (${ctx.companyName})`,
      payerEmail: user.email,
      amountArs: planPriceArs(planDef.priceUsd),
      externalReference: `${ctx.companyId}:${tier}`,
      backUrl: `${appUrl}/usage`,
    });

    await prisma.subscription.update({
      where: { companyId: ctx.companyId },
      data: { mpPreapprovalId: preapproval.id },
    });

    return { ok: true, url: preapproval.initPoint, mocked: isMercadoPagoMock() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error iniciando el checkout" };
  }
}
