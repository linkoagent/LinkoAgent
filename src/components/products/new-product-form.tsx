"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProduct } from "@/lib/actions/products";
import { CustomFieldsEditor } from "./custom-fields-editor";

export function NewProductForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // CustomFieldsEditor mantiene su propio estado de React (no es un input nativo simple), así que
  // formRef.current?.reset() no lo vacía — se lo fuerza a remontar cambiando su key.
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createProduct(formData);
          formRef.current?.reset();
          setResetKey((k) => k + 1);
        })
      }
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="Ej: Silla gris" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" type="number" min={0} defaultValue={0} required />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Otros datos (opcional)</Label>
        <CustomFieldsEditor
          key={resetKey}
          name="customFields"
          defaultRows={[
            { key: "Precio", value: "" },
            { key: "Unidad", value: "" },
          ]}
        />
      </div>

      <div>
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Agregando..." : "Agregar producto"}
        </Button>
      </div>
    </form>
  );
}
