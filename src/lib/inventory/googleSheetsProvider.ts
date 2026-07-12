import type { Integration } from "@prisma/client";
import { GOOGLE_SHEETS_MOCK, getValidAccessToken, getValuesRange, updateRange, appendRow } from "@/lib/googleSheets/client";
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

type ColumnKey = "name" | "stock";

/** Solo `name` y `stock` son "estructurales" (los necesita check_stock/update_stock) — el resto de
 * las columnas de la planilla (Precio, SKU, Unidad, o cualquier otra que el cliente ya tenga, como
 * "Cant. Ventas") se exponen tal cual, con su encabezado real como label, en customFields. */
const HEADER_SYNONYMS: Record<ColumnKey, string[]> = {
  name: ["nombre", "producto", "servicio", "item", "articulo", "descripcion", "detalle", "concepto", "name", "product", "service", "title"],
  stock: ["stock", "cantidad", "existencia", "existencias", "disponible", "disponibilidad", "cupo", "cupos", "qty", "quantity"],
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

  private parseRows(rows: string[][]): { items: InventoryItem[]; columns: Partial<Record<ColumnKey, number>>; headerRow: string[] } {
    if (rows.length === 0) return { items: [], columns: {}, headerRow: [] };

    const headerRow = rows[0] ?? [];
    const columns = buildColumnMap(headerRow);
    if (columns.name === undefined) {
      throw new Error(
        'No encontré una columna de nombre en la fila 1. Poné un encabezado como "Nombre", "Producto" o "Servicio" en alguna columna.'
      );
    }
    const knownIdx = new Set(Object.values(columns).filter((v): v is number => v !== undefined));

    const items: InventoryItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = row?.[columns.name];
      if (!row || !name) continue;
      const sheetRowNumber = i + 1; // fila real en la Sheet (1-based; la fila 1 es el encabezado)

      const customFields: Record<string, string> = {};
      headerRow.forEach((label, idx) => {
        if (knownIdx.has(idx)) return;
        const header = (label ?? "").trim();
        if (header && row[idx]) customFields[header] = row[idx];
      });

      items.push({
        id: String(sheetRowNumber),
        name,
        stock: columns.stock !== undefined ? Number(row[columns.stock] ?? "0") || 0 : 0,
        customFields,
      });
    }
    return { items, columns, headerRow };
  }

  async list(): Promise<InventoryItem[]> {
    const rows = await this.getRawRows();
    return this.parseRows(rows).items;
  }

  /** Devuelve el header row y los valores tal cual están en la planilla, sin pasar por detección
   * de sinónimos — /products lo usa para mostrar la tabla 1:1 con el Excel real del cliente. */
  async listRaw(): Promise<{ headers: string[]; rows: { id: string; values: string[] }[] }> {
    const rows = await this.getRawRows();
    const headers = (rows[0] ?? []).map((h) => h ?? "");
    const dataRows: { id: string; values: string[] }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row.some(Boolean)) continue;
      dataRows.push({ id: String(i + 1), values: headers.map((_, idx) => row[idx] ?? "") });
    }
    return { headers, rows: dataRows };
  }

  async updateStock(id: string, newStock: number): Promise<InventoryItem> {
    const rows = await this.getRawRows();
    const { items, columns } = this.parseRows(rows);
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error("No se encontró ese producto en la planilla.");
    if (columns.stock === undefined) {
      throw new Error("Esa planilla no tiene una columna de stock/cantidad detectada, así que no se puede actualizar desde acá.");
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

  async create(item: NewInventoryItem): Promise<InventoryItem> {
    const rows = await this.getRawRows();
    const { columns, headerRow } = this.parseRows(rows);
    if (columns.name === undefined) {
      throw new Error(
        'No encontré una columna de nombre en la fila 1. Poné un encabezado como "Nombre", "Producto" o "Servicio" en alguna columna.'
      );
    }

    // El header se puede ir ampliando en memoria a medida que aparecen campos sin columna
    // existente — se agregan al final, nunca se pisa/reordena lo que ya había.
    const workingHeader = [...headerRow];
    const rowValues: string[] = new Array(workingHeader.length).fill("");
    rowValues[columns.name] = item.name;
    if (columns.stock !== undefined) rowValues[columns.stock] = String(item.stock);

    const newColumns: { label: string; index: number }[] = [];
    for (const [key, value] of Object.entries(item.customFields ?? {})) {
      const idx = workingHeader.findIndex(
        (h, i) => i !== columns.name && i !== columns.stock && normalizeHeader(h ?? "") === normalizeHeader(key)
      );
      if (idx !== -1) {
        rowValues[idx] = value;
      } else {
        const newIdx = workingHeader.length;
        workingHeader.push(key);
        rowValues.push(value);
        newColumns.push({ label: key, index: newIdx });
      }
    }

    let sheetRowNumber: number;
    if (GOOGLE_SHEETS_MOCK) {
      if (newColumns.length > 0) this.mockRows[0] = workingHeader;
      this.mockRows.push(rowValues);
      sheetRowNumber = this.mockRows.length;
    } else {
      const accessToken = await getValidAccessToken(this.integration);
      if (newColumns.length > 0) {
        const startLetter = columnIndexToLetter(newColumns[0].index);
        const endLetter = columnIndexToLetter(newColumns[newColumns.length - 1].index);
        await updateRange(
          this.spreadsheetId,
          `${this.sheetName}!${startLetter}1:${endLetter}1`,
          [newColumns.map((c) => c.label)],
          accessToken
        );
      }
      const { updatedRange } = await appendRow(this.spreadsheetId, this.sheetName, rowValues, accessToken);
      const rowMatch = updatedRange.match(/![A-Z]+(\d+)/);
      if (!rowMatch) throw new Error("Se agregó la fila pero no pude confirmar en qué número de fila quedó.");
      sheetRowNumber = Number(rowMatch[1]);
    }

    return {
      id: String(sheetRowNumber),
      name: item.name,
      stock: columns.stock !== undefined ? item.stock : 0,
      customFields: item.customFields ?? {},
    };
  }
}
