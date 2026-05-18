import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await db.activityLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      campaign: { select: { name: true } },
    },
  });

  return NextResponse.json(logs);
}
