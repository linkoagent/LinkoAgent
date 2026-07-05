import { PlanTier } from "@prisma/client";

export const PLAN_DEFS: Record<
  PlanTier,
  {
    name: string;
    priceUsd: number;
    setupFeeUsd: number;
    maxAgents: number;
    maxConversationsMonth: number;
    maxChannels: number;
    maxUsers: number;
  }
> = {
  STARTER: {
    name: "Starter",
    priceUsd: 59,
    setupFeeUsd: 150,
    maxAgents: 1,
    maxConversationsMonth: 500,
    maxChannels: 1,
    maxUsers: 2,
  },
  PRO: {
    name: "Pro",
    priceUsd: 179,
    setupFeeUsd: 400,
    maxAgents: 3,
    maxConversationsMonth: 2000,
    maxChannels: 3,
    maxUsers: 5,
  },
  BUSINESS: {
    name: "Business",
    priceUsd: 429,
    setupFeeUsd: 800,
    maxAgents: 10,
    maxConversationsMonth: 6000,
    maxChannels: 6,
    maxUsers: 15,
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceUsd: 0,
    setupFeeUsd: 0,
    maxAgents: 999,
    maxConversationsMonth: 999999,
    maxChannels: 999,
    maxUsers: 999,
  },
};

export const AGENT_TYPE_LABELS: Record<string, string> = {
  ATENCION: "Atención al cliente",
  VENTAS: "Ventas",
  SOPORTE: "Soporte",
  RESERVAS: "Reservas",
  POSTVENTA: "Postventa",
  COBRANZAS: "Cobranzas",
  PERSONALIZADO: "Personalizado",
};

export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  PENDING: "Pendiente",
  HANDED_OFF: "Derivado a humano",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPANY_ADMIN: "Admin de empresa",
  AGENT_HUMAN: "Agente humano",
};
