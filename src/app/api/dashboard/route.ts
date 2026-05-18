import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [
    totalCampaigns,
    activeCampaigns,
    scheduledSends,
    sentSends,
    totalSends,
    pendingApproval,
    byChannel,
    byStatus,
    upcomingSends,
    alerts,
    topSends,
  ] = await Promise.all([
    db.campaign.count(),
    db.campaign.count({ where: { status: { in: ["active", "production"] } } }),
    db.send.count({ where: { status: "scheduled" } }),
    db.send.count({ where: { status: "sent" } }),
    db.send.count(),
    db.send.count({ where: { status: "review" } }),
    db.send.groupBy({ by: ["channel"], _count: { _all: true } }),
    db.send.groupBy({ by: ["status"], _count: { _all: true } }),
    db.send.findMany({
      where: {
        scheduledDate: { gte: today, lte: nextWeek },
        status: { notIn: ["sent", "cancelled"] },
      },
      include: {
        campaign: { select: { id: true, name: true, color: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 10,
    }),
    db.send.findMany({
      where: {
        OR: [
          { copyLink: null, status: { notIn: ["sent", "cancelled"] } },
          { audience: null, status: { notIn: ["sent", "cancelled"] } },
          {
            scheduledDate: { lt: today },
            status: { in: ["idea", "writing", "review", "approved"] },
          },
        ],
      },
      include: { campaign: { select: { id: true, name: true } } },
      take: 10,
    }),
    db.send.findMany({
      where: { metrics: { clicks: { gt: 0 } } },
      include: {
        metrics: true,
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { metrics: { clickRate: "desc" } },
      take: 5,
    }),
  ]);

  const delayed = await db.send.count({
    where: {
      scheduledDate: { lt: today },
      status: { in: ["idea", "writing", "review", "approved", "scheduled"] },
    },
  });

  return NextResponse.json({
    totalCampaigns,
    activeCampaigns,
    scheduledSends,
    sentSends,
    totalSends,
    pendingApproval,
    delayed,
    byChannel: byChannel.map((i) => ({ channel: i.channel, _count: i._count._all })),
    byStatus: byStatus.map((i) => ({ status: i.status, _count: i._count._all })),
    upcomingSends,
    alerts,
    topSends,
  });
}
