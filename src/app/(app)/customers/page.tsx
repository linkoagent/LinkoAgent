import Link from "next/link";
import { requireCompanyContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function CustomersPage() {
  const ctx = await requireCompanyContext();
  const customers = await prisma.customer.findMany({
    where: { companyId: ctx.companyId },
    include: { conversations: { orderBy: { lastMessageAt: "desc" }, take: 1 }, leads: true },
    orderBy: { lastContactAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se generan automáticamente a partir de las conversaciones por canal.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Canal</th>
              <th className="px-4 py-3 font-medium">Último contacto</th>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{c.name ?? c.phone ?? "Sin nombre"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.channelType}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(c.lastContactAt)}</td>
                <td className="px-4 py-3">
                  {c.leads[0] ? <Badge variant="outline">{c.leads[0].stage}</Badge> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {c.conversations[0] && (
                    <Link href={`/inbox/${c.conversations[0].id}`} className="text-primary hover:underline">
                      Ver conversación
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">Todavía no hay clientes registrados.</p>
        )}
      </div>
    </div>
  );
}
