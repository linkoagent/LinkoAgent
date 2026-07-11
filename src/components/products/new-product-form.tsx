"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct } from "@/lib/actions/products";

export function NewProductForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createProduct(formData);
          formRef.current?.reset();
        })
      }
      className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-5"
    >
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Ej: Silla gris" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" name="sku" placeholder="Opcional" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stock">Stock</Label>
        <Input id="stock" name="stock" type="number" min={0} defaultValue={0} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="price">Precio</Label>
        <Input id="price" name="price" type="number" min={0} step="0.01" placeholder="Opcional" />
      </div>
      <div className="sm:col-span-5">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Agregando..." : "Agregar producto"}
        </Button>
      </div>
    </form>
  );
}
