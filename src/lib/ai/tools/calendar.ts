import { Prisma, type Integration } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import {
  GOOGLE_CALENDAR_PROVIDER,
  getValidAccessToken,
  queryFreeBusy,
  insertEvent,
  patchEvent,
  deleteEvent,
} from "@/lib/googleCalendar/client";
import type { ToolDefinition, ToolExecutionContext } from "./types";

const DEFAULT_DURATION_MINUTES = 30;

function toolErrorResult(err: unknown): Record<string, unknown> {
  return { error: err instanceof Error ? err.message : "Error desconocido" };
}

async function getConnectedIntegration(companyId: string): Promise<Integration | null> {
  const integration = await prisma.integration.findUnique({
    where: { companyId_provider: { companyId, provider: GOOGLE_CALENDAR_PROVIDER } },
  });
  return integration?.status === "CONNECTED" ? integration : null;
}

/** Company.businessHours es Json? sin forma estricta en el resto del código; asumimos
 * { start: "09:00", end: "18:00" } si existe, si no un horario amplio por defecto. */
function parseBusinessHours(raw: unknown): { startHour: number; endHour: number } {
  if (raw && typeof raw === "object") {
    const bh = raw as { start?: string; end?: string };
    const startHour = bh.start ? Number(bh.start.split(":")[0]) : NaN;
    const endHour = bh.end ? Number(bh.end.split(":")[0]) : NaN;
    if (!Number.isNaN(startHour) && !Number.isNaN(endHour)) return { startHour, endHour };
  }
  return { startHour: 9, endHour: 18 };
}

/** `value` viene SIN offset de zona (ej. "2026-07-12T15:00:00"): se interpreta como hora local
 * de la empresa, nunca como UTC ni como hora del servidor. */
function parseLocalDateTime(value: string, timezone: string): { utcDate: Date; hour: number } {
  const utcDate = fromZonedTime(value, timezone);
  const timePart = value.split("T")[1] ?? "00:00";
  const hour = Number(timePart.split(":")[0]) || 0;
  return { utcDate, hour };
}

async function findLocalConflict(companyId: string, startUtc: Date, endUtc: Date, excludeAppointmentId?: string) {
  return prisma.appointment.findFirst({
    where: {
      companyId,
      status: "CONFIRMED",
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      startsAt: { lt: endUtc },
      endsAt: { gt: startUtc },
    },
  });
}

async function isSlotAvailable(params: {
  integration: Integration;
  companyId: string;
  startUtc: Date;
  endUtc: Date;
  hour: number;
  businessHours: unknown;
  excludeAppointmentId?: string;
}): Promise<{ available: boolean; reason?: string }> {
  const { startHour, endHour } = parseBusinessHours(params.businessHours);
  if (params.hour < startHour || params.hour >= endHour) {
    return { available: false, reason: `fuera de horario de atención (${startHour}:00 a ${endHour}:00)` };
  }

  const localConflict = await findLocalConflict(params.companyId, params.startUtc, params.endUtc, params.excludeAppointmentId);
  if (localConflict) return { available: false, reason: "ya hay un turno reservado en ese horario" };

  const accessToken = await getValidAccessToken(params.integration);
  const busy = await queryFreeBusy({
    accessToken,
    calendarId: params.integration.calendarId,
    timeMin: params.startUtc.toISOString(),
    timeMax: params.endUtc.toISOString(),
  });
  if (busy.length > 0) return { available: false, reason: "el calendario tiene otro evento en ese horario" };

  return { available: true };
}

/** Escanea el mismo día calendario (en incrementos de 30min dentro del horario de atención)
 * buscando hasta 3 horarios libres, para ofrecer alternativas cuando el pedido original choca. */
