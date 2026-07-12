import { prisma } from "@/lib/prisma";
import { parseCustomFields } from "./customFields";
import type { InventoryItem, InventoryProvider, NewInventoryItem } from "./types";

/** Proveedor por defecto: el mismo Product de Postgres que ya usa /products. `name`/`stock` son
 * columnas propias; todo lo demás (precio, SKU, color, talle, lo que sea) vive en customFields. */
export class LocalInventoryProvider implements InventoryProvider {
  readonly provider = "LOCAL";

  constructor(private companyId: string) {}

  async list(): Promise<InventoryItem[]> {
    const products = await prisma.product.findMany({ where: { companyId: this.companyId } });
    return products.map((p) => ({ id: p.id, name: p.name, stock: p.stock, customFields: parseCustomFields(p.customFields) }));
  }

  async updateStock(id: string, newStock: number): Promise<InventoryItem> {
    const updated = await prisma.product.update({ where: { id }, data: { stock: Math.max(0, newStock) } });
    return { id: updated.id, name: updated.name, stock: updated.stock, customFields: parseCustomFields(updated.customFields) };
  }

  async create(item: NewInventoryItem): Promise<InventoryItem> {
    const customFields = item.customFields ?? {};
    const created = await prisma.product.create({
      data: {
        companyId: this.companyId,
        name: item.name,
        stock: Math.max(0, item.stock),
        customFields,
      },
    });
    return { id: created.id, name: created.name, stock: created.stock, customFields: parseCustomFields(created.customFields) };
  }
}
