import { AutoSyncDeviceType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { claimDevicePairingCode } from "@/lib/autosync";

export const runtime = "nodejs";

function corsHeaders(): Record<string, string> {
  // The pairing code is short-lived, one-time, and the only credential accepted
  // here. A permissive CORS response lets a locally loaded Chrome extension reach
  // localhost reliably (including Chrome's private-network preflight).
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    "Access-Control-Max-Age": "86400",
  };
}

const claimSchema = z.object({
  code: z.string().trim().length(8),
  deviceName: z.string().trim().min(1).max(80),
  type: z.nativeEnum(AutoSyncDeviceType).default(AutoSyncDeviceType.BROWSER_EXTENSION),
});

export async function POST(request: NextRequest) {
  const headers = corsHeaders();
  try {
    const input = claimSchema.parse(await request.json());
    const result = await claimDevicePairingCode({ ...input, code: input.code.toUpperCase() });
    return NextResponse.json(result, { status: 201, headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to pair this device." }, { status: 400, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
