import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== session.user!.id!) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.notification.update({ where: { id }, data: { read: true } });

  return NextResponse.json({ ok: true });
}
