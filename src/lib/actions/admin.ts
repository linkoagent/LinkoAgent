"use server";

import { revalidatePath } from "next/cache";
import type { PlanTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";

async function assertSuperAdmin() {
  return requireRole(["SUPER_ADMIN"]);
}

export async function toggleCompanyActive(companyId: string, isActive: boolean) {
  await assertSuperAdmin();
  await prisma.company.update({ where: { id: companyId }, data: { isActive } });
  revalidatePath("/admin");
}

export async function changeCompanyPlan(companyId: string, tier: PlanTier) {
  await assertSuperAdmin();
  const plan = await prisma.plan.findUnique({ where: { tier } });
  if (!plan) return;

  await prisma.subscription.upsert({
    where: { companyId },
    update: { planId: plan.id },
    create: {
      companyId,
      planId: plan.id,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/admin");
}
