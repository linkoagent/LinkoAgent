import { getInventoryProviderForCompany } from "@/lib/inventory/providerFactory";
import { matchInventoryItems } from "@/lib/inventory/matching";
import { isStaff } from "./authz";
import { toolErrorResult } from "./errors";
import type { ToolDefinition } from "./types";

export const checkStockTool: ToolDefinition = {
  name: "check_stock",
  description: "Consulta el stock actual de un producto por nombre. Cualquiera puede consultarlo (no modifica nada).",
  parameters: {
    type: "object",
    properties: {
      productName: { type: "string", description: "Nombre (o parte del nombre) del producto a buscar." },
    },
    required: ["productName"],
  },
  async execute(args, ctx) {
    try {
      const productName = String(args.productName ?? "");
      if (!productName) return { error: "Falta el nombre del producto." };

      const provider = await getInventoryProviderForCompany(ctx.companyId);
      const items = await provider.list();
      const matches = matchInventoryItems(items, productName);

      if (matches.length === 0) return { found: 0 };
      if (matches.length > 1) {
        return { found: matches.length, products: matches.map((i) => ({ name: i.name, stock: i.stock })) };
      }
      const [item] = matches;
      return { found: 1, name: item.name, stock: item.stock, unit: item.unit };
    } catch (err) {
      return toolErrorResult("check_stock", err);
    }
  },
};

export const updateStockTool: ToolDefinition = {
  name: "update_stock",
  description:
    "Actualiza el stock de un producto a una cantidad nueva (reemplaza el valor, no suma/resta). Solo puede ejecutarlo el dueño/staff autorizado del negocio, nunca un cliente. Si hay más de un producto que matchea el nombre, devuelve la lista para preguntar cuál antes de ejecutar de nuevo.",
  parameters: {
    type: "object",
    properties: {
      productName: { type: "string", description: "Nombre (o parte del nombre) del producto a actualizar." },
      newStock: { type: "number", description: "Nueva cantidad de stock (número entero, 0 o más)." },
    },
    required: ["productName", "newStock"],
  },
  async execute(args, ctx) {
    try {
      if (!isStaff(ctx)) {
        return {
          error:
            "Esta acción solo la puede ejecutar el dueño o el staff del negocio desde un número autorizado (Configuración → Números autorizados para acciones).",
        };
      }

      const productName = String(args.productName ?? "");
      const newStock = Math.round(Number(args.newStock));
      if (!productName) return { error: "Falta el nombre del producto." };
      if (!Number.isFinite(newStock)) return { error: "La cantidad de stock no es un número válido." };

      const provider = await getInventoryProviderForCompany(ctx.companyId);
      const items = await provider.list();
      const matches = matchInventoryItems(items, productName);

      if (matches.length === 0) return { found: 0 };
      if (matches.length > 1) {
        return { found: matches.length, products: matches.map((i) => ({ name: i.name, stock: i.stock })) };
      }

      const [item] = matches;
      const updated = await provider.updateStock(item.id, newStock);
      return { updated: true, name: updated.name, stock: updated.stock };
    } catch (err) {
      return toolErrorResult("update_stock", err);
    }
  },
};

export const INVENTORY_TOOLS: ToolDefinition[] = [checkStockTool, updateStockTool];