async function findAlternatives(params: {
  integration: Integration;
  companyId: string;
  dateStr: string;
  durationMinutes: number;
  timezone: string;
  businessHours: unknown;
}): Promise<string[]> {
  const { startHour, endHour } = parseBusinessHours(params.businessHours);
  const alternatives: string[] = [];

  for (let hour = startHour; hour < endHour && alternatives.length < 3; hour++) {
    for (const minute of [0, 30]) {
      if (alternatives.length >= 3) break;
      const candidateLocal = `${params.dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      const { utcDate: startUtc } = parseLocalDateTime(candidateLocal, params.timezone);
      const endUtc = new Date(startUtc.getTime() + params.durationMinutes * 60000);
      const check = await isSlotAvailable({
        integration: params.integration,
        companyId: params.companyId,
        startUtc,
        endUtc,
        hour,
        businessHours: params.businessHours,
      });
      if (check.available) alternatives.push(candidateLocal);
    }
  }
  return alternatives;
}

async function findCustomerAppointments(companyId: string, customerId: string, hint: string | undefined, timezone: string) {
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

export const checkAvailabilityTool: ToolDefinition = {
  name: "check_availability",
  description:
    "Chequea si un horario puntual está libre para reservar un turno. Si no está disponible, devuelve alternativas cercanas el mismo día.",
  parameters: {
    type: "object",
    properties: {
      startsAt: {
        type: "string",
        description: "Fecha y hora deseada, formato YYYY-MM-DDTHH:mm:ss, hora local de la empresa (sin offset de zona).",
      },
      durationMinutes: { type: "number", description: "Duración del turno en minutos. Si no se especifica, usar 30." },
    },
    required: ["startsAt"],
  },
  async execute(args, ctx) {
    try {
      const integration = await getConnectedIntegration(ctx.companyId);
      if (!integration) return { error: "No hay Google Calendar conectado para esta empresa." };

      const startsAt = String(args.startsAt ?? "");
      if (!startsAt) return { error: "Falta la fecha/hora a chequear." };
      const durationMinutes = Number(args.durationMinutes) || DEFAULT_DURATION_MINUTES;

      const { utcDate: startUtc, hour } = parseLocalDateTime(startsAt, ctx.timezone);
      const endUtc = new Date(startUtc.getTime() + durationMinutes * 60000);

      const check = await isSlotAvailable({ integration, companyId: ctx.companyId, startUtc, endUtc, hour, businessHours: ctx.businessHours });
      if (check.available) return { available: true, startsAt };

      const alternatives = await findAlternatives({
        integration,
        companyId: ctx.companyId,
        dateStr: startsAt.split("T")[0],
        durationMinutes,
        timezone: ctx.timezone,
        businessHours: ctx.businessHours,
      });
      return { available: false, reason: check.reason, alternatives };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const bookAppointmentTool: ToolDefinition = {
  name: "book_appointment",
  description:
    "Reserva un turno en el horario indicado. Siempre vuelve a validar disponibilidad antes de reservar, no confíes en un chequeo anterior.",
  parameters: {
    type: "object",
    properties: {
      startsAt: {
        type: "string",
        description: "Fecha y hora del turno, formato YYYY-MM-DDTHH:mm:ss, hora local de la empresa (sin offset de zona).",
      },
      durationMinutes: { type: "number", description: "Duración en minutos. Si no se especifica, usar 30." },
      notes: { type: "string", description: "Notas breves sobre el motivo del turno." },
    },
    required: ["startsAt"],
  },
  async execute(args, ctx) {
    try {
      if (!ctx.customerId) return { error: "No se puede reservar un turno desde este chat de prueba interno." };
      const integration = await getConnectedIntegration(ctx.companyId);
      if (!integration) return { error: "No hay Google Calendar conectado para esta empresa." };

      const startsAt = String(args.startsAt ?? "");
      if (!startsAt) return { error: "Falta la fecha/hora del turno." };
      const durationMinutes = Number(args.durationMinutes) || DEFAULT_DURATION_MINUTES;
      const notes = args.notes ? String(args.notes) : undefined;

      const { utcDate: startUtc, hour } = parseLocalDateTime(startsAt, ctx.timezone);
      const endUtc = new Date(startUtc.getTime() + durationMinutes * 60000);

      const check = await isSlotAvailable({ integration, companyId: ctx.companyId, startUtc, endUtc, hour, businessHours: ctx.businessHours });
      if (!check.available) {
        const alternatives = await findAlternatives({
          integration,
          companyId: ctx.companyId,
          dateStr: startsAt.split("T")[0],
          durationMinutes,
          timezone: ctx.timezone,
          businessHours: ctx.businessHours,
        });
        return { booked: false, reason: check.reason, alternatives };
      }

      // Se crea primero la fila local: el índice único parcial (companyId, startsAt) sobre
      // status=CONFIRMED resuelve la condición de carrera de doble reserva si dos mensajes
      // casi simultáneos piden el mismo horario, mismo patrón P2002 que connectWhatsAppChannel.
      let appointment;
      try {
        appointment = await prisma.appointment.create({
          data: {
            companyId: ctx.companyId,
            customerId: ctx.customerId,
            conversationId: ctx.conversationId,
            googleEventId: "",
            startsAt: startUtc,
            endsAt: endUtc,
            notes,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return { booked: false, reason: "ese horario se acaba de ocupar, elegí otro" };
        }
        throw err;
      }

      try {
        const accessToken = await getValidAccessToken(integration);
        const event = await insertEvent({
          accessToken,
          calendarId: integration.calendarId,
          summary: notes ? `Turno: ${notes}` : "Turno",
          description: notes,
          startsAt: startUtc.toISOString(),
          endsAt: endUtc.toISOString(),
          timezone: ctx.timezone,
        });
        await prisma.appointment.update({ where: { id: appointment.id }, data: { googleEventId: event.id } });
      } catch (err) {
        await prisma.appointment.delete({ where: { id: appointment.id } });
        return toolErrorResult(err);
      }

      return { booked: true, startsAt, durationMinutes };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const cancelAppointmentTool: ToolDefinition = {
  name: "cancel_appointment",
  description:
    "Cancela un turno confirmado del cliente. Si hay más de un turno futuro, devuelve todos para preguntarle al cliente cuál cancelar antes de ejecutar de nuevo con la fecha exacta.",
  parameters: {
    type: "object",
    properties: {
      startsAt: {
        type: "string",
        description: "Fecha/hora aproximada del turno a cancelar, si el cliente la mencionó (formato YYYY-MM-DDTHH:mm:ss). Opcional.",
      },
    },
  },
  async execute(args, ctx) {
    try {
      if (!ctx.customerId) return { error: "No se puede cancelar un turno desde este chat de prueba interno." };
      const integration = await getConnectedIntegration(ctx.companyId);
      if (!integration) return { error: "No hay Google Calendar conectado para esta empresa." };

      const hint = args.startsAt ? String(args.startsAt) : undefined;
      const candidates = await findCustomerAppointments(ctx.companyId, ctx.customerId, hint, ctx.timezone);

      if (candidates.length === 0) return { found: 0 };
      if (candidates.length > 1) {
        return { found: candidates.length, appointments: candidates.map((a) => ({ startsAt: a.startsAt.toISOString() })) };
      }

      const [appointment] = candidates;
      const accessToken = await getValidAccessToken(integration);
      await deleteEvent({ accessToken, calendarId: integration.calendarId, eventId: appointment.googleEventId });
      await prisma.appointment.update({ where: { id: appointment.id }, data: { status: "CANCELLED" } });

      return { cancelled: true, startsAt: appointment.startsAt.toISOString() };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const rescheduleAppointmentTool: ToolDefinition = {
  name: "reschedule_appointment",
  description:
    "Reprograma un turno confirmado del cliente a un nuevo horario. Si hay más de un turno futuro, devuelve todos para preguntarle al cliente cuál mover antes de ejecutar de nuevo.",
  parameters: {
    type: "object",
    properties: {
      currentStartsAt: {
        type: "string",
        description: "Fecha/hora aproximada del turno actual, si el cliente la mencionó (formato YYYY-MM-DDTHH:mm:ss). Opcional.",
      },
      newStartsAt: {
        type: "string",
        description: "Nueva fecha y hora deseada, formato YYYY-MM-DDTHH:mm:ss, hora local de la empresa.",
      },
      durationMinutes: { type: "number", description: "Duración en minutos. Si no se especifica, usa la del turno actual." },
    },
    required: ["newStartsAt"],
  },
  async execute(args, ctx) {
    try {
      if (!ctx.customerId) return { error: "No se puede reprogramar un turno desde este chat de prueba interno." };
      const integration = await getConnectedIntegration(ctx.companyId);
      if (!integration) return { error: "No hay Google Calendar conectado para esta empresa." };

      const newStartsAt = String(args.newStartsAt ?? "");
      if (!newStartsAt) return { error: "Falta la nueva fecha/hora." };

      const hint = args.currentStartsAt ? String(args.currentStartsAt) : undefined;
      const candidates = await findCustomerAppointments(ctx.companyId, ctx.customerId, hint, ctx.timezone);

      if (candidates.length === 0) return { found: 0 };
      if (candidates.length > 1) {
        return { found: candidates.length, appointments: candidates.map((a) => ({ startsAt: a.startsAt.toISOString() })) };
      }

      const [appointment] = candidates;
      const durationMinutes =
        Number(args.durationMinutes) || Math.round((appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60000);

      const { utcDate: newStartUtc, hour } = parseLocalDateTime(newStartsAt, ctx.timezone);
      const newEndUtc = new Date(newStartUtc.getTime() + durationMinutes * 60000);

      const check = await isSlotAvailable({
        integration,
        companyId: ctx.companyId,
        startUtc: newStartUtc,
        endUtc: newEndUtc,
        hour,
        businessHours: ctx.businessHours,
        excludeAppointmentId: appointment.id,
      });
      if (!check.available) {
        const alternatives = await findAlternatives({
          integration,
          companyId: ctx.companyId,
          dateStr: newStartsAt.split("T")[0],
          durationMinutes,
          timezone: ctx.timezone,
          businessHours: ctx.businessHours,
        });
        return { rescheduled: false, reason: check.reason, alternatives };
      }

      const previousStartsAt = appointment.startsAt;
      const previousEndsAt = appointment.endsAt;

      try {
        await prisma.appointment.update({ where: { id: appointment.id }, data: { startsAt: newStartUtc, endsAt: newEndUtc } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return { rescheduled: false, reason: "ese horario se acaba de ocupar, elegí otro" };
        }
        throw err;
      }

      try {
        const accessToken = await getValidAccessToken(integration);
        await patchEvent({
          accessToken,
          calendarId: integration.calendarId,
          eventId: appointment.googleEventId,
          startsAt: newStartUtc.toISOString(),
          endsAt: newEndUtc.toISOString(),
          timezone: ctx.timezone,
        });
      } catch (err) {
        await prisma.appointment.update({ where: { id: appointment.id }, data: { startsAt: previousStartsAt, endsAt: previousEndsAt } });
        return toolErrorResult(err);
      }

      return { rescheduled: true, startsAt: newStartsAt, durationMinutes };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const CALENDAR_TOOLS: ToolDefinition[] = [
  checkAvailabilityTool,
  bookAppointmentTool,
  cancelAppointmentTool,
  rescheduleAppointmentTool,
];
