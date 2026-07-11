import type { Prisma } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { isDateBlocked } from "./holidays";

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const DAY_LABELS: Record<string, string> = {
  mon: "lunes",
  tue: "martes",
  wed: "miércoles",
  thu: "jueves",
  fri: "viernes",
  sat: "sábado",
  sun: "domingo",
};
const DEFAULT_WORK_DAYS = ["mon", "tue", "wed", "thu", "fri"];

export function daysLabel(days: string[]): string {
  return days.map((d) => DAY_LABELS[d] ?? d).join(", ");
}

export interface BusinessHours {
  startHour: number;
  endHour: number;
  days: string[];
}

/** Company.businessHours lo guarda /settings como { open: "09:00", close: "18:00", days: [...] }. */
export function parseBusinessHours(raw: unknown): BusinessHours {
  if (raw && typeof raw === "object") {
    const bh = raw as { open?: string; close?: string; days?: string[] };
    const startHour = bh.open ? Number(bh.open.split(":")[0]) : NaN;
    const endHour = bh.close ? Number(bh.close.split(":")[0]) : NaN;
    const days = Array.isArray(bh.days) && bh.days.length > 0 ? bh.days : DEFAULT_WORK_DAYS;
    if (!Number.isNaN(startHour) && !Number.isNaN(endHour)) return { startHour, endHour, days };
  }
  return { startHour: 9, endHour: 18, days: DEFAULT_WORK_DAYS };
}

export interface ParsedLocalDateTime {
  utcDate: Date;
  hour: number;
  dayKey: string;
  dateStr: string;
}

/** `value` viene SIN offset de zona (ej. "2026-07-12T15:00:00"): se interpreta como hora/día
 * local de la empresa. El día de la semana se calcula de los componentes de fecha (sin zona),
 * porque una fecha calendario es lunes/martes/etc. independientemente de en qué zona se lea. */
export function parseLocalDateTime(value: string, timezone: string): ParsedLocalDateTime {
  const utcDate = fromZonedTime(value, timezone);
  const [datePart, timePart = "00:00"] = value.split("T");
  const hour = Number(timePart.split(":")[0]) || 0;
  const [y, m, d] = datePart.split("-").map(Number);
  const dayKey = DAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { utcDate, hour, dayKey, dateStr: datePart };
}

export interface LunchBreak {
  start: string | null;
  end: string | null;
}

/** true si [startUtc,endUtc) se solapa con la pausa de almuerzo, comparado en minutos reales
 * (no solo la hora entera, a diferencia del chequeo de horario de atención). */
export function overlapsLunchBreak(params: {
  startUtc: Date;
  endUtc: Date;
  timezone: string;
  dateStr: string;
  lunch: LunchBreak;
}): boolean {
  const { lunch, timezone, dateStr } = params;
  if (!lunch.start || !lunch.end) return false;
  const lunchStartUtc = fromZonedTime(`${dateStr}T${lunch.start}:00`, timezone);
  const lunchEndUtc = fromZonedTime(`${dateStr}T${lunch.end}:00`, timezone);
  return params.startUtc < lunchEndUtc && params.endUtc > lunchStartUtc;
}

/** Cuenta turnos CONFIRMED que se solapan con [startUtc,endUtc), expandiendo la ventana de cada
 * turno existente por el buffer configurado (colchón antes y después). Acepta un `tx` opcional
 * para poder correr dentro de la transacción Serializable de bookAppointment/rescheduleAppointment. */
export async function countOverlappingConfirmed(params: {
  companyId: string;
  startUtc: Date;
  endUtc: Date;
  bufferMinutes: number;
  excludeAppointmentId?: string;
  tx?: Prisma.TransactionClient;
}): Promise<number> {
  const client = params.tx ?? prisma;
  const bufferMs = params.bufferMinutes * 60_000;
  return client.appointment.count({
    where: {
      companyId: params.companyId,
      status: "CONFIRMED",
      ...(params.excludeAppointmentId ? { id: { not: params.excludeAppointmentId } } : {}),
      startsAt: { lt: new Date(params.endUtc.getTime() + bufferMs) },
      endsAt: { gt: new Date(params.startUtc.getTime() - bufferMs) },
    },
  });
}

export interface SlotRuleParams {
  companyId: string;
  startUtc: Date;
  endUtc: Date;
  hour: number;
  dayKey: string;
  dateStr: string;
  timezone: string;
  businessHours: unknown;
  bufferMinutes: number;
  maxSimultaneous: number;
  lunch: LunchBreak;
  excludeAppointmentId?: string;
}

/** Reglas 100% locales (día laboral, horario, feriado/vacación, almuerzo, cupo) — NO incluye el
 * freebusy del proveedor externo, que es responsabilidad de service.ts (ver Problema A del plan:
 * solo tiene sentido como gate cuando maxSimultaneousAppointments === 1). */
export async function checkSlotRules(params: SlotRuleParams): Promise<{ available: boolean; reason?: string }> {
  const { startHour, endHour, days } = parseBusinessHours(params.businessHours);

  if (!days.includes(params.dayKey)) {
    return {
      available: false,
      reason: `no trabajamos ese día (${DAY_LABELS[params.dayKey] ?? params.dayKey}); trabajamos: ${daysLabel(days)}`,
    };
  }
  if (params.hour < startHour || params.hour >= endHour) {
    return { available: false, reason: `fuera de horario de atención (${startHour}:00 a ${endHour}:00)` };
  }

  const holiday = await isDateBlocked(params.companyId, params.dateStr);
  if (holiday.blocked) {
    return { available: false, reason: `no atendemos ese día (${holiday.label})` };
  }

  if (
    overlapsLunchBreak({
      startUtc: params.startUtc,
      endUtc: params.endUtc,
      timezone: params.timezone,
      dateStr: params.dateStr,
      lunch: params.lunch,
    })
  ) {
    return { available: false, reason: `ese horario cae dentro de la pausa/almuerzo (${params.lunch.start}-${params.lunch.end})` };
  }

  const overlapping = await countOverlappingConfirmed({
    companyId: params.companyId,
    startUtc: params.startUtc,
    endUtc: params.endUtc,
    bufferMinutes: params.bufferMinutes,
    excludeAppointmentId: params.excludeAppointmentId,
  });
  if (overlapping >= params.maxSimultaneous) {
    return { available: false, reason: "ya hay un turno reservado en ese horario" };
  }

  return { available: true };
}
