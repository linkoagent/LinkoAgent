import { requireCompanyContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireCompanyContext();

  const whatsappChannel = await prisma.channel.findFirst({ where: { companyId: ctx.companyId, type: "WHATSAPP" } });

  return (
    <div className="flex min-h-screen">
      <Sidebar role={ctx.role} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Topbar ctx={ctx} whatsappConnected={whatsappChannel?.status === "CONNECTED"} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
