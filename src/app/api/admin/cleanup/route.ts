import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { pattern } = await req.json();
  if (!pattern) return NextResponse.json({ error: "pattern required" }, { status: 400 });

  const campaigns = await db.campaign.findMany({
    where: { name: { contains: pattern } },
    select: { id: true, name: true, _count: { select: { sends: true } } },
  });

  const ids = campaigns.map((c) => c.id);

  if (ids.length === 0) return NextResponse.json({ deleted: 0, campaigns: [] });

  await db.campaign.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ deleted: ids.length, campaigns: campaigns.map((c) => ({ id: c.id, name: c.name, sends: c._count.sends })) });
}
