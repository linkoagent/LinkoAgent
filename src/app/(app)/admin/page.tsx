import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CompanyRowActions } from "@/components/admin/company-row-actions";
import { formatUsd, formatDateTime } from "@/lib/utils";

export default async function AdminPage() {
  await requireRole(["SUPER_ADMIN"]);

  const companies = await prisma.company.findMany({
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { conversations: true, agents: true, memberships: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const recentErrors = await prisma.webhookEvent.findMany({
    where: { error: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Panel Super Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todas las empresas administradas desde Linko.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Uso</th>
              <th className="px-4 py-3 font-medium">Costo IA acumulado</th>
              <th className="px-4 py-3 font-medium">Plan / estado</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.industry ?? "Sin rubro"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c._count.conversations} conv. · {c._count.agents} agentes · {c._count.memberships} usuarios
                </td>
                <td className="px-4 py-3 text-foreground">{formatUsd(c.subscription?.costUsd ?? 0)}</td>
                <td className="px-4 py-3">
                  <CompanyRowActions
                    companyId={c.id}
                    isActive={c.isActive}
                    currentTier={c.subscription?.plan.tier ?? "STARTER"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display text-sm font-semibold text-foreground">Últimos errores de webhooks</h3>
        <div className="mt-3 flex flex-col gap-2">
          {recentErrors.length === 0 && <p className="text-xs text-muted-foreground">Sin errores registrados.</p>}
          {recentErrors.map((e) => (
            <div key={e.id} className="rounded-lg bg-secondary p-2.5 text-xs">
              <p className="text-destructive">{e.error}</p>
              <p className="mt-1 text-muted-foreground">
                {e.provider} · {formatDateTime(e.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
