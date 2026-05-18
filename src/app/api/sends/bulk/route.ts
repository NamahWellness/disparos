import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, status } = await req.json();
  if (!ids?.length || !status) {
    return NextResponse.json({ error: "ids and status required" }, { status: 400 });
  }

  await db.send.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  return NextResponse.json({ updated: ids.length });
}
