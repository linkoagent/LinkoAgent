import type { Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeWords } from "@/lib/ai/embeddings";
import { isStaff } from "./authz";
import type { ToolDefinition } from "./types";

function toolErrorResult(err: unknown): Record<string, unknown> {
  return { error: err instanceof Error ? err.message : "Error desconocido" };
}

/** Busca productos por nombre: primero substring (case-insensitive); si no hay resultados, cae
 * a superposición de palabras (mismo criterio que bestKnowledgeEntry en provider.ts). */
async function findProductsByName(companyId: string, query: string): Promise<Product[]> {
  const direct = await prisma.product.findMany({
    where: { companyId, name: { contains: query, mode: "insensitive" } },
    take: 5,
  });
  if (direct.length > 0) return direct;

  const all = await prisma.product.findMany({ where: { companyId } });
  const queryWords = new Set(normalizeWords(query));
  const scored = all
    .map((p) => ({ product: p, score: normalizeWords(p.name).filter((w) => queryWords.has(w)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.product);
}

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

      const matches = await findProductsByName(ctx.companyId, productName);
      if (matches.length === 0) return { found: 0 };
      if (matches.length > 1) {
        return { found: matches.length, products: matches.map((p) => ({ name: p.name, stock: p.stock })) };
      }
      const [product] = matches;
      return { found: 1, name: product.name, stock: product.stock, unit: product.unit };
    } catch (err) {
      return toolErrorResult(err);
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

      const matches = await findProductsByName(ctx.companyId, productName);
      if (matches.length === 0) return { found: 0 };
      if (matches.length > 1) {
        return { found: matches.length, products: matches.map((p) => ({ name: p.name, stock: p.stock })) };
      }

      const [product] = matches;
      const updated = await prisma.product.update({ where: { id: product.id }, data: { stock: Math.max(0, newStock) } });
      return { updated: true, name: updated.name, stock: updated.stock };
    } catch (err) {
      return toolErrorResult(err);
    }
  },
};

export const INVENTORY_TOOLS: ToolDefinition[] = [checkStockTool, updateStockTool];
