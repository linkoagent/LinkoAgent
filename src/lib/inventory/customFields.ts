const MAX_FIELDS = 40;
const MAX_KEY_LEN = 60;
const MAX_VALUE_LEN = 500;

export type CustomFields = Record<string, string>;

/** Lee el `Json` de Prisma (Product.customFields). Defensivo: cualquier forma inesperada cae a {}
 * — mismo criterio que parseBusinessHours en src/lib/agenda/rules.ts. */
export function parseCustomFields(raw: unknown): CustomFields {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: CustomFields = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const k = key.trim();
    if (!k || value == null) continue;
    result[k] = String(value).trim();
  }
  return result;
}

/** Lee el hidden input serializado por CustomFieldsEditor: un array `[{key,value}]` en JSON.
 * Se descarta cualquier par con key O value en blanco (ambos deben tener contenido); claves
 * duplicadas -> gana la última ocurrencia; se cortan claves/valores largos y se limita la
 * cantidad total, como defensa ya que el server action es un POST invocable directamente. */
export function parseCustomFieldsFormInput(raw: FormDataEntryValue | null): CustomFields {
  if (typeof raw !== "string" || !raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!Array.isArray(parsed)) return {};

  const entries: [string, string][] = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") continue;
    const key = String((row as { key?: unknown }).key ?? "").trim().slice(0, MAX_KEY_LEN);
    const value = String((row as { value?: unknown }).value ?? "").trim().slice(0, MAX_VALUE_LEN);
    if (!key || !value) continue;
    entries.push([key, value]);
  }
  return Object.fromEntries(entries.slice(0, MAX_FIELDS));
}
