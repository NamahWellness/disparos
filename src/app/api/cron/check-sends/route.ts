import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchAlerts } from "@/lib/dispatch-alerts";

export async function GET(req: Request) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load settings (create defaults if not exist)
  let settings = await db.systemSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.systemSettings.create({
      data: { id: "singleton", updatedAt: new Date() },
    });
  }

  const hoursAhead = settings.alertHoursBefore;
  const windowEnd = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const now = new Date();

  // 23h cooldown to avoid re-alerting the same send every hour
  const cooldown = new Date(Date.now() - 23 * 60 * 60 * 1000);

  const sends = await db.send.findMany({
    where: {
      status: { notIn: ["sent", "cancelled"] },
      scheduledDate: { gte: now, lte: windowEnd },
      OR: [{ alertSentAt: null }, { alertSentAt: { lt: cooldown } }],
    },
    include: {
      campaign: { select: { id: true, name: true } },
      sendOwner: { select: { id: true, name: true, email: true } },
    },
  });

  if (sends.length === 0) {
    return NextResponse.json({ checked: 0, notified: 0 });
  }

  const results = await dispatchAlerts(sends, settings);

  return NextResponse.json({ checked: sends.length, ...results });
}
