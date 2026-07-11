import { Prisma } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { getAgendaProviderForCompany } from "./providerFactory";
import { DAY_KEYS, checkSlotRules, countOverlappingConfirmed, parseBusinessHours, parseLocalDateTime } from "./rules";
import type { AgendaProvider } from "./types";

const MAX_SERIALIZATION_RETRIES = 3;

/** Marca "el cupo se llenó justo antes de confirmar" dentro de la transacción — nunca sale de
 * este archivo, se traduce siempre al mismo mensaje legible para el cliente. */
class SlotTakenError extends Error {}

async function retrySerializable<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_SERIALIZATION_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") continue;
      throw err;
    }
  }
  throw lastErr;
}

interface CompanyAgendaConfig {
  timezone: string;
  businessHours: unknown;
  appointmentDurationMinutes: number;
  appointmentBufferMinutes: number;
  maxSimultaneousAppointments: number;
  lunchBreakStart: string | null;
  lunchBreakEnd: string | null;
}

async function getCompanyAgendaConfig(companyId: string): Promise<CompanyAgendaConfig> {
  return prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: {
      timezone: true,
      businessHours: true,
      appointmentDurationMinutes: true,
      appointmentBufferMinutes: true,
      maxSimultaneousAppointments: true,
      lunchBreakStart: true,
      lunchBreakEnd: true,
    },
  });
}

async function isSlotAvailable(params: {
  provider: AgendaProvider | null;
  config: CompanyAgendaConfig;
  companyId: string;
  startUtc: Date;
  endUtc: Date;
  hour: number;
  dayKey: string;
  dateStr: string;
  excludeAppointmentId?: string;
}): Promise<{ available: boolean; reason?: string }> {
  const rulesCheck = await checkSlotRules({
    companyId: params.companyId,
    startUtc: params.startUtc,
    endUtc: params.endUtc,
    hour: params.hour,
    dayKey: params.dayKey,
    dateStr: params.dateStr,
    timezone: params.config.timezone,
    businessHours: params.config.businessHours,
    bufferMinutes: params.config.appointmentBufferMinutes,
    maxSimultaneous: params.config.maxSimultaneousAppointments,
    lunch: { start: params.config.lunchBreakStart, end: params.config.lunchBreakEnd },
    excludeAppointmentId: params.excludeAppointmentId,
  });
  if (!rulesCheck.available) return rulesCheck;

  // Freebusy real solo tiene sentido como gate cuando max=1 (Problema A del plan): con max>1,
  // varios turnos comparten intencionalmente el mismo horario (ej. sillas de una peluquería),
  // y el freebusy binario de Google marcaría "ocupado" apenas exista el primero.
  if (params.config.maxSimultaneousAppointments === 1 && params.provider) {
    const { busy } = await params.provider.getFreeBusy({ startUtc: params.startUtc, endUtc: params.endUtc });
    if (busy) return { available: false, reason: "el calendario tiene otro evento en ese horario" };
  }

  return { available: true };
}

/** Escanea hasta 14 días calendario hacia adelante desde `fromDateStr` (saltando días no
 * laborales), buscando hasta 3 horarios libres. */
