import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const phase = searchParams.get("phase");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const sends = await db.send.findMany({
    where: {
      ...(campaignId ? { campaignId } : {}),
      ...(channel ? { channel } : {}),
      ...(status ? { status } : {}),
      ...(phase ? { phase } : {}),
      ...(from || to
        ? {
            scheduledDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search } },
              { audience: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      campaign: { select: { id: true, name: true, color: true } },
      metrics: true,
      copyOwner: { select: { id: true, name: true } },
      sendOwner: { select: { id: true, name: true } },
    },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(sends);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const send = await db.send.create({
    data: {
      campaignId: data.campaignId,
      channel: data.channel,
      base: data.base,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      scheduledTime: data.scheduledTime,
      status: data.status ?? "idea",
      phase: data.phase,
      subject: data.subject,
      audience: data.audience,
      copyLink: data.copyLink,
      copyOwnerId: data.copyOwnerId || null,
      sendOwnerId: data.sendOwnerId || null,
      platform: data.platform,
      externalId: data.externalId,
      notes: data.notes,
    },
    include: {
      campaign: { select: { id: true, name: true } },
      metrics: true,
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user?.id,
      campaignId: data.campaignId,
      sendId: send.id,
      action: "send_created",
      details: JSON.stringify({ channel: send.channel, subject: send.subject }),
    },
  });

  return NextResponse.json(send, { status: 201 });
}
