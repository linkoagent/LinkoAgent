import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function createPasswordToken(userId: string, purpose: "RESET" | "INVITE" | "VERIFY_EMAIL", ttlHours: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { userId, token, purpose, expiresAt } });

  return token;
}

/**
 * Consume el token y, de paso, marca el email como verificado: llegar a este punto (RESET,
 * INVITE o VERIFY_EMAIL) siempre implica que la persona pudo abrir un link mandado a esa
 * casilla, así que ya es prueba suficiente de que el email existe y es suyo.
 */
export async function consumePasswordToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return { ok: false as const, error: "Enlace inválido." };
  if (record.usedAt) return { ok: false as const, error: "Este enlace ya fue usado." };
  if (record.expiresAt < new Date()) return { ok: false as const, error: "Este enlace expiró." };

  await prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } });
  await prisma.user.updateMany({
    where: { id: record.userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });

  return { ok: true as const, userId: record.userId };
}
