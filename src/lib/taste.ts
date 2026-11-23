import { PreferenceSource, WatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const SOURCE_WEIGHT: Record<PreferenceSource, number> = {
  ONBOARDING: 0.28,
  RATING: 0.32,
  FAVORITE: 0.22,
  WATCH_HISTORY: 0.12,
  BEHAVIOR: 0.06,
};

export async function setGenrePreferences(
  userId: string,
  genreIds: string[],
  source: PreferenceSource,
  score = 1,
) {
  await prisma.$transaction(
    genreIds.map((genreId) =>
      prisma.userGenrePreference.upsert({
        where: { userId_genreId_source: { userId, genreId, source } },
        update: { score },
        create: { userId, genreId, score, source },
      }),
    ),
  );
}

export async function boostTitleGenres(
  userId: string,
  titleId: string,
  source: PreferenceSource,
  amount: number,
) {
  const genres = await prisma.titleGenre.findMany({ where: { titleId } });
  for (const item of genres) {
    const existing = await prisma.userGenrePreference.findUnique({
      where: { userId_genreId_source: { userId, genreId: item.genreId, source } },
    });
    const next = Math.max(0, Math.min(1, (existing?.score ?? 0) + amount));
    await prisma.userGenrePreference.upsert({
      where: { userId_genreId_source: { userId, genreId: item.genreId, source } },
      update: { score: next },
      create: { userId, genreId: item.genreId, score: next, source },
    });
  }
}

export async function getTasteProfile(userId: string) {
  const rows = await prisma.userGenrePreference.findMany({
    where: { userId },
    include: { genre: true },
  });

  const combined = new Map<string, { name: string; score: number }>();
  for (const row of rows) {
    const current = combined.get(row.genreId) ?? { name: row.genre.name, score: 0 };
    current.score += row.score * SOURCE_WEIGHT[row.source];
    combined.set(row.genreId, current);
  }

  const ranked = [...combined.values()].sort((a, b) => b.score - a.score);
  const max = ranked[0]?.score || 1;
  return ranked.map((item) => ({
    name: item.name,
    score: item.score,
    percent: Math.round((item.score / max) * 100),
  }));
}

export async function refreshSignalsForStatus(userId: string, titleId: string, status: WatchStatus) {
  if (status === WatchStatus.COMPLETED) {
    await boostTitleGenres(userId, titleId, PreferenceSource.WATCH_HISTORY, 0.18);
  }
  if (status === WatchStatus.DROPPED) {
    await boostTitleGenres(userId, titleId, PreferenceSource.BEHAVIOR, -0.12);
  }
}
