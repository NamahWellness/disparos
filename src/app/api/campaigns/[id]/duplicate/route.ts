import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const original = await db.campaign.findUnique({
    where: { id },
    include: { sends: true },
  });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await db.campaign.create({
    data: {
      name: `${original.name} (cópia)`,
      description: original.description,
      product: original.product,
      startDate: original.startDate,
      endDate: original.endDate,
      status: "planning",
      tags: original.tags,
      notes: original.notes,
      color: original.color,
      ownerId: session.user!.id!,
    },
  });

  for (const send of original.sends) {
    await db.send.create({
      data: {
        campaignId: copy.id,
        channel: send.channel,
        base: send.base,
        scheduledDate: send.scheduledDate,
        scheduledTime: send.scheduledTime,
        status: "idea",
        phase: send.phase,
        subject: send.subject,
        audience: send.audience,
        copyLink: send.copyLink,
        platform: send.platform,
        notes: send.notes,
      },
    });
  }

  return NextResponse.json(copy, { status: 201 });
}
