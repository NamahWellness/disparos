import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await db.campaign.findMany({
    select: { tags: true },
    where: { tags: { not: null } },
  });

  const all = new Set<string>();
  for (const c of campaigns) {
    try {
      const parsed = JSON.parse(c.tags ?? "[]") as string[];
      parsed.forEach((t) => { if (t) all.add(t); });
    } catch {}
  }

  return NextResponse.json([...all].sort((a, b) => a.localeCompare(b)));
}
