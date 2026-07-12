"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Row {
  id: string;
  key: string;
  value: string;
}

function makeRow(key = "", value = ""): Row {
  return { id: crypto.randomUUID(), key, value };
}

/** Lista de pares label→valor con alta/baja, embebida dentro de un <form action={serverAction}>
 * existente vía un hidden input serializado a JSON — no requiere ninguna librería de formularios
 * ni interceptar el submit. Toda la normalización (pares en blanco, duplicados, límites) vive
 * server-side en parseCustomFieldsFormInput, esto solo junta lo que el usuario tipeó. */
export function CustomFieldsEditor({
  name,
  defaultValue,
  defaultRows,
}: {
  name: string;
  defaultValue?: Record<string, string>;
  defaultRows?: { key: string; value: string }[];
}) {
  const [rows, setRows] = useState<Row[]>(() => {
    if (defaultValue && Object.keys(defaultValue).length > 0) {
      return Object.entries(defaultValue).map(([key, value]) => makeRow(key, value));
    }
    if (defaultRows && defaultRows.length > 0) {
      return defaultRows.map((r) => makeRow(r.key, r.value));
    }
    return [makeRow()];
  });

  function updateRow(id: string, field: "key" | "value", value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  const serialized = JSON.stringify(rows.map(({ key, value }) => ({ key, value })));

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={serialized} readOnly />
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            placeholder="Campo (ej: Color)"
            value={row.key}
            onChange={(e) => updateRow(row.id, "key", e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Valor"
            value={row.value}
            onChange={(e) => updateRow(row.id, "value", e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Quitar campo"
            onClick={() => removeRow(row.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="self-start">
        + Agregar campo
      </Button>
    </div>
  );
}
