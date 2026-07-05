"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCompanyContext, ACTIVE_COMPANY_COOKIE } from "@/lib/tenant";

export async function switchCompany(companyId: string) {
  const ctx = await requireCompanyContext();
  const allowed = ctx.memberships.some((m) => m.companyId === companyId);
  if (!allowed) return;

  cookies().set(ACTIVE_COMPANY_COOKIE, companyId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/dashboard");
}
