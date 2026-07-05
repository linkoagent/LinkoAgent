import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { searchKnowledge } from "@/lib/ai/knowledge";
import { runAgentOnMessage } from "@/lib/ai/agentEngine";

const schema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({ sender: z.enum(["CUSTOMER", "AI"]), content: z.string() })).default([]),
});

/** Chat de prueba interno: corre el mismo motor que producción pero sin persistir nada en la DB. */
export async function POST(req: Request, { params }: { params: { agentId: string } }) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const agent = await prisma.agent.findFirst({ where: { id: params.agentId, companyId: ctx.companyId } });
  if (!agent) return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });

  const knowledgeChunks = await searchKnowledge(agent.id, ctx.companyId, parsed.data.message);
  const result = await runAgentOnMessage({
    agent,
    knowledgeChunks,
    history: parsed.data.history,
    customerMessage: parsed.data.message,
  });

  return NextResponse.json({
    reply: result.content,
    shouldHandoff: result.shouldHandoff,
    tokens: result.totalTokens,
    model: result.model,
  });
}
