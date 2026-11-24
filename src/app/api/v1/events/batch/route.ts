import { NextRequest, NextResponse } from "next/server";
import { authenticateAutoSyncDevice, enqueuePlaybackEvents, playbackBatchSchema, processPendingPlaybackEvents } from "@/lib/autosync";

export const runtime = "nodejs";
export const maxDuration = 30;

function corsHeaders(): Record<string, string> {
  // Event delivery requires a hashed device token. CORS is deliberately open so
  // Chrome can make reliable localhost and deployed-extension requests; without
  // the bearer token, this route cannot read or write user activity.
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Access-Control-Max-Age": "86400",
  };
}

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders();
  const device = await authenticateAutoSyncDevice(bearerToken(request));
  if (!device) return NextResponse.json({ error: "Invalid, expired, or revoked device token." }, { status: 401, headers });
  try {
    const input = playbackBatchSchema.parse(await request.json());
    const accepted = await enqueuePlaybackEvents(device, input.events);
    const processing = accepted ? await processPendingPlaybackEvents(Math.min(accepted, 10)) : {};
    return NextResponse.json({ accepted, processing }, { status: 202, headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid playback events." }, { status: 400, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
