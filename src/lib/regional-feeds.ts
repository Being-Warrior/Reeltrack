import { RegionalFeedKind, TitleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { REGIONAL_FEED_TTL_MS, TMDB_BACKGROUND_TIMEOUT_MS } from "@/lib/constants";
import { normalizeCountryCode } from "@/lib/countries";
import { getPopularMoviesByRegion, getTopRatedMoviesByRegion } from "@/lib/tmdb/movies";
import { upsertSearchTitleStub } from "@/lib/tmdb/sync";
import type { TmdbTitleListItem } from "@/lib/tmdb/types";

const titleInclude = { genres: { include: { genre: true } } } as const;

function qualityScore(item: TmdbTitleListItem, sourceBoost: number) {
  const popularity = Math.min(Math.log10(Math.max(item.popularity, 0) + 1) / 3, 1);
  const rating = Math.min(Math.max(item.vote_average, 0) / 10, 1);
  const votes = Math.min(Math.log10(Math.max(item.vote_count, 0) + 1) / 4, 1);
  const releaseYear = Number((item.release_date ?? "").slice(0, 4));
  const age = Number.isFinite(releaseYear) ? Math.max(0, new Date().getUTCFullYear() - releaseYear) : 20;
  const recency = age <= 1 ? 1 : age <= 4 ? 0.7 : age <= 10 ? 0.45 : 0.2;
  return sourceBoost + popularity * 0.42 + rating * 0.3 + votes * 0.18 + recency * 0.1;
}

function combineCandidates(popular: TmdbTitleListItem[], acclaimed: TmdbTitleListItem[]) {
  const candidates = new Map<number, { item: TmdbTitleListItem; score: number; sourceScore: number }>();
  for (const [items, boost] of [[popular, 0.2], [acclaimed, 0.1]] as const) {
    for (const item of items) {
      const title = item.title ?? item.original_title;
      if (!title || !item.poster_path || (!item.overview && item.vote_count < 10)) continue;
      const score = qualityScore(item, boost);
      const current = candidates.get(item.id);
      if (!current || score > current.score) candidates.set(item.id, { item, score, sourceScore: boost });
    }
  }
  return [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, 48);
}

export async function getRegionalMovieFeed(country: string) {
  const normalizedCountry = normalizeCountryCode(country);
  try {
    return await prisma.regionalFeed.findUnique({
      where: { country_kind: { country: normalizedCountry, kind: RegionalFeedKind.POPULAR_MOVIES } },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { title: { include: titleInclude } },
        },
      },
    });
  } catch {
    // Keep Home available until a newly deployed database migration is applied.
    return null;
  }
}

export async function refreshRegionalMovieFeed(country: string) {
  const normalizedCountry = normalizeCountryCode(country);
  const [popularResult, acclaimedResult] = await Promise.allSettled([
    getPopularMoviesByRegion(normalizedCountry, TMDB_BACKGROUND_TIMEOUT_MS),
    getTopRatedMoviesByRegion(normalizedCountry, TMDB_BACKGROUND_TIMEOUT_MS),
  ]);
  const popular = popularResult.status === "fulfilled" ? popularResult.value.results : [];
  const acclaimed = acclaimedResult.status === "fulfilled" ? acclaimedResult.value.results : [];
  const candidates = combineCandidates(popular, acclaimed);
  if (candidates.length === 0) return { country: normalizedCountry, refreshed: false, count: 0 };

  const stored: Awaited<ReturnType<typeof upsertSearchTitleStub>>[] = [];
  for (let index = 0; index < candidates.length; index += 12) {
    stored.push(...await Promise.all(
      candidates.slice(index, index + 12).map(({ item }) => upsertSearchTitleStub(item, TitleType.MOVIE)),
    ));
  }

  const now = new Date();
  const feed = await prisma.regionalFeed.upsert({
    where: { country_kind: { country: normalizedCountry, kind: RegionalFeedKind.POPULAR_MOVIES } },
    update: { refreshedAt: now, expiresAt: new Date(now.getTime() + REGIONAL_FEED_TTL_MS) },
    create: {
      country: normalizedCountry,
      kind: RegionalFeedKind.POPULAR_MOVIES,
      refreshedAt: now,
      expiresAt: new Date(now.getTime() + REGIONAL_FEED_TTL_MS),
    },
  });
  await prisma.$transaction([
    prisma.regionalFeedItem.deleteMany({ where: { feedId: feed.id } }),
    prisma.regionalFeed.update({
      where: { id: feed.id },
      data: {
        items: {
          create: candidates.map((candidate, position) => ({
            titleId: stored[position].id,
            position,
            score: candidate.score,
            sourceScore: candidate.sourceScore,
          })),
        },
      },
    }),
  ]);
  return { country: normalizedCountry, refreshed: true, count: candidates.length };
}

export async function refreshDueRegionalMovieFeeds(limit = 1) {
  const preferences = await prisma.userPreference.findMany({ distinct: ["country"], select: { country: true } });
  const countries = [...new Set(preferences.map((item) => normalizeCountryCode(item.country)))];
  const feeds = await prisma.regionalFeed.findMany({
    where: { kind: RegionalFeedKind.POPULAR_MOVIES, country: { in: countries } },
    select: { country: true, expiresAt: true, refreshedAt: true },
  });
  const feedByCountry = new Map(feeds.map((feed) => [feed.country, feed]));
  const now = Date.now();
  const due = countries
    .filter((country) => !feedByCountry.get(country) || feedByCountry.get(country)!.expiresAt.getTime() <= now)
    .sort((a, b) => (feedByCountry.get(a)?.refreshedAt?.getTime() ?? 0) - (feedByCountry.get(b)?.refreshedAt?.getTime() ?? 0))
    .slice(0, limit);
  return Promise.all(due.map((country) => refreshRegionalMovieFeed(country)));
}
