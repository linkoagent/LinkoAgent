import { requireCompanyContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireCompanyContext();

  const [whatsappChannel, pendingCount] = await Promise.all([
    prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "WHATSAPP" } }),
    prisma.conversation.count({ where: { companyId: ctx.companyId, status: "HANDED_OFF" } }),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={ctx.role} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Topbar ctx={ctx} whatsappConnected={whatsappChannel?.status === "CONNECTED"} pendingCount={pendingCount} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
