import { prisma } from "@/lib/prisma";

const BILLING_PERIOD_DAYS = 30;

/**
 * Registra una conversación nueva contra el límite mensual del plan. Se llama una sola vez
 * por conversación (no por mensaje), al momento de crearla, porque los planes se venden en
 * "conversaciones/mes", no en mensajes.
 *
 * Si el período de facturación ya venció, lo reinicia acá mismo (no hay cron): es el único
 * punto del sistema donde se crea una conversación nueva, así que es un lugar seguro para
 * hacer el reset de forma perezosa.
 */
export async function registerNewConversationUsage(companyId: string): Promise<{ overLimit: boolean }> {
  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });

  if (!subscription) return { overLimit: false };

  if (subscription.currentPeriodEnd.getTime() <= Date.now()) {
    await prisma.subscription.update({
      where: { companyId },
      data: {
        conversationsUsed: 1,
        tokensUsed: 0,
        costUsd: 0,
        currentPeriodEnd: new Date(Date.now() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return { overLimit: false };
  }

  const updated = await prisma.subscription.update({
    where: { companyId },
    data: { conversationsUsed: { increment: 1 } },
  });

  return { overLimit: updated.conversationsUsed > subscription.plan.maxConversationsMonth };
}
