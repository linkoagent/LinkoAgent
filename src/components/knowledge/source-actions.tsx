"use client";

import { useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reprocessKnowledgeSource, deleteKnowledgeSource } from "@/lib/actions/knowledge";

export function SourceActions({ sourceId }: { sourceId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => reprocessKnowledgeSource(sourceId))}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reprocesar
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => deleteKnowledgeSource(sourceId))}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
