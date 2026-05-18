import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: path.resolve("./dev.db") });
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const admin = await db.user.upsert({
    where: { email: "admin@campaignops.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@campaignops.com",
      password,
      role: "admin",
    },
  });

  const campaign = await db.campaign.upsert({
    where: { id: "demo-campaign-1" },
    update: {},
    create: {
      id: "demo-campaign-1",
      name: "Imersão Desatando Nós - Maio 2026",
      description: "Campanha completa da imersão presencial de maio de 2026",
      product: "Imersão Desatando Nós",
      startDate: new Date("2026-04-29"),
      endDate: new Date("2026-06-15"),
      status: "active",
      color: "#6366f1",
      tags: JSON.stringify(["imersão", "presencial", "maio2026"]),
      ownerId: admin.id,
    },
  });

  const sends = [
    {
      channel: "push", base: "Base", scheduledDate: new Date("2026-04-29"), scheduledTime: "07h00",
      status: "cancelled", phase: "signup", subject: "Abertura Lote 0 - R$ 19,00", audience: "Base",
    },
    {
      channel: "push", base: "Base", scheduledDate: new Date("2026-04-30"), scheduledTime: "08h00",
      status: "sent", phase: "signup", subject: "Último Dia Lote 0", audience: "Base",
    },
    {
      channel: "email", base: "Automação", scheduledDate: null, scheduledTime: "Automação FLUXO A",
      status: "scheduled", phase: "welcome", subject: "Boas Vindas + Orientação Compradores", audience: "Compradores imersão",
      copyLink: "https://docs.google.com/document/d/1n38amGyWQREp38E2VkxeKDzB-HuOdnaUrRxT4lu9Tt8/",
    },
    {
      channel: "whatsapp_group", base: "Automação", scheduledDate: null, scheduledTime: "automação",
      status: "scheduled", phase: "invite", subject: "Enxoval grupo", audience: "Compradores imersão",
    },
    {
      channel: "whatsapp_individual", base: "Automação", scheduledDate: null, scheduledTime: "Automação FLUXO A",
      status: "scheduled", phase: "invite", subject: "Confirmação compra + boas vindas + bonus", audience: "Compradores imersão",
    },
    {
      channel: "call", base: "LIGAÇÃO", scheduledDate: new Date("2026-05-29"), scheduledTime: "12h00",
      status: "writing", phase: "event", subject: "É AMANHA LIG. 1", audience: "Compradores imersão",
    },
    {
      channel: "sms", base: "SMS", scheduledDate: new Date("2026-05-29"), scheduledTime: "19h00",
      status: "writing", phase: "event", subject: "É AMANHA SMS. 1", audience: "Compradores imersão",
    },
    {
      channel: "email", base: "Base", scheduledDate: new Date("2026-05-18"), scheduledTime: "09h00",
      status: "review", phase: "reminder", subject: "Últimas vagas - Confirme sua presença", audience: "Inscritos",
    },
  ];

  for (let i = 0; i < sends.length; i++) {
    const s = sends[i];
    await db.send.create({
      data: { ...s, campaignId: campaign.id },
    });
  }

  console.log("✓ Seed concluído!");
  console.log("  Login: admin@campaignops.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
