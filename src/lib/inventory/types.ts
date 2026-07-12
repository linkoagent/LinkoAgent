/**
 * Igual criterio que AgendaProvider (src/lib/agenda/types.ts): ni los tools de IA ni /products
 * deberían saber si el stock vive en Postgres o en una Google Sheet conectada. `id` es opaco —
 * cuid de Product en el proveedor local, número de fila (como string) en el de Sheets.
 *
 * `name` y `stock` son los únicos campos "estructurales" (los que necesitan check_stock/
 * update_stock/matchInventoryItems) — un negocio puede vender productos, servicios o cualquier
 * otra cosa con sus propios atributos (precio, SKU, color, talle, "Cant. Ventas", lo que sea), así
 * que todo lo demás vive en `customFields` como pares label->valor libres, con el nombre real del
 * campo/columna de origen como key.
 */
export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  customFields: Record<string, string>;
}

export interface NewInventoryItem {
  name: string;
  stock: number;
  customFields?: Record<string, string>;
}

export interface InventoryProvider {
  readonly provider: string;
  list(): Promise<InventoryItem[]>;
  updateStock(id: string, newStock: number): Promise<InventoryItem>;
  create(item: NewInventoryItem): Promise<InventoryItem>;
  /** Solo lo implementa un proveedor respaldado por una tabla que el cliente ya armó a su manera
   * (Google Sheets): devuelve el header row y los valores tal cual están en el origen, sin pasar
   * por detección de sinónimos, para que /products la refleje 1:1 (mismos nombres, mismo orden). */
  listRaw?(): Promise<{ headers: string[]; rows: { id: string; values: string[] }[] }>;
}
