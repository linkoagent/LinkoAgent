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

  private parseRows(rows: string[][]): InventoryItem[] {
    const items: InventoryItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const sheetRowNumber = i + 1; // fila real en la Sheet (1-based; la fila 1 es el encabezado)
      items.push({
        id: String(sheetRowNumber),
        name: row[0] ?? "",
        sku: row[1] || null,
        stock: Number(row[2] ?? "0") || 0,
        price: row[3] ? Number(row[3]) : null,
        unit: row[4] || null,
      });
    }
    return items;
  }

  async list(): Promise<InventoryItem[]> {
    if (GOOGLE_SHEETS_MOCK) return this.parseRows(this.mockRows);

    const accessToken = await getValidAccessToken(this.integration);
    const rows = await getValuesRange(this.spreadsheetId, `${this.sheetName}!A:E`, accessToken);
    return this.parseRows(rows);
  }

  async updateStock(id: string, newStock: number): Promise<InventoryItem> {
    const items = await this.list();
    const item = items.find((i) => i.id === id);
    if (!item) throw new Error("No se encontró ese producto en la planilla.");

    if (GOOGLE_SHEETS_MOCK) {
      const rowIndex = Number(id) - 1; // índice en el array (0-based), la fila 1-based `id`
      if (this.mockRows[rowIndex]) this.mockRows[rowIndex][2] = String(newStock);
    } else {
      const accessToken = await getValidAccessToken(this.integration);
      await updateRange(this.spreadsheetId, `${this.sheetName}!C${id}`, [[newStock]], accessToken);
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
