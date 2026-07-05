import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ACTIVE_COMPANY_COOKIE = "active_company_id";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });
}

export interface CompanyContext {
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  role: Role;
  memberships: Awaited<ReturnType<typeof getMemberships>>;
}

/**
 * Resuelve el contexto de empresa activa para la request actual (usuario + empresa + rol).
 * Todas las queries de negocio deben filtrar siempre por `companyId` de este contexto:
 * es el único mecanismo de aislamiento multiempresa en este stack (no hay RLS de Postgres
 * porque no se usa Supabase).
 */
export async function requireCompanyContext(): Promise<CompanyContext> {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) redirect("/login");

  const memberships = await getMemberships(sessionUser.id);
  if (memberships.length === 0) redirect("/login");

  const cookieStore = cookies();
  const activeCookieValue = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  const active = memberships.find((m) => m.companyId === activeCookieValue) ?? memberships[0];

  return {
    userId: sessionUser.id,
    userName: sessionUser.name ?? sessionUser.email ?? "Usuario",
    companyId: active.companyId,
    companyName: active.company.name,
    role: active.role,
    memberships,
  };
}

export async function requireRole(roles: Role[]): Promise<CompanyContext> {
  const ctx = await requireCompanyContext();
  if (!roles.includes(ctx.role)) redirect("/dashboard");
  return ctx;
}

export async function isSuperAdmin(userId: string) {
  const membership = await prisma.membership.findFirst({ where: { userId, role: "SUPER_ADMIN" } });
  return !!membership;
}
