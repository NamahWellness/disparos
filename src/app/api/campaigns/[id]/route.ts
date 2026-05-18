import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } } },
      sends: {
        include: {
          metrics: true,
          copyOwner: { select: { id: true, name: true } },
          sendOwner: { select: { id: true, name: true } },
        },
        orderBy: { scheduledDate: "asc" },
      },
      _count: { select: { sends: true } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const data = await req.json();
  const campaign = await db.campaign.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.product !== undefined && { product: data.product }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.tags !== undefined && { tags: data.tags ? JSON.stringify(data.tags) : null }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user?.id,
      campaignId: id,
      action: "campaign_updated",
      details: JSON.stringify(data),
    },
  });

  return NextResponse.json(campaign);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  await db.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
