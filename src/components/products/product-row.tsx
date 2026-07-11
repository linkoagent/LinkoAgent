"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProduct, deleteProduct } from "@/lib/actions/products";
import type { Product } from "@prisma/client";

export function ProductRow({ product }: { product: Product }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => updateProduct(product.id, formData))}
      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2 border-b border-border px-4 py-2.5 text-sm last:border-0"
    >
      <Input name="name" defaultValue={product.name} className="h-8 text-sm" />
      <Input name="sku" defaultValue={product.sku ?? ""} className="h-8 text-sm" placeholder="SKU" />
      <Input name="stock" type="number" min={0} defaultValue={product.stock} className="h-8 text-sm" />
      <Input name="price" type="number" min={0} step="0.01" defaultValue={product.price ?? ""} className="h-8 text-sm" />
      <Input name="unit" defaultValue={product.unit ?? ""} className="h-8 text-sm" placeholder="Unidad" />
      <div className="flex items-center gap-1.5 justify-self-end">
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          Guardar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Eliminar producto"
          disabled={pending}
          onClick={() => startTransition(() => deleteProduct(product.id))}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </form>
  );
}
