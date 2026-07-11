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
  /** true solo cuando el contexto lo arma una ruta admin autenticada (ej. /api/products/nl-command),
   * ya validada con requireRole. Hace que isStaff() pase sin necesidad de un customerPhone que
   * matchee staffPhoneNumbers. Cualquier caller que la setee en true debe limitar `tools` a una
   * familia acotada (ver nl-command: solo INVENTORY_TOOLS) — este flag habilita TODOS los tools
   * mutantes que reciba runWithTools, no solo los de stock. */
  isAdminSession?: boolean;
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
