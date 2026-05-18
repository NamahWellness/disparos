import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Rota de setup inicial — roda migrations e cria usuário admin
// Protegida pela variável SETUP_SECRET no .env
// Chamar UMA vez após o primeiro deploy: GET /api/admin/setup?secret=SEU_SETUP_SECRET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cria usuário admin se não existir
    const exists = await db.user.findUnique({
      where: { email: "admin@campaignops.com" },
    });

    if (!exists) {
      const password = await bcrypt.hash("admin123", 10);
      await db.user.create({
        data: {
          name: "Admin",
          email: "admin@campaignops.com",
          password,
          role: "admin",
        },
      });
    }

    // Cria campanha demo se não existir
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
        ownerId: (await db.user.findUnique({ where: { email: "admin@campaignops.com" } }))!.id,
      },
    });

    const sendCount = await db.send.count({ where: { campaignId: campaign.id } });
    if (sendCount === 0) {
      const sends = [
        { channel: "push", base: "Base", scheduledDate: new Date("2026-04-30"), scheduledTime: "08h00", status: "sent", phase: "signup", subject: "Último Dia Lote 0", audience: "Base" },
        { channel: "email", base: "Automação", scheduledDate: null, scheduledTime: "Automação FLUXO A", status: "scheduled", phase: "welcome", subject: "Boas Vindas + Orientação Compradores", audience: "Compradores imersão" },
        { channel: "whatsapp_group", base: "Automação", scheduledDate: null, scheduledTime: "automação", status: "scheduled", phase: "invite", subject: "Enxoval grupo", audience: "Compradores imersão" },
        { channel: "call", base: "LIGAÇÃO", scheduledDate: new Date("2026-05-29"), scheduledTime: "12h00", status: "writing", phase: "event", subject: "É AMANHA LIG. 1", audience: "Compradores imersão" },
        { channel: "email", base: "Base", scheduledDate: new Date("2026-05-18"), scheduledTime: "09h00", status: "review", phase: "reminder", subject: "Últimas vagas - Confirme sua presença", audience: "Inscritos" },
      ];
      for (const s of sends) {
        await db.send.create({ data: { ...s, campaignId: campaign.id } });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Setup concluído! Login: admin@campaignops.com / admin123",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
