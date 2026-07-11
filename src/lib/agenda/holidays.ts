import { prisma } from "@/lib/prisma";

interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Los campos @db.Date de Postgres llegan como Date a medianoche UTC — se leen con los getters
 * UTC (no locales) para no correr el riesgo de que el huso horario del servidor corra el día. */
function toDateParts(d: Date): DateParts {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function compareDateParts(a: DateParts, b: DateParts): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export interface HolidayCheck {
  blocked: boolean;
  label?: string;
}

/** `dateStr` es "YYYY-MM-DD" (fecha calendario de la empresa, ya resuelta sin ambigüedad de
 * zona horaria por quien llama — ver parseLocalDateTime en rules.ts). */
export async function isDateBlocked(companyId: string, dateStr: string): Promise<HolidayCheck> {
  const [year, month, day] = dateStr.split("-").map(Number);
  const target: DateParts = { year, month, day };

  const holidays = await prisma.companyHoliday.findMany({ where: { companyId } });
  for (const h of holidays) {
    if (h.recurringYearly) {
      const hDate = toDateParts(h.date);
      if (hDate.month === target.month && hDate.day === target.day) {
        return { blocked: true, label: h.label ?? "feriado" };
      }
      continue;
    }
    const start = toDateParts(h.date);
    const end = h.endDate ? toDateParts(h.endDate) : start;
    if (compareDateParts(target, start) >= 0 && compareDateParts(target, end) <= 0) {
      return { blocked: true, label: h.label ?? "vacaciones" };
    }
  }
  return { blocked: false };
}

export async function listHolidays(companyId: string) {
  return prisma.companyHoliday.findMany({ where: { companyId }, orderBy: { date: "asc" } });
}

export async function createHoliday(params: {
  companyId: string;
  date: Date;
  endDate?: Date | null;
  label?: string | null;
  recurringYearly: boolean;
}) {
  return prisma.companyHoliday.create({ data: params });
}

export async function deleteHoliday(companyId: string, id: string) {
  await prisma.companyHoliday.deleteMany({ where: { id, companyId } });
}
