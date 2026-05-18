import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const campaigns = await db.campaign.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { sends: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const campaign = await db.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      product: data.product,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status ?? "planning",
      tags: data.tags ? JSON.stringify(data.tags) : null,
      notes: data.notes,
      color: data.color,
      ownerId: session.user!.id!,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user?.id,
      campaignId: campaign.id,
      action: "campaign_created",
      details: JSON.stringify({ name: campaign.name }),
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
