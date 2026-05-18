import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const data = await req.json();

  const allowed = ["admin", "manager", "copywriter", "operational", "viewer"];
  if (data.role && !allowed.includes(data.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: {
      ...(data.role !== undefined && { role: data.role }),
      ...(data.name !== undefined && { name: data.name }),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(user);
}
