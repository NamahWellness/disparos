import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const original = await db.send.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await db.send.create({
    data: {
      campaignId: original.campaignId,
      channel: original.channel,
      base: original.base,
      scheduledDate: original.scheduledDate,
      scheduledTime: original.scheduledTime,
      status: "idea",
      phase: original.phase,
      subject: original.subject ? `${original.subject} (cópia)` : null,
      audience: original.audience,
      copyLink: original.copyLink,
      platform: original.platform,
      notes: original.notes,
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
