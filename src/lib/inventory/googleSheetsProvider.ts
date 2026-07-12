import type { Integration } from "@prisma/client";
import { GOOGLE_SHEETS_MOCK, getValidAccessToken, getValuesRange, updateRange } from "@/lib/googleSheets/client";
import type { InventoryItem, InventoryProvider, NewInventoryItem } from "./types";

// Solo se usa en modo mock, para poder probar el comando de lenguaje natural de punta a punta
// sin credenciales reales. Mutable por instancia (no por módulo) para que list()/updateStock()
// sucesivos sobre el MISMO proveedor se comporten de forma consistente dentro de un mismo test.
const MOCK_TEMPLATE: string[][] = [
  ["Nombre", "SKU", "Stock", "Precio", "Unidad"],
  ["Silla gris (mock)", "SIL-01", "8", "25000", "unidad"],
  ["Mesa ratona (mock)", "MES-01", "3", "45000", "unidad"],
];

// Cubre columnas A-Z: de sobra para cualquier planilla real sin tener que leer/pedir el ancho
// exacto de antemano.
const SHEET_RANGE = "A:Z";

type ColumnKey = "name" | "sku" | "stock" | "price" | "unit";

/** No hay forma de asumir que el cliente va a nombrar sus columnas "Nombre/SKU/Stock/Precio/
 * Unidad" en ese orden exacto — puede ser un producto, un servicio, cualquier cosa, con su propia
 * planilla ya armada. Se detectan por sinónimo de encabezado, sin importar en qué columna estén. */
const HEADER_SYNONYMS: Record<ColumnKey, string[]> = {
  name: ["nombre", "producto", "servicio", "item", "articulo", "descripcion", "detalle", "concepto", "name", "product", "service", "title"],
  // Sin "id" ni sinónimos igual de cortos/genéricos: como el matching usa .includes(), un
  // sinónimo de 2 letras da falsos positivos (ej. "cantidad" y "unidad" contienen "id").
  sku: ["sku", "codigo", "cod", "code"],
  stock: ["stock", "cantidad", "existencia", "existencias", "disponible", "disponibilidad", "cupo", "cupos", "qty", "quantity"],
  price: ["precio", "costo", "valor", "price", "cost"],
  unit: ["unidad", "medida", "unit", "uom"],
};

export function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function buildColumnMap(headerRow: string[]): Partial<Record<ColumnKey, number>> {
  const map: Partial<Record<ColumnKey, number>> = {};
  headerRow.forEach((raw, index) => {
    const normalized = normalizeHeader(raw ?? "");
    if (!normalized) return;
    for (const key of Object.keys(HEADER_SYNONYMS) as ColumnKey[]) {
      if (map[key] !== undefined) continue; // primera columna que matchea gana
      if (HEADER_SYNONYMS[key].some((syn) => normalized === syn || normalized.includes(syn))) {
        map[key] = index;
      }
    }
  });
  return map;
}

/** 0 -> "A", 1 -> "B", ..., 25 -> "Z", 26 -> "AA", etc. */
export function columnIndexToLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n >= 0) {
    letters = String.fromCharCode((n % 26) + 65) + letters;
    n = Math.floor(n / 26) - 1;
  }
  return letters;
}

/** `id` es directamente el número de fila real en la Sheet (1-based; la fila 1 es el
 * encabezado), para no tener que recalcular offsets entre list() y updateStock(). */
export class GoogleSheetsInventoryProvider implements InventoryProvider {
  readonly provider = "GOOGLE_SHEETS";
  private mockRows: string[][];

  constructor(private integration: Integration) {
    this.mockRows = MOCK_TEMPLATE.map((row) => [...row]);
  }

  private get spreadsheetId(): string {
    if (!this.integration.spreadsheetId) throw new Error("Todavía no configuraste qué planilla usar (falta el spreadsheetId).");
    return this.integration.spreadsheetId;
  }

  private get sheetName(): string {
    return this.integration.sheetName || "Hoja1";
  }

  private async getRawRows(): Promise<string[][]> {
    if (GOOGLE_SHEETS_MOCK) return this.mockRows;
    const accessToken = await getValidAccessToken(this.integration);
    return getValuesRange(this.spreadsheetId, `${this.sheetName}!${SHEET_RANGE}`, accessToken);
  }

  private parseRows(rows: string[][]): { items: InventoryItem[]; columns: Partial<Record<ColumnKey, number>> } {
    if (rows.length === 0) return { items: [], columns: {} };

    const columns = buildColumnMap(rows[0] ?? []);
    if (columns.name === undefined) {
      throw new Error(
        'No encontré una columna de nombre en la fila 1. Poné un encabezado como "Nombre", "Producto" o "Servicio" en alguna columna.'
      );
    }

    const items: InventoryItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = row?.[columns.name];
      if (!row || !name) continue;
      const sheetRowNumber = i + 1; // fila real en la Sheet (1-based; la fila 1 es el encabezado)
      items.push({
        id: String(sheetRowNumber),
        name,
        sku: columns.sku !== undefined ? row[columns.sku] || null : null,
        stock: columns.stock !== undefined ? Number(row[columns.stock] ?? "0") || 0 : 0,
        price: columns.price !== undefined && row[columns.price] ? Number(row[columns.price]) : null,
        unit: columns.unit !== undefined ? row[columns.unit] || null : null,
      });
    }
    return { items, columns };
  }

  async list(): Promise<InventoryItem[]> {
    const rows = await this.getRawRows();
    return this.parseRows(rows).items;
  }

  async updateStock(id: string, newStock: number): Promise<InventoryItem> {
    const rows = await this.getRawRows();
    const { items, columns } = this.parseRows(rows);
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error("No se encontró ese producto en la planilla.");
    if (columns.stock === undefined) {
      throw new Error('Esa planilla no tiene una columna de stock/cantidad detectada, así que no se puede actualizar desde acá.');
    }

    if (GOOGLE_SHEETS_MOCK) {
      const rowIndex = Number(id) - 1; // índice en el array (0-based), la fila 1-based `id`
      if (this.mockRows[rowIndex]) this.mockRows[rowIndex][columns.stock] = String(newStock);
    } else {
      const accessToken = await getValidAccessToken(this.integration);
      const columnLetter = columnIndexToLetter(columns.stock);
      await updateRange(this.spreadsheetId, `${this.sheetName}!${columnLetter}${id}`, [[newStock]], accessToken);
    }

    return { ...item, stock: newStock };
  }

  // Alta de filas nuevas fuera de alcance a propósito en el MVP (ver plan): agregar productos
  // nuevos se hace directo en la planilla, no desde acá.
  async create(_item: NewInventoryItem): Promise<InventoryItem> {
    throw new Error(
      "No se pueden crear productos nuevos automáticamente en la planilla conectada. Agregalo directo como una fila nueva en la Google Sheet."
    );
  }
}
