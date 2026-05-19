import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await db.systemSettings.findUnique({ where: { id: "singleton" } });

  return NextResponse.json(
    settings ?? {
      id: "singleton",
      alertHoursBefore: 24,
      emailEnabled: false,
      slackEnabled: false,
      whatsappEnabled: false,
      postmarkApiKey: null,
      postmarkFromEmail: null,
      slackWebhookUrl: null,
      zApiInstanceId: null,
      zApiToken: null,
      zApiPhones: null,
    }
  );
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const settings = await db.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...body, updatedAt: new Date() },
    update: { ...body, updatedAt: new Date() },
  });

  return NextResponse.json(settings);
}
