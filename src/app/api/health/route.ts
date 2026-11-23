import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [titles, users] = await Promise.all([prisma.title.count(), prisma.user.count()]);
    return NextResponse.json({ ok: true, titles, users, checkedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, checkedAt: new Date().toISOString() }, { status: 503 });
  }
}
