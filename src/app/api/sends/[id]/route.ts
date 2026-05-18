import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const send = await db.send.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, name: true, color: true } },
      metrics: true,
      copyOwner: { select: { id: true, name: true, email: true } },
      sendOwner: { select: { id: true, name: true, email: true } },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!send) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(send);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const data = await req.json();
  const prev = await db.send.findUnique({ where: { id }, select: { status: true, campaignId: true } });

  const send = await db.send.update({
    where: { id },
    data: {
      ...(data.channel !== undefined && { channel: data.channel }),
      ...(data.base !== undefined && { base: data.base }),
      ...(data.scheduledDate !== undefined && { scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null }),
      ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.phase !== undefined && { phase: data.phase }),
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.audience !== undefined && { audience: data.audience }),
      ...(data.copyLink !== undefined && { copyLink: data.copyLink }),
      ...(data.copyOwnerId !== undefined && { copyOwnerId: data.copyOwnerId || null }),
      ...(data.sendOwnerId !== undefined && { sendOwnerId: data.sendOwnerId || null }),
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.externalId !== undefined && { externalId: data.externalId }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.sentAt !== undefined && { sentAt: data.sentAt ? new Date(data.sentAt) : null }),
    },
    include: {
      campaign: { select: { id: true, name: true } },
      metrics: true,
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user?.id,
      campaignId: prev?.campaignId,
      sendId: id,
      action: "send_updated",
      details: JSON.stringify({
        changes: data,
        previousStatus: prev?.status,
      }),
    },
  });

  return NextResponse.json(send);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(session.user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const send = await db.send.findUnique({ where: { id }, select: { campaignId: true } });
  await db.send.delete({ where: { id } });

  await db.activityLog.create({
    data: {
      userId: session.user?.id,
      campaignId: send?.campaignId,
      action: "send_deleted",
    },
  });

  return NextResponse.json({ ok: true });
}
