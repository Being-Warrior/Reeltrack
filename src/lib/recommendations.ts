import { RecommendationEventType, TitleType, WatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RECOMMENDATION_TTL_MS, RECOMMENDATION_VERSION } from "@/lib/constants";

type Candidate = {
  id: string;
  title: string;
  type: TitleType;
  popularity: number;
  voteAverage: number;
  releaseDate: Date | null;
  genreIds: string[];
  keywordIds: string[];
  directorIds: string[];
};

function overlap(a: string[], b: Set<string>) {
  if (a.length === 0 || b.size === 0) return 0;
  let hits = 0;
  for (const value of a) if (b.has(value)) hits += 1;
  return hits / a.length;
}

function recencyScore(date: Date | null) {
  if (!date) return 0.2;
  const years = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years < 1) return 1;
  if (years < 3) return 0.75;
  if (years < 8) return 0.5;
  return 0.3;
}

export async function generateRecommendations(userId: string, limit = 40) {
  const [prefs, ratings, favorites, statuses, dismissed] = await Promise.all([
    prisma.userGenrePreference.findMany({ where: { userId } }),
    prisma.rating.findMany({ where: { userId }, include: { title: { include: { genres: true, keywords: true, credits: true } } } }),
    prisma.favorite.findMany({ where: { userId }, include: { title: { include: { genres: true } } } }),
    prisma.userTitleStatus.findMany({ where: { userId } }),
    prisma.recommendationEvent.findMany({
      where: { userId, eventType: RecommendationEventType.DISMISSED },
      select: { recommendation: { select: { titleId: true } } },
    }),
  ]);

  const excluded = new Set<string>([
    ...statuses.map((row) => row.titleId),
    ...favorites.map((row) => row.titleId),
    ...dismissed.map((row) => row.recommendation.titleId),
  ]);

  const loved = ratings.filter((row) => Number(row.rating) >= 4);
  const lovedGenreIds = new Set(loved.flatMap((row) => row.title.genres.map((g) => g.genreId)));
  const lovedKeywordIds = new Set(loved.flatMap((row) => row.title.keywords.map((k) => k.keywordId)));
  const lovedDirectors = new Set(
    loved.flatMap((row) =>
      row.title.credits.filter((credit) => credit.job === "Director").map((credit) => credit.personId),
    ),
  );
  const favoriteGenreIds = new Set(favorites.flatMap((row) => row.title.genres.map((g) => g.genreId)));

  const genrePref = new Map<string, number>();
  for (const pref of prefs) {
    genrePref.set(pref.genreId, (genrePref.get(pref.genreId) ?? 0) + pref.score);
  }

  const seedTitle = loved[0]?.title ?? favorites[0]?.title ?? null;

  const candidates = await prisma.title.findMany({
    where: excluded.size ? { id: { notIn: [...excluded] } } : undefined,
    include: {
      genres: true,
      keywords: true,
      credits: { where: { job: "Director" } },
    },
    orderBy: { popularity: "desc" },
    take: 120,
  });

  const scored = candidates
    .map((title) => {
      const candidate: Candidate = {
        id: title.id,
        title: title.title,
        type: title.type,
        popularity: title.popularity,
        voteAverage: title.voteAverage,
        releaseDate: title.releaseDate,
        genreIds: title.genres.map((g) => g.genreId),
        keywordIds: title.keywords.map((k) => k.keywordId),
        directorIds: title.credits.map((c) => c.personId),
      };

      const genreMatch = overlap(candidate.genreIds, lovedGenreIds.size ? lovedGenreIds : favoriteGenreIds);
      const prefMatch =
        candidate.genreIds.reduce((sum, id) => sum + (genrePref.get(id) ?? 0), 0) /
        Math.max(candidate.genreIds.length, 1);
      const keywordMatch = overlap(candidate.keywordIds, lovedKeywordIds);
      const directorMatch = overlap(candidate.directorIds, lovedDirectors);
      const quality = Math.min(candidate.voteAverage / 10, 1);
      const popularity = Math.min(Math.log10(candidate.popularity + 1) / 3, 1);
      const recency = recencyScore(candidate.releaseDate);

      const parts = {
        genre: genreMatch * 0.32,
        pref: Math.min(prefMatch, 1) * 0.22,
        keyword: keywordMatch * 0.1,
        director: directorMatch * 0.08,
        quality: quality * 0.08,
        popularity: popularity * 0.08,
        recency: recency * 0.12,
      };

      const score = Object.values(parts).reduce((a, b) => a + b, 0);
      const hiddenGem = score > 0.35 && candidate.popularity < 40;
      const reason = pickReason({ parts, seedTitle: seedTitle?.title ?? null, hiddenGem, directorMatch });
      return { titleId: title.id, score, reason, hiddenGem, seedTitleId: seedTitle?.id ?? null };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const expiresAt = new Date(Date.now() + RECOMMENDATION_TTL_MS);
  await prisma.recommendation.deleteMany({ where: { userId } });
  if (scored.length > 0) {
    await prisma.recommendation.createMany({
      data: scored.map((row) => ({
        userId,
        titleId: row.titleId,
        score: row.score,
        reason: row.reason,
        algorithmVersion: RECOMMENDATION_VERSION,
        expiresAt,
      })),
    });
  }

  return prisma.recommendation.findMany({
    where: { userId },
    include: { title: { include: { genres: { include: { genre: true } } } } },
    orderBy: { score: "desc" },
  });
}

function pickReason({
  parts,
  seedTitle,
  hiddenGem,
  directorMatch,
}: {
  parts: Record<string, number>;
  seedTitle: string | null;
  hiddenGem: boolean;
  directorMatch: number;
}) {
  if (hiddenGem) return "Hidden gem matching your taste";
  if (directorMatch > 0.4) return "You often enjoy this director";
  if (seedTitle && parts.genre >= parts.pref) return `Because you liked ${seedTitle}`;
  if (parts.pref >= 0.12) return "Matches your favourite genres";
  if (parts.keyword > 0.04) return "Similar to titles you rated highly";
  if (seedTitle) return `Because you liked ${seedTitle}`;
  return "Matches your favourite genres";
}

export async function getActiveRecommendations(userId: string) {
  const existing = await prisma.recommendation.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    include: { title: { include: { genres: { include: { genre: true } } } } },
    orderBy: { score: "desc" },
  });
  if (existing.length > 0) return existing;
  return generateRecommendations(userId);
}

