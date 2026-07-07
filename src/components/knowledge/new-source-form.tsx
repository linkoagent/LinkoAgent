"use client";

import { useTransition, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createKnowledgeSource } from "@/lib/actions/knowledge";

export function NewSourceForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const res = await createKnowledgeSource(formData);
          if (res.ok) {
            setError(null);
            formRef.current?.reset();
          } else {
            setError(res.error ?? "No se pudo guardar la fuente de conocimiento");
          }
        })
      }
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">Agregar conocimiento</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Pegá texto abajo, o subí un archivo (Word, Excel/CSV o texto) — si subís un archivo, se usa su contenido en
          vez del texto pegado. PDF todavía no está soportado.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" placeholder="Ej: FAQs de horarios y envíos" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Tipo</Label>
          <select id="type" name="type" className="h-10 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="FAQ">Preguntas frecuentes</option>
            <option value="TEXT">Texto libre</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content">Contenido (texto pegado)</Label>
        <Textarea
          id="content"
          name="content"
          rows={6}
          placeholder={"Pregunta: ¿Cuál es el horario?\nRespuesta: Atendemos de lunes a sábado de 9 a 20.\n\nPregunta: ¿Hacen envíos?\nRespuesta: Sí, a todo el país."}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="file">O subí un archivo</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".docx,.xlsx,.xls,.csv,.txt"
          className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Procesando..." : "Guardar y procesar"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
