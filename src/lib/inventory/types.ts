/**
 * Igual criterio que AgendaProvider (src/lib/agenda/types.ts): ni los tools de IA ni /products
 * deberían saber si el stock vive en Postgres o en una Google Sheet conectada. `id` es opaco —
 * cuid de Product en el proveedor local, número de fila (como string) en el de Sheets.
 */
export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: number | null;
  unit: string | null;
}

export interface NewInventoryItem {
  name: string;
  sku?: string | null;
  stock: number;
  price?: number | null;
  unit?: string | null;
}

export interface InventoryProvider {
  readonly provider: string;
  list(): Promise<InventoryItem[]>;
  updateStock(id: string, newStock: number): Promise<InventoryItem>;
  /** No todos los proveedores lo soportan (ej. Google Sheets, MVP deliberadamente sin alta de
   * filas) — en ese caso rechaza con un mensaje legible en vez de intentar algo parcial. */
  create(item: NewInventoryItem): Promise<InventoryItem>;
}
