"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";

export async function updateAgendaSettings(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const appointmentDurationMinutes = Math.max(5, Math.round(Number(formData.get("appointmentDurationMinutes") ?? 30)));
  const appointmentBufferMinutes = Math.max(0, Math.round(Number(formData.get("appointmentBufferMinutes") ?? 0)));
  const maxSimultaneousAppointments = Math.max(1, Math.round(Number(formData.get("maxSimultaneousAppointments") ?? 1)));
  const hasLunchBreak = formData.get("hasLunchBreak") === "on";
  const lunchBreakStart = hasLunchBreak ? String(formData.get("lunchBreakStart") ?? "").trim() || null : null;
  const lunchBreakEnd = hasLunchBreak ? String(formData.get("lunchBreakEnd") ?? "").trim() || null : null;

  await prisma.company.update({
    where: { id: ctx.companyId },
    data: {
      appointmentDurationMinutes,
      appointmentBufferMinutes,
      maxSimultaneousAppointments,
      lunchBreakStart,
      lunchBreakEnd,
    },
  });

  revalidatePath("/settings");
}
