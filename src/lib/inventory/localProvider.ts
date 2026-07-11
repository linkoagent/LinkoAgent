import { prisma } from "@/lib/prisma";
import type { InventoryItem, InventoryProvider } from "./types";

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
}
