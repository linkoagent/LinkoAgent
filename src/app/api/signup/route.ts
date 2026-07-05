import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2, "Ingresá tu nombre"),
  companyName: z.string().min(2, "Ingresá el nombre de la empresa"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { name, companyName, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const starterPlan = await prisma.plan.findUnique({ where: { tier: "STARTER" } });
  if (!starterPlan) {
    return NextResponse.json({ error: "No hay planes seedeados. Corré `npm run db:seed`." }, { status: 500 });
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email: normalizedEmail, passwordHash } });
    const company = await tx.company.create({ data: { name: companyName } });
    await tx.membership.create({ data: { userId: user.id, companyId: company.id, role: "COMPANY_ADMIN" } });
    await tx.subscription.create({
      data: {
        companyId: company.id,
        planId: starterPlan.id,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
