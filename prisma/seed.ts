import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLAN_DEFS } from "../src/lib/plans";
import { processKnowledgeSource } from "../src/lib/ai/knowledge";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "linko1234";

async function main() {
  console.log("Seed: planes...");
  for (const [tier, def] of Object.entries(PLAN_DEFS)) {
    await prisma.plan.upsert({
      where: { tier: tier as keyof typeof PLAN_DEFS },
      update: def,
      create: { tier: tier as keyof typeof PLAN_DEFS, ...def },
    });
  }

  console.log("Seed: empresa interna Linko HQ + super admin...");
  const linkoHQ = await prisma.company.upsert({
    where: { id: "linko-hq" },
    update: {},
    create: { id: "linko-hq", name: "Linko HQ", industry: "Software" },
  });

  const superAdminPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@linko.ai" },
    update: {},
    create: { name: "Equipo Linko", email: "superadmin@linko.ai", passwordHash: superAdminPasswordHash },
  });
  await prisma.membership.upsert({
    where: { userId_companyId: { userId: superAdmin.id, companyId: linkoHQ.id } },
    update: { role: "SUPER_ADMIN" },
    create: { userId: superAdmin.id, companyId: linkoHQ.id, role: "SUPER_ADMIN" },
  });

  console.log("Seed: empresa demo Café Aurora...");
  const company = await prisma.company.upsert({
    where: { id: "demo-cafe-aurora" },
    update: {},
    create: {
      id: "demo-cafe-aurora",
      name: "Café Aurora",
      industry: "Cafetería / Coworking",
      brandTone: "cercano, cálido, con onda porteña",
      outOfHoursMessage: "¡Gracias por escribirnos! Ahora estamos cerrados, te respondemos apenas abramos.",
      businessHours: { open: "08:00", close: "20:00", days: ["mon", "tue", "wed", "thu", "fri", "sat"] },
    },
  });

  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { tier: "PRO" } });
  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      planId: proPlan.id,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const adminPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@cafeaurora.com" },
    update: {},
    create: { name: "Marina Aurora", email: "admin@cafeaurora.com", passwordHash: adminPasswordHash },
  });
  await prisma.membership.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: company.id } },
    update: { role: "COMPANY_ADMIN" },
    create: { userId: admin.id, companyId: company.id, role: "COMPANY_ADMIN" },
  });

  const agentUserPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const agentUser = await prisma.user.upsert({
    where: { email: "equipo@cafeaurora.com" },
    update: {},
    create: { name: "Facu Soporte", email: "equipo@cafeaurora.com", passwordHash: agentUserPasswordHash },
  });
  await prisma.membership.upsert({
    where: { userId_companyId: { userId: agentUser.id, companyId: company.id } },
    update: { role: "AGENT_HUMAN" },
    create: { userId: agentUser.id, companyId: company.id, role: "AGENT_HUMAN" },
  });

  console.log("Seed: canal de WhatsApp (modo simulado)...");
  const channel = await prisma.channel.upsert({
    where: { phoneNumberId: "demo-phone-id-000001" },
    update: {},
    create: {
      companyId: company.id,
      type: "WHATSAPP",
      status: "CONNECTED",
      accountName: "Café Aurora",
      phoneNumberId: "demo-phone-id-000001",
      wabaId: "demo-waba-000001",
      connectedAt: new Date(),
    },
  });

  console.log("Seed: agente de atención + conocimiento...");
  const agent = await prisma.agent.upsert({
    where: { id: "demo-agent-sofia" },
    update: {},
    create: {
      id: "demo-agent-sofia",
      companyId: company.id,
      name: "Sofía",
      type: "ATENCION",
      objective: "Responder consultas de horarios, menú, wifi y reservas de mesa.",
      tone: "cercano, cálido, con onda porteña, tuteando siempre",
      instructions:
        "Sos la recepcionista virtual de Café Aurora, una cafetería y coworking en Buenos Aires. Respondé consultas sobre horarios, menú, wifi y reservas usando la información cargada. Si preguntan por reservas grupales de más de 8 personas, derivá a una persona del equipo.",
      handoffRules: "reclamo, reserva grupal, más de 8 personas, factura",
      isActive: true,
      channels: { create: [{ channelId: channel.id }] },
    },
  });

  const faqSource = await prisma.knowledgeSource.upsert({
    where: { id: "demo-source-faq" },
    update: {},
    create: {
      id: "demo-source-faq",
      companyId: company.id,
      name: "FAQs Café Aurora",
      type: "FAQ",
      content: `Pregunta: ¿Cuál es el horario de atención?
Respuesta: Atendemos de lunes a sábado de 8 a 20hs. Los domingos permanecemos cerrados.

Pregunta: ¿Tienen wifi?
Respuesta: Sí, wifi gratis para todos los clientes. La red es "CafeAurora" y la contraseña te la damos en la barra.

Pregunta: ¿Puedo reservar una mesa?
Respuesta: Sí, para grupos de hasta 8 personas podés reservar respondiendo por acá con día, horario y cantidad de personas. Para grupos más grandes te derivamos con el equipo.

Pregunta: ¿Tienen opciones sin gluten o veganas?
Respuesta: Sí, tenemos tostado vegano, medialunas sin TACC y leches vegetales para el café.

Pregunta: ¿Aceptan tarjetas?
Respuesta: Sí, aceptamos todas las tarjetas y también Mercado Pago.`,
    },
  });

  await prisma.agentKnowledgeSource.upsert({
    where: { agentId_sourceId: { agentId: agent.id, sourceId: faqSource.id } },
    update: {},
    create: { agentId: agent.id, sourceId: faqSource.id },
  });

  try {
    await processKnowledgeSource(faqSource.id);
  } catch (err) {
    console.warn("No se pudo procesar el conocimiento demo (¿está la base levantada con pgvector?):", err);
  }

  console.log("\nListo. Usuarios de prueba (contraseña para todos: 'linko1234'):");
  console.log("- Super Admin:    superadmin@linko.ai");
  console.log("- Admin empresa:  admin@cafeaurora.com");
  console.log("- Agente humano:  equipo@cafeaurora.com");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
