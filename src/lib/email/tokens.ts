import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function createPasswordToken(userId: string, purpose: "RESET" | "INVITE", ttlHours: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { userId, token, purpose, expiresAt } });

  return token;
}

export async function consumePasswordToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return { ok: false as const, error: "Enlace inválido." };
  if (record.usedAt) return { ok: false as const, error: "Este enlace ya fue usado." };
  if (record.expiresAt < new Date()) return { ok: false as const, error: "Este enlace expiró." };

  await prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } });

  return { ok: true as const, userId: record.userId };
}
