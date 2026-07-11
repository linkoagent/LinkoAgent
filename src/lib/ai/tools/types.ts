/**
 * Definición genérica de un tool ejecutable por el agente de IA. No sabe nada de Calendar
 * específicamente — esta capa se reutiliza para futuras familias de acciones (stock, CRM, etc.).
 */

export interface ToolExecutionContext {
  companyId: string;
  agentId: string;
  /** null en el chat de prueba interno ("Probar agente"), donde no hay un cliente/conversación
   * real — los tools que necesitan persistir algo (reservar/cancelar/reprogramar) lo detectan
   * y devuelven un error legible en vez de intentar escribir con un customerId inexistente. */
  customerId: string | null;
  conversationId: string | null;
  /** Teléfono de quien está escribiendo (Customer.phone/channelUserId), null en el chat de prueba. */
  customerPhone: string | null;
  /** Company.staffPhoneNumbers ya separado en lista, para que los tools administrativos (ej.
   * update_stock) chequeen si customerPhone es del dueño/staff antes de ejecutar. */
  staffPhoneNumbers: string[];
  timezone: string;
  /** Company.businessHours (Json?, sin forma estricta en el resto del código). */
  businessHours: unknown;
}

export interface ToolJsonSchema {
  type: "object";
  properties: Record<string, { type: string; description: string; enum?: string[] }>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolJsonSchema;
  /** Nunca debe dejar propagar una excepción: los fallos se devuelven como parte del resultado. */
  execute: (args: Record<string, unknown>, ctx: ToolExecutionContext) => Promise<Record<string, unknown>>;
}
