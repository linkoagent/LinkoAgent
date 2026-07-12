"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProduct, deleteProduct } from "@/lib/actions/products";
import { parseCustomFields } from "@/lib/inventory/customFields";
import { CustomFieldsEditor } from "./custom-fields-editor";
import type { Product } from "@prisma/client";

export function ProductRow({ product }: { product: Product }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => updateProduct(product.id, formData))}
      className="flex flex-col gap-3 border-b border-border p-4 text-sm last:border-0"
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Nombre</Label>
          <Input name="name" defaultValue={product.name} className="h-8 text-sm" />
        </div>
        <div className="flex w-28 flex-col gap-1.5">
          <Label>Stock</Label>
          <Input name="stock" type="number" min={0} defaultValue={product.stock} className="h-8 text-sm" />
        </div>
        <div className="flex items-center gap-1.5">
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
      </div>

      <CustomFieldsEditor name="customFields" defaultValue={parseCustomFields(product.customFields)} />
    </form>
  );
}
