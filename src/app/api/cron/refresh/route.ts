import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ingestCatalog } from "@/lib/tmdb/sync";
import { runUpcomingSync } from "@/lib/upcoming-sync";
import { refreshDueRegionalMovieFeeds } from "@/lib/regional-feeds";
import { processPendingPlaybackEvents } from "@/lib/autosync";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || !header) return false;
  const expected = `Bearer ${secret}`;
  const actual = Buffer.from(header);
  const expectedBuffer = Buffer.from(expected);
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    // Keep the serverless job below Vercel's execution limit. Each run prioritises
    // unseen titles and rotates international markets, years, films, and series.
    const catalog = await ingestCatalog({ maxItems: 24, enrichLimit: 2, preferNew: true, worldwide: true });
    const upcoming = await runUpcomingSync();
    const regionalFeeds = await refreshDueRegionalMovieFeeds(1).catch(() => []);
    const autoSync = await processPendingPlaybackEvents(25).catch(() => ({}));
    return NextResponse.json({ ok: true, catalog, upcoming, regionalFeeds, autoSync, completedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Scheduled catalog refresh failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