async function findAlternatives(params: {
  provider: AgendaProvider | null;
  config: CompanyAgendaConfig;
  companyId: string;
  fromDateStr: string;
  durationMinutes: number;
}): Promise<string[]> {
  const { startHour, endHour, days } = parseBusinessHours(params.config.businessHours);
  const alternatives: string[] = [];

  const [y0, m0, d0] = params.fromDateStr.split("-").map(Number);
  const baseUtcMidnight = Date.UTC(y0, m0 - 1, d0);

  for (let dayOffset = 0; dayOffset < 14 && alternatives.length < 3; dayOffset++) {
    const dayDate = new Date(baseUtcMidnight + dayOffset * 86_400_000);
    const dayKey = DAY_KEYS[dayDate.getUTCDay()];
    if (!days.includes(dayKey)) continue;

    const candidateDateStr = `${dayDate.getUTCFullYear()}-${String(dayDate.getUTCMonth() + 1).padStart(2, "0")}-${String(dayDate.getUTCDate()).padStart(2, "0")}`;

    for (let hour = startHour; hour < endHour && alternatives.length < 3; hour++) {
      for (const minute of [0, 30]) {
        if (alternatives.length >= 3) break;
        const candidateLocal = `${candidateDateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
        const { utcDate: startUtc, hour: slotHour, dayKey: slotDayKey } = parseLocalDateTime(candidateLocal, params.config.timezone);
        const endUtc = new Date(startUtc.getTime() + params.durationMinutes * 60000);
        const check = await isSlotAvailable({
          provider: params.provider,
          config: params.config,
          companyId: params.companyId,
          startUtc,
          endUtc,
          hour: slotHour,
          dayKey: slotDayKey,
          dateStr: candidateDateStr,
        });
        if (check.available) alternatives.push(candidateLocal);
      }
    }
  }
  return alternatives;
}

export async function findCustomerAppointments(companyId: string, customerId: string, hint: string | undefined, timezone: string) {
  const where: Prisma.AppointmentWhereInput = {
    companyId,
    customerId,
    status: "CONFIRMED",
    startsAt: { gte: new Date() },
  };
  if (hint) {
    const dateStr = hint.split("T")[0];
    where.startsAt = {
      gte: fromZonedTime(`${dateStr}T00:00:00`, timezone),
      lte: fromZonedTime(`${dateStr}T23:59:59`, timezone),
    };
  }
  return prisma.appointment.findMany({ where, orderBy: { startsAt: "asc" } });
}

export async function checkAvailability(params: {
  companyId: string;
  startsAt: string;
  durationMinutes?: number;
}): Promise<{ available: boolean; reason?: string; alternatives?: string[]; startsAt?: string }> {
  const config = await getCompanyAgendaConfig(params.companyId);
  const provider = await getAgendaProviderForCompany(params.companyId);
  const durationMinutes = params.durationMinutes || config.appointmentDurationMinutes;

  const { utcDate: startUtc, hour, dayKey, dateStr } = parseLocalDateTime(params.startsAt, config.timezone);
  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60000);

  const check = await isSlotAvailable({ provider, config, companyId: params.companyId, startUtc, endUtc, hour, dayKey, dateStr });
  if (check.available) return { available: true, startsAt: params.startsAt };

  const alternatives = await findAlternatives({ provider, config, companyId: params.companyId, fromDateStr: dateStr, durationMinutes });
  return { available: false, reason: check.reason, alternatives };
}

export async function bookAppointment(params: {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  startsAt: string;
  durationMinutes?: number;
  notes?: string;
}): Promise<{ booked: boolean; reason?: string; alternatives?: string[]; startsAt?: string; durationMinutes?: number }> {
  const config = await getCompanyAgendaConfig(params.companyId);
  const provider = await getAgendaProviderForCompany(params.companyId);
  if (!provider) return { booked: false, reason: "No hay ningún calendario conectado para esta empresa." };

  const durationMinutes = params.durationMinutes || config.appointmentDurationMinutes;
  const { utcDate: startUtc, hour, dayKey, dateStr } = parseLocalDateTime(params.startsAt, config.timezone);
  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60000);

  const check = await isSlotAvailable({ provider, config, companyId: params.companyId, startUtc, endUtc, hour, dayKey, dateStr });
  if (!check.available) {
    const alternatives = await findAlternatives({ provider, config, companyId: params.companyId, fromDateStr: dateStr, durationMinutes });
    return { booked: false, reason: check.reason, alternatives };
  }

  let appointmentId: string;
  try {
    appointmentId = await retrySerializable(() =>
      prisma.$transaction(
        async (tx) => {
          const overlapping = await countOverlappingConfirmed({
            companyId: params.companyId,
            startUtc,
            endUtc,
            bufferMinutes: config.appointmentBufferMinutes,
            tx,
          });
          if (overlapping >= config.maxSimultaneousAppointments) throw new SlotTakenError();

          const appt = await tx.appointment.create({
            data: {
              companyId: params.companyId,
              customerId: params.customerId,
              conversationId: params.conversationId ?? null,
              googleEventId: "",
              startsAt: startUtc,
              endsAt: endUtc,
              notes: params.notes,
            },
          });
          return appt.id;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    );
  } catch (err) {
    if (err instanceof SlotTakenError) return { booked: false, reason: "ese horario se acaba de ocupar, elegí otro" };
    throw err;
  }

  try {
    const event = await provider.createEvent({
      startUtc,
      endUtc,
      timezone: config.timezone,
      summary: params.notes ? `Turno: ${params.notes}` : "Turno",
      description: params.notes,
    });
    await prisma.appointment.update({ where: { id: appointmentId }, data: { googleEventId: event.externalEventId } });
  } catch (err) {
    await prisma.appointment.delete({ where: { id: appointmentId } });
    return { booked: false, reason: err instanceof Error ? err.message : "Error desconocido" };
  }

  return { booked: true, startsAt: params.startsAt, durationMinutes };
}

/** Cancelación directa por id (usada por el dashboard humano, que ya sabe exactamente qué fila
 * clickeó — a diferencia de cancelAppointment(), no necesita desambiguar por cliente/hint, eso
 * es específico del flujo conversacional donde la IA no tiene un id, solo lo que dice el cliente. */
export async function cancelAppointmentById(companyId: string, appointmentId: string): Promise<{ cancelled: boolean; error?: string }> {
  const provider = await getAgendaProviderForCompany(companyId);
  if (!provider) return { cancelled: false, error: "No hay ningún calendario conectado para esta empresa." };

  const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, companyId, status: "CONFIRMED" } });
  if (!appointment) return { cancelled: false, error: "Turno no encontrado." };

  await provider.deleteEvent({ externalEventId: appointment.googleEventId });
  await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } });
  return { cancelled: true };
}

export async function cancelAppointment(params: {
  companyId: string;
  customerId: string;
  timezone: string;
  hint?: string;
}): Promise<{ found?: number; appointments?: { startsAt: string }[]; cancelled?: boolean; startsAt?: string; error?: string }> {
  const provider = await getAgendaProviderForCompany(params.companyId);
  if (!provider) return { error: "No hay ningún calendario conectado para esta empresa." };

  const candidates = await findCustomerAppointments(params.companyId, params.customerId, params.hint, params.timezone);
  if (candidates.length === 0) return { found: 0 };
  if (candidates.length > 1) {
    return { found: candidates.length, appointments: candidates.map((a) => ({ startsAt: a.startsAt.toISOString() })) };
  }

  const [appointment] = candidates;
  await provider.deleteEvent({ externalEventId: appointment.googleEventId });
  await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } });

  return { cancelled: true, startsAt: appointment.startsAt.toISOString() };
}

export async function rescheduleAppointment(params: {
  companyId: string;
  customerId: string;
  currentHint?: string;
  newStartsAt: string;
  durationMinutes?: number;
}): Promise<{
  found?: number;
  appointments?: { startsAt: string }[];
  rescheduled?: boolean;
  reason?: string;
  alternatives?: string[];
  startsAt?: string;
  durationMinutes?: number;
  error?: string;
}> {
  const config = await getCompanyAgendaConfig(params.companyId);
  const provider = await getAgendaProviderForCompany(params.companyId);
  if (!provider) return { error: "No hay ningún calendario conectado para esta empresa." };

  const candidates = await findCustomerAppointments(params.companyId, params.customerId, params.currentHint, config.timezone);
  if (candidates.length === 0) return { found: 0 };
  if (candidates.length > 1) {
    return { found: candidates.length, appointments: candidates.map((a) => ({ startsAt: a.startsAt.toISOString() })) };
  }

  const [appointment] = candidates;
  const durationMinutes =
    params.durationMinutes || Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000);

  const { utcDate: newStartUtc, hour, dayKey, dateStr } = parseLocalDateTime(params.newStartsAt, config.timezone);
  const newEndUtc = new Date(newStartUtc.getTime() + durationMinutes * 60000);

  const check = await isSlotAvailable({
    provider,
    config,
    companyId: params.companyId,
    startUtc: newStartUtc,
    endUtc: newEndUtc,
    hour,
    dayKey,
    dateStr,
    excludeAppointmentId: appointment.id,
  });
  if (!check.available) {
    const alternatives = await findAlternatives({ provider, config, companyId: params.companyId, fromDateStr: dateStr, durationMinutes });
    return { rescheduled: false, reason: check.reason, alternatives };
  }

  const previousStartsAt = appointment.startsAt;
  const previousEndsAt = appointment.endsAt;

  try {
    await retrySerializable(() =>
      prisma.$transaction(
        async (tx) => {
          const overlapping = await countOverlappingConfirmed({
            companyId: params.companyId,
            startUtc: newStartUtc,
            endUtc: newEndUtc,
            bufferMinutes: config.appointmentBufferMinutes,
            excludeAppointmentId: appointment.id,
            tx,
          });
          if (overlapping >= config.maxSimultaneousAppointments) throw new SlotTakenError();
          await tx.appointment.update({ where: { id: appointment.id }, data: { startsAt: newStartUtc, endsAt: newEndUtc } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    );
  } catch (err) {
    if (err instanceof SlotTakenError) return { rescheduled: false, reason: "ese horario se acaba de ocupar, elegí otro" };
    throw err;
  }

  try {
    await provider.updateEvent({
      externalEventId: appointment.googleEventId,
      startUtc: newStartUtc,
      endUtc: newEndUtc,
      timezone: config.timezone,
    });
  } catch (err) {
    await prisma.appointment.update({ where: { id: appointment.id }, data: { startsAt: previousStartsAt, endsAt: previousEndsAt } });
    return { rescheduled: false, reason: err instanceof Error ? err.message : "Error desconocido" };
  }

  return { rescheduled: true, startsAt: params.newStartsAt, durationMinutes };
}
