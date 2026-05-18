import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const imports = await db.importedFile.findMany({
    orderBy: { createdAt: "desc" },
    include: { campaign: { select: { id: true, name: true } } },
  });

  return NextResponse.json(imports);
}
