"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeSourceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { processKnowledgeSource } from "@/lib/ai/knowledge";

export async function createKnowledgeSource(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "TEXT") as KnowledgeSourceType;
  const content = String(formData.get("content") ?? "").trim();

  if (!name || !content) return;

  const source = await prisma.knowledgeSource.create({
    data: { companyId: ctx.companyId, name, type, content },
  });

  try {
    await processKnowledgeSource(source.id);
  } catch {
    // el estado ERROR ya queda guardado en processKnowledgeSource; se puede reprocesar desde la UI.
  }

  revalidatePath("/knowledge");
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
