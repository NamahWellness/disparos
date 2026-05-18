import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [userCount, campaignCount, sendCount, importCount, byRole, byStatus] = await Promise.all([
    db.user.count(),
    db.campaign.count(),
    db.send.count(),
    db.importedFile.count(),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.send.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return NextResponse.json({
    users: userCount,
    campaigns: campaignCount,
    sends: sendCount,
    imports: importCount,
    byRole: byRole.map((r) => ({ role: r.role, _count: r._count._all })),
    byStatus: byStatus.map((s) => ({ status: s.status, _count: s._count._all })),
  });
}
