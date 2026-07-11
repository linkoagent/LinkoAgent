import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { parseBusinessHours, DAY_KEYS } from "@/lib/agenda/rules";
import { CancelAppointmentButton } from "@/components/agenda/cancel-appointment-button";

const STATUS_VARIANT: Record<string, "success" | "destructive"> = { CONFIRMED: "success", CANCELLED: "destructive" };
const STATUS_LABEL: Record<string, string> = { CONFIRMED: "Confirmado", CANCELLED: "Cancelado" };

export default async function AgendaPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: ctx.companyId },
    select: {
      timezone: true,
      businessHours: true,
      appointmentDurationMinutes: true,
      maxSimultaneousAppointments: true,
    },
  });

  const now = new Date();
  const rangeEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: { companyId: ctx.companyId, startsAt: { gte: now, lte: rangeEnd } },
    orderBy: { startsAt: "asc" },
    include: { customer: { select: { name: true, phone: true } } },
  });

  const todayKey = formatInTimeZone(now, company.timezone, "yyyy-MM-dd");
  const confirmedToday = appointments.filter(
    (a) => a.status === "CONFIRMED" && formatInTimeZone(a.startsAt, company.timezone, "yyyy-MM-dd") === todayKey
  ).length;
  const confirmedThisWeek = appointments.filter((a) => a.status === "CONFIRMED" && a.startsAt <= weekEnd).length;
  const cancelledThisWeek = appointments.filter((a) => a.status === "CANCELLED" && a.startsAt <= weekEnd).length;

  // Ocupación aproximada de la semana: días laborales × slots teóricos por día. No descuenta
  // buffer/almuerzo/feriados del cálculo — sería sobre-ingeniería para un stat tile.
  const { startHour, endHour, days } = parseBusinessHours(company.businessHours);
  let workingDaysInWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    if (days.includes(DAY_KEYS[d.getUTCDay()])) workingDaysInWeek++;
  }
  const slotsPerDay =
    Math.max(0, Math.floor(((endHour - startHour) * 60) / company.appointmentDurationMinutes)) *
    company.maxSimultaneousAppointments;
  const theoreticalSlots = workingDaysInWeek * slotsPerDay;
  const occupancyPct = theoreticalSlots > 0 ? Math.round((confirmedThisWeek / theoreticalSlots) * 100) : null;

  const groups = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const key = formatInTimeZone(a.startsAt, company.timezone, "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">Próximos turnos de los siguientes 14 días.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Confirmados hoy</div>
          <div className="mt-1 font-display text-xl text-foreground">{confirmedToday}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Confirmados esta semana</div>
          <div className="mt-1 font-display text-xl text-success">{confirmedThisWeek}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Cancelados esta semana</div>
          <div className="mt-1 font-display text-xl text-destructive">{cancelledThisWeek}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Ocupación esta semana</div>
          <div className="mt-1 font-display text-xl text-foreground">
            {occupancyPct !== null ? `~${occupancyPct}%` : "—"}
          </div>
          <div className="text-[10.5px] text-faint">(aproximado)</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {[...groups.entries()].map(([dateKey, dayAppointments]) => (
          <div key={dateKey} className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold capitalize text-foreground">
              {formatInTimeZone(new Date(`${dateKey}T12:00:00Z`), company.timezone, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {dayAppointments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-foreground">{formatInTimeZone(a.startsAt, company.timezone, "HH:mm")}</span>
                    <span className="text-muted-foreground">
                      {a.customer.name ?? a.customer.phone ?? "Cliente"}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </span>
                    <Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </div>
                  {a.status === "CONFIRMED" && <CancelAppointmentButton appointmentId={a.id} />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.size === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No hay turnos en los próximos 14 días.
          </div>
        )}
      </div>
    </div>
  );
}
