"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeSourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { processKnowledgeSource } from "@/lib/ai/knowledge";
import { extractTextFromFile, knowledgeTypeForFile } from "@/lib/ai/fileExtract";

export interface CreateKnowledgeSourceResult {
  ok: boolean;
  error?: string;
}

export async function createKnowledgeSource(formData: FormData): Promise<CreateKnowledgeSourceResult> {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  let name = String(formData.get("name") ?? "").trim();
  let type = String(formData.get("type") ?? "TEXT") as KnowledgeSourceType;
  let content = String(formData.get("content") ?? "").trim();

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const detectedType = knowledgeTypeForFile(file.name);
    if (!detectedType) {
      return { ok: false, error: `Formato no soportado: "${file.name}". Usá PDF, Word, Excel, CSV o texto.` };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      content = await extractTextFromFile(file.name, buffer);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "No se pudo leer el archivo" };
    }

    type = detectedType;
    if (!name) name = file.name;
  }

  if (!name || !content) {
    return { ok: false, error: "Falta un nombre y contenido (pegado o desde un archivo)" };
  }

  const source = await prisma.knowledgeSource.create({
    data: { companyId: ctx.companyId, name, type, content },
  });

  try {
    await processKnowledgeSource(source.id);
  } catch {
    // el estado ERROR ya queda guardado en processKnowledgeSource; se puede reprocesar desde la UI.
  }

  revalidatePath("/knowledge");
  return { ok: true };
}

export async function reprocessKnowledgeSource(sourceId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const source = await prisma.knowledgeSource.findFirst({ where: { id: sourceId, companyId: ctx.companyId } });
  if (!source) return;
  await processKnowledgeSource(sourceId);
  revalidatePath("/knowledge");
}

export async function deleteKnowledgeSource(sourceId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.knowledgeSource.deleteMany({ where: { id: sourceId, companyId: ctx.companyId } });
  revalidatePath("/knowledge");
}
