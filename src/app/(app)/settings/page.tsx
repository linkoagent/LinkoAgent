import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { TeamPanel } from "@/components/settings/team-panel";
import { AgendaSettingsForm } from "@/components/settings/agenda-settings-form";
import { HolidaysManager } from "@/components/settings/holidays-manager";
import { listHolidays } from "@/lib/agenda/holidays";

export default async function SettingsPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const [company, memberships, holidays] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: ctx.companyId } }),
    prisma.membership.findMany({ where: { companyId: ctx.companyId }, include: { user: true } }),
    listHolidays(ctx.companyId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Datos de la empresa, horarios y equipo.</p>
      </div>

      <CompanySettingsForm company={company} />
      <AgendaSettingsForm company={company} />
      <HolidaysManager holidays={holidays} />
      <TeamPanel
        memberships={memberships.map((m) => ({ id: m.id, role: m.role, user: { name: m.user.name, email: m.user.email } }))}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