export async function refreshRecommendationsAfterSelection(userId: string) {
  const latest = await prisma.recommendation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!latest) return generateRecommendations(userId);

  const [completed, favourites] = await Promise.all([
    prisma.userTitleStatus.count({ where: { userId, status: WatchStatus.COMPLETED, updatedAt: { gt: latest.createdAt } } }),
    prisma.favorite.count({ where: { userId, createdAt: { gt: latest.createdAt } } }),
  ]);
  if (completed + favourites >= 10) return generateRecommendations(userId);
}

export async function explainTitleMatch(userId: string, titleId: string) {
  const [title, taste, ratings] = await Promise.all([
    prisma.title.findUnique({
      where: { id: titleId },
      include: { genres: { include: { genre: true } }, credits: { include: { person: true } } },
    }),
    prisma.userGenrePreference.findMany({ where: { userId }, include: { genre: true } }),
    prisma.rating.findMany({
      where: { userId, rating: { gte: 4 } },
      include: { title: true },
      take: 8,
    }),
  ]);

  if (!title) return null;
  if (taste.length === 0 && ratings.length === 0) {
    return {
      percent: null as number | null,
      text: "Rate a few titles and we’ll tell you why this fits.",
    };
  }

  const prefByGenre = new Map(taste.map((row) => [row.genre.name.toLowerCase(), row.score]));
  const titleGenres = title.genres.map((item) => item.genre.name);
  const overlapScore =
    titleGenres.reduce((sum, name) => sum + (prefByGenre.get(name.toLowerCase()) ?? 0), 0) /
    Math.max(titleGenres.length, 1);
  const percent = Math.round(Math.min(99, 54 + overlapScore * 40));
  const topLoved = ratings[0]?.title.title;
  const genreList = titleGenres.slice(0, 2).join(" and ");
  const text = topLoved
    ? `You rated ${topLoved} highly and often enjoy ${genreList || "this kind of story"}.`
    : `This sits close to the ${genreList || "genres"} you already lean toward.`;

  return { percent, text };
}

export async function recordRecommendationEvent(
  userId: string,
  recommendationId: string,
  eventType: RecommendationEventType,
) {
  const recommendation = await prisma.recommendation.findFirst({ where: { id: recommendationId, userId } });
  if (!recommendation) throw new Error("Recommendation not found.");
  await prisma.recommendationEvent.create({
    data: { userId, recommendationId, eventType },
  });
  if (eventType === RecommendationEventType.DISMISSED) {
    await prisma.userGenrePreference.createMany({
      data: [],
      skipDuplicates: true,
    });
  }
}

export async function recordRecommendationEventForTitle(
  userId: string,
  titleId: string,
  eventType: RecommendationEventType,
) {
  const recommendation = await prisma.recommendation.findFirst({
    where: { userId, titleId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (recommendation) await recordRecommendationEvent(userId, recommendation.id, eventType);
  return recommendation;
}
