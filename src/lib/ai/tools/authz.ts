import type { ToolExecutionContext } from "./types";

/** true si quien está escribiendo es un teléfono de staff autorizado (Company.staffPhoneNumbers) —
 * usado por cualquier tool que modifique algo sensible (stock, conocimiento, emails, etc.), para
 * que un cliente cualquiera no pueda ejecutarlo por accidente o a propósito. */
export function isStaff(ctx: ToolExecutionContext): boolean {
  if (!ctx.customerPhone) return false;
  return ctx.staffPhoneNumbers.includes(ctx.customerPhone);
}
