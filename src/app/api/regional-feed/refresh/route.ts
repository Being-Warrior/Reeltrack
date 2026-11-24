import { NextResponse } from "next/server";
import { refreshRegionalMovieFeed } from "@/lib/regional-feeds";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST() {
  try {
    const user = await requireUser();
    const result = await refreshRegionalMovieFeed(user.preferences?.country ?? "US");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
