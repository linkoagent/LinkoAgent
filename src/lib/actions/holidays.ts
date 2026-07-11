"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/tenant";
import { createHoliday, deleteHoliday } from "@/lib/agenda/holidays";

export async function createCompanyHoliday(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const dateStr = String(formData.get("date") ?? "").trim();
  const endDateStr = String(formData.get("endDate") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  const recurringYearly = formData.get("recurringYearly") === "on";

  if (!dateStr) return;

  await createHoliday({
    companyId: ctx.companyId,
    date: new Date(`${dateStr}T00:00:00Z`),
    endDate: !recurringYearly && endDateStr ? new Date(`${endDateStr}T00:00:00Z`) : null,
    label,
    recurringYearly,
  });

  revalidatePath("/settings");
}

export async function deleteCompanyHoliday(id: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await deleteHoliday(ctx.companyId, id);
  revalidatePath("/settings");
}
