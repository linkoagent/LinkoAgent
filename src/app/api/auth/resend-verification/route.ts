import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { createPasswordToken } from "@/lib/email/tokens";
import { sendEmail } from "@/lib/email/client";
import { verifyEmailEmail } from "@/lib/email/templates";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`resend-verification:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos, probá de nuevo en un minuto." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });

  // Siempre respondemos ok, exista o no el usuario (o ya esté verificado), para no revelar
  // qué emails están registrados.
  if (user && !user.emailVerifiedAt) {
    const token = await createPasswordToken(user.id, "VERIFY_EMAIL", 24);
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify-email?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Confirmá tu email en Linko Agent",
      html: verifyEmailEmail({ name: user.name, verifyUrl }),
    });
  }

  return NextResponse.json({ ok: true });
}
