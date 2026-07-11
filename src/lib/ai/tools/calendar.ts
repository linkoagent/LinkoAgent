import { hasConnectedProvider } from "@/lib/agenda/providerFactory";
import { checkAvailability, bookAppointment, cancelAppointment, rescheduleAppointment } from "@/lib/agenda/service";
import { toolErrorResult } from "./errors";
import type { ToolDefinition } from "./types";

/**
 * Estos tools son deliberadamente delgados: parsean los argumentos del modelo y delegan toda la
 * lógica de negocio (horario, feriados, buffer, almuerzo, cupo, y a qué proveedor de calendario
 * conectado hablarle) al módulo de Agenda (src/lib/agenda/service.ts). Ni este archivo ni el
 * resto de src/lib/ai/ vuelven a mencionar Google — agregar Outlook u otro proveedor es un
 * cambio dentro de lib/agenda/, no acá.
 */

export const checkAvailabilityTool: ToolDefinition = {
  name: "check_availability",
  description:
    "Chequea si un horario puntual está libre para reservar un turno. Si no está disponible, devuelve alternativas cercanas (pueden caer en otro día si el pedido cae en un día no laboral).",
  parameters: {
    type: "object",
    properties: {
      startsAt: {
        type: "string",
        description: "Fecha y hora deseada, formato YYYY-MM-DDTHH:mm:ss, hora local de la empresa (sin offset de zona).",
      },
      durationMinutes: { type: "number", description: "Duración del turno en minutos. Si no se especifica, usa la configurada por la empresa." },
    },
    required: ["startsAt"],
  },
  async execute(args, ctx) {
    try {
      if (!(await hasConnectedProvider(ctx.companyId))) return { error: "No hay ningún calendario conectado para esta empresa." };

      const startsAt = String(args.startsAt ?? "");
      if (!startsAt) return { error: "Falta la fecha/hora a chequear." };
      const durationMinutes = args.durationMinutes ? Number(args.durationMinutes) : undefined;

      return await checkAvailability({ companyId: ctx.companyId, startsAt, durationMinutes });
    } catch (err) {
      return toolErrorResult("check_availability", err);
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
      durationMinutes: { type: "number", description: "Duración en minutos. Si no se especifica, usa la configurada por la empresa." },
      notes: { type: "string", description: "Notas breves sobre el motivo del turno." },
    },
    required: ["startsAt"],
  },
  async execute(args, ctx) {
    try {
      if (!ctx.customerId) return { error: "No se puede reservar un turno desde este chat de prueba interno." };
      if (!(await hasConnectedProvider(ctx.companyId))) return { error: "No hay ningún calendario conectado para esta empresa." };

      const startsAt = String(args.startsAt ?? "");
      if (!startsAt) return { error: "Falta la fecha/hora del turno." };
      const durationMinutes = args.durationMinutes ? Number(args.durationMinutes) : undefined;
      const notes = args.notes ? String(args.notes) : undefined;

      return await bookAppointment({
        companyId: ctx.companyId,
        customerId: ctx.customerId,
        conversationId: ctx.conversationId,
        startsAt,
        durationMinutes,
        notes,
      });
    } catch (err) {
      return toolErrorResult("book_appointment", err);
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

      const hint = args.startsAt ? String(args.startsAt) : undefined;
      return await cancelAppointment({ companyId: ctx.companyId, customerId: ctx.customerId, timezone: ctx.timezone, hint });
    } catch (err) {
      return toolErrorResult("cancel_appointment", err);
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

      const newStartsAt = String(args.newStartsAt ?? "");
      if (!newStartsAt) return { error: "Falta la nueva fecha/hora." };
      const currentHint = args.currentStartsAt ? String(args.currentStartsAt) : undefined;
      const durationMinutes = args.durationMinutes ? Number(args.durationMinutes) : undefined;

      return await rescheduleAppointment({
        companyId: ctx.companyId,
        customerId: ctx.customerId,
        currentHint,
        newStartsAt,
        durationMinutes,
      });
    } catch (err) {
      return toolErrorResult("reschedule_appointment", err);
    }
  },
};

export const CALENDAR_TOOLS: ToolDefinition[] = [
  checkAvailabilityTool,
  bookAppointmentTool,
  cancelAppointmentTool,
  rescheduleAppointmentTool,
];
