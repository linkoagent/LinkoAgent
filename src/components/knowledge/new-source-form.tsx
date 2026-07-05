"use client";

import { useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createKnowledgeSource } from "@/lib/actions/knowledge";

export function NewSourceForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createKnowledgeSource(formData);
          formRef.current?.reset();
        })
      }
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h3 className="font-display text-sm font-semibold text-foreground">Agregar conocimiento</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required placeholder="Ej: FAQs de horarios y envíos" />
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
        <Label htmlFor="content">Contenido</Label>
        <Textarea
          id="content"
          name="content"
          required
          rows={6}
          placeholder={"Pregunta: ¿Cuál es el horario?\nRespuesta: Atendemos de lunes a sábado de 9 a 20.\n\nPregunta: ¿Hacen envíos?\nRespuesta: Sí, a todo el país."}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Procesando..." : "Guardar y procesar"}
      </Button>
    </form>
  );
}
