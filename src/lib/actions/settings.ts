"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { createPasswordToken } from "@/lib/email/tokens";
import { sendEmail } from "@/lib/email/client";
import { teamInviteEmail } from "@/lib/email/templates";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export async function updateCompanySettings(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const brandTone = String(formData.get("brandTone") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "America/Argentina/Buenos_Aires").trim();
  const outOfHoursMessage = String(formData.get("outOfHoursMessage") ?? "").trim() || null;
  const openTime = String(formData.get("openTime") ?? "09:00");
  const closeTime = String(formData.get("closeTime") ?? "18:00");
  const activeDays = DAY_KEYS.filter((d) => formData.get(`day_${d}`) === "on");

  if (!name) return;

  await prisma.company.update({
    where: { id: ctx.companyId },
    data: {
      name,
      industry,
      brandTone,
      timezone,
      outOfHoursMessage,
      businessHours: { open: openTime, close: closeTime, days: activeDays },
    },
  });

  revalidatePath("/settings");
}

export async function addTeamMember(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "AGENT_HUMAN") as Role;

  if (!name || !email) return;

  const existing = await prisma.user.findUnique({ where: { email } });

  let user = existing;
  if (!user) {
    // Contraseña aleatoria inutilizable: nadie la conoce, el usuario la define desde el
    // email de invitación (mismo mecanismo que "olvidé mi contraseña").
    const unusablePasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    user = await prisma.user.create({ data: { name, email, passwordHash: unusablePasswordHash } });
  }

  await prisma.membership.upsert({
    where: { userId_companyId: { userId: user.id, companyId: ctx.companyId } },
    update: { role },
    create: { userId: user.id, companyId: ctx.companyId, role },
  });

  if (!existing) {
    const token = await createPasswordToken(user.id, "INVITE", 24);
    const setPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: `${ctx.userName} te invitó a Linko Agent`,
      html: teamInviteEmail({ name: user.name, companyName: ctx.companyName, inviterName: ctx.userName, setPasswordUrl }),
    });
  }

  revalidatePath("/settings");
}

export async function removeTeamMember(membershipId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.membership.deleteMany({ where: { id: membershipId, companyId: ctx.companyId } });
  revalidatePath("/settings");
}
