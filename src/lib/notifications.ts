import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/client";
import { handoffEmail } from "@/lib/email/templates";

export interface NotificationItem {
  conversationId: string;
  customerName: string;
  preview: string;
  createdAt: Date;
}

/** Mensajes de clientes que llegaron después de la última vez que este usuario vio la campanita. */
export async function getUnreadNotifications(userId: string, companyId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationsSeenAt: true } });
  const since = user?.notificationsSeenAt ?? new Date(0);

  const messages = await prisma.message.findMany({
    where: { createdAt: { gt: since }, sender: "CUSTOMER", conversation: { companyId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { conversation: { include: { customer: true } } },
  });

  const count = await prisma.message.count({
    where: { createdAt: { gt: since }, sender: "CUSTOMER", conversation: { companyId } },
  });

  const items: NotificationItem[] = messages.map((m) => ({
    conversationId: m.conversationId,
    customerName: m.conversation.customer.name ?? m.conversation.customer.phone ?? "Cliente",
    preview: m.content.slice(0, 80),
    createdAt: m.createdAt,
  }));

  return { count, items };
}

export async function markNotificationsSeen(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { notificationsSeenAt: new Date() } });
}

/**
 * Avisa por email al dueño de la cuenta (los COMPANY_ADMIN) y a quien tenga la conversación
 * asignada, cada vez que se deriva a un humano — por el motivo que sea (límite de uso,
 * pedido del cliente, falla de envío, etc.), no solo cuando la IA detecta que hace falta.
 */
export async function notifyHumanHandoff(conversationId: string, reason: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true, assignedUser: true },
  });
  if (!conversation) return;

  const admins = await prisma.membership.findMany({
    where: { companyId: conversation.companyId, role: "COMPANY_ADMIN" },
    include: { user: true },
  });

  const recipients = new Map<string, { name: string; email: string }>();
  for (const m of admins) recipients.set(m.user.email, { name: m.user.name, email: m.user.email });
  if (conversation.assignedUser) {
    recipients.set(conversation.assignedUser.email, {
      name: conversation.assignedUser.name,
      email: conversation.assignedUser.email,
    });
  }
  if (recipients.size === 0) return;

  const customerName = conversation.customer.name ?? conversation.customer.phone ?? "un cliente";
  const conversationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/inbox/${conversationId}`;

  await Promise.all(
    [...recipients.values()].map((r) =>
      sendEmail({
        to: r.email,
        subject: `Linko Agent: ${customerName} necesita atención humana`,
        html: handoffEmail({ name: r.name, customerName, reason, conversationUrl }),
      })
    )
  );
}
