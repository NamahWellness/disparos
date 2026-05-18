import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios: name, email, password" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já está em uso" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role || "viewer",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
