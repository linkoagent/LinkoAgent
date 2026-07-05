"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AgentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";

function readAgentForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "ATENCION") as AgentType,
    objective: String(formData.get("objective") ?? "").trim() || null,
    tone: String(formData.get("tone") ?? "").trim() || null,
    instructions: String(formData.get("instructions") ?? "").trim(),
    language: String(formData.get("language") ?? "es").trim() || "es",
    handoffRules: String(formData.get("handoffRules") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
    channelIds: formData.getAll("channelIds").map(String),
    knowledgeSourceIds: formData.getAll("knowledgeSourceIds").map(String),
  };
}

export async function createAgent(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const data = readAgentForm(formData);
  if (!data.name || !data.instructions) return;

  const agent = await prisma.agent.create({
    data: {
      companyId: ctx.companyId,
      name: data.name,
      type: data.type,
      objective: data.objective,
      tone: data.tone,
      instructions: data.instructions,
      language: data.language,
      handoffRules: data.handoffRules,
      isActive: data.isActive,
      channels: { create: data.channelIds.map((channelId) => ({ channelId })) },
      knowledgeSources: { create: data.knowledgeSourceIds.map((sourceId) => ({ sourceId })) },
    },
  });

  revalidatePath("/agents");
  redirect(`/agents/${agent.id}`);
}

export async function updateAgent(agentId: string, formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const data = readAgentForm(formData);

  const agent = await prisma.agent.findFirst({ where: { id: agentId, companyId: ctx.companyId } });
  if (!agent) return;

  await prisma.$transaction([
    prisma.agent.update({
      where: { id: agentId },
      data: {
        name: data.name,
        type: data.type,
        objective: data.objective,
        tone: data.tone,
        instructions: data.instructions,
        language: data.language,
        handoffRules: data.handoffRules,
        isActive: data.isActive,
      },
    }),
    prisma.agentChannel.deleteMany({ where: { agentId } }),
    prisma.agentChannel.createMany({ data: data.channelIds.map((channelId) => ({ agentId, channelId })) }),
    prisma.agentKnowledgeSource.deleteMany({ where: { agentId } }),
    prisma.agentKnowledgeSource.createMany({
      data: data.knowledgeSourceIds.map((sourceId) => ({ agentId, sourceId })),
    }),
  ]);

  revalidatePath("/agents");
  revalidatePath(`/agents/${agentId}`);
}

export async function deleteAgent(agentId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.agent.deleteMany({ where: { id: agentId, companyId: ctx.companyId } });
  revalidatePath("/agents");
  redirect("/agents");
}

export async function toggleAgentActive(agentId: string, isActive: boolean) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.agent.updateMany({ where: { id: agentId, companyId: ctx.companyId }, data: { isActive } });
  revalidatePath("/agents");
  revalidatePath(`/agents/${agentId}`);
}
