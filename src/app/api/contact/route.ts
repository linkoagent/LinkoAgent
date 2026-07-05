import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email/client";
import { contactNotificationEmail } from "@/lib/email/templates";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  channel: z.string().optional(),
  monthlyMessages: z.string().optional(),
  industry: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`contact:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes, probá de nuevo en un minuto." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  await prisma.contactRequest.create({ data: parsed.data });

  await sendEmail({
    to: "hola@linkoagent.com",
    subject: `Nuevo lead: ${parsed.data.company}`,
    html: contactNotificationEmail(parsed.data),
  });

  return NextResponse.json({ ok: true });
}
