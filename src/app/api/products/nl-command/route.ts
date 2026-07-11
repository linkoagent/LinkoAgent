import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { transcribeAudio } from "@/lib/ai/transcription";
import { runWithTools } from "@/lib/ai/toolRuntime";
import { INVENTORY_TOOLS } from "@/lib/ai/tools/inventory";
import type { ChatMessage } from "@/lib/ai/provider";

const SYSTEM_PROMPT =
  "Sos el asistente de gestión de stock de Linko Agent. El dueño del negocio te escribe o te habla para consultar o " +
  "actualizar el stock de sus productos. Usá siempre los tools disponibles (nunca inventes un stock). Respondé breve " +
  "y en español rioplatense confirmando qué hiciste o qué encontraste.";

/**
 * A diferencia del webhook de WhatsApp, esta ruta ya pasó por requireRole (sesión web de
 * COMPANY_ADMIN/SUPER_ADMIN autenticada) — por eso arma el contexto con isAdminSession: true en
 * vez de depender de un customerPhone que matchee staffPhoneNumbers. Solo se le ofrece
 * INVENTORY_TOOLS al modelo, nunca la lista completa de tools del agente.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const formData = await req.formData();
  const audio = formData.get("audio");
  const text = formData.get("text");

  let userMessage: string;
  if (audio instanceof Blob) {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const transcription = await transcribeAudio(buffer, audio.type || "audio/webm");
    userMessage = transcription.text;
  } else if (typeof text === "string" && text.trim()) {
    userMessage = text.trim();
  } else {
    return NextResponse.json({ error: "Escribí o grabá un mensaje." }, { status: 400 });
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: ctx.companyId },
    select: { timezone: true, businessHours: true },
  });

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  const result = await runWithTools({
    messages,
    tools: INVENTORY_TOOLS,
    context: {
      companyId: ctx.companyId,
      agentId: "",
      customerId: null,
      conversationId: null,
      customerPhone: null,
      staffPhoneNumbers: [],
      timezone: company.timezone,
      businessHours: company.businessHours,
      isAdminSession: true,
    },
  });

  return NextResponse.json({ transcript: audio instanceof Blob ? userMessage : null, reply: result.content });
}
