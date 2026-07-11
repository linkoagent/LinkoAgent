import { prisma } from "@/lib/prisma";
import type { InventoryItem, InventoryProvider, NewInventoryItem } from "./types";

/** Proveedor por defecto: el mismo Product de Postgres que ya usa /products, sin ningún cambio
 * de comportamiento respecto de antes de esta refactorización. */
export class LocalInventoryProvider implements InventoryProvider {
  readonly provider = "LOCAL";

  constructor(private companyId: string) {}

  async list(): Promise<InventoryItem[]> {
    const products = await prisma.product.findMany({ where: { companyId: this.companyId } });
    return products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, price: p.price, unit: p.unit }));
  }

  async updateStock(id: string, newStock: number): Promise<InventoryItem> {
    const updated = await prisma.product.update({ where: { id }, data: { stock: Math.max(0, newStock) } });
    return { id: updated.id, name: updated.name, sku: updated.sku, stock: updated.stock, price: updated.price, unit: updated.unit };
  }

  async create(item: NewInventoryItem): Promise<InventoryItem> {
    const created = await prisma.product.create({
      data: {
        companyId: this.companyId,
        name: item.name,
        sku: item.sku ?? null,
        stock: Math.max(0, item.stock),
        price: item.price ?? null,
        unit: item.unit ?? null,
      },
    });
    return { id: created.id, name: created.name, sku: created.sku, stock: created.stock, price: created.price, unit: created.unit };
  }
}
