"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/tenant";
import { cancelAppointmentById } from "@/lib/agenda/service";

/** Delega a la misma cancelAppointmentById() de lib/agenda/service.ts — humano y IA comparten
 * un solo camino de cancelación, esta acción solo valida rol y re-renderiza la pantalla. */
export async function cancelAppointmentFromDashboard(appointmentId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await cancelAppointmentById(ctx.companyId, appointmentId);
  revalidatePath("/agenda");
}
