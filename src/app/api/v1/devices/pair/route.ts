import { AutoSyncDeviceType } from "@prisma/client";
import { NextResponse } from "next/server";
import { createDevicePairingCode } from "@/lib/autosync";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const pairing = await createDevicePairingCode(user.id, AutoSyncDeviceType.BROWSER_EXTENSION);
  return NextResponse.json({ code: pairing.code, expiresAt: pairing.expiresAt.toISOString() });
}
