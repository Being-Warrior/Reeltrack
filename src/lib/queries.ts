import { TitleType, WatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toTitleCard, type TitleCardModel } from "@/lib/titles";
import { getTasteProfile } from "@/lib/taste";
import { explainTitleMatch, getActiveRecommendations } from "@/lib/recommendations";
import { ensureRecentEpisodes, ensureTitleFresh } from "@/lib/tmdb/sync";
import { hydratePersonIfNeeded } from "@/lib/search";
import { getUpcomingMovies } from "@/lib/tmdb/movies";
import { getUpcomingTv } from "@/lib/tmdb/tv";
import { upsertTitleStub } from "@/lib/tmdb/sync";

const titleInclude = {
  genres: { include: { genre: true } },
} as const;

export async function getUserTitleExtras(userId: string | undefined, titleIds: string[]) {
  if (!userId || titleIds.length === 0) {
    return {
      statusById: new Map<string, WatchStatus>(),
      favoriteIds: new Set<string>(),
      ratingById: new Map<string, number>(),
    };
  }

  const [statuses, favorites, ratings] = await Promise.all([
    prisma.userTitleStatus.findMany({ where: { userId, titleId: { in: titleIds } } }),
    prisma.favorite.findMany({ where: { userId, titleId: { in: titleIds } } }),
    prisma.rating.findMany({ where: { userId, titleId: { in: titleIds } } }),
  ]);

  return {
    statusById: new Map(statuses.map((row) => [row.titleId, row.status])),
    favoriteIds: new Set(favorites.map((row) => row.titleId)),
    ratingById: new Map(ratings.map((row) => [row.titleId, Number(row.rating)])),
  };
}

export async function toCards(
  titles: Array<Parameters<typeof toTitleCard>[0] & { id: string }>,
  extras: Awaited<ReturnType<typeof getUserTitleExtras>>,
): Promise<TitleCardModel[]> {
  return titles.map((title) =>
    toTitleCard(title, {
      watchStatus: extras.statusById.get(title.id) ?? null,
      isFavorite: extras.favoriteIds.has(title.id),
      userRating: extras.ratingById.get(title.id) ?? null,
    }),
  );
}

export async function getHomeData(userId: string) {
  const [continueRows, recommendations, recentlyCompleted, newTitles] = await Promise.all([
    prisma.userTitleStatus.findMany({
      where: { userId, status: { in: [WatchStatus.WATCHING, WatchStatus.PAUSED] } },
      include: { title: { include: titleInclude } },
      orderBy: { updatedAt: "desc" },
      take: 18,
    }),
    getActiveRecommendations(userId),
    prisma.rating.findMany({
      where: { userId },
      include: { title: { include: titleInclude } },
      orderBy: { updatedAt: "desc" },
      take: 1,
    }),
    prisma.title.findMany({
      where: { releaseDate: { not: null } },
      include: titleInclude,
      orderBy: { releaseDate: "desc" },
      take: 18,
    }),
  ]);

  const allTitles = [
    ...continueRows.map((row) => row.title),
    ...recommendations.map((row) => row.title),
    ...newTitles,
    ...recentlyCompleted.map((row) => row.title),
  ];
  const extras = await getUserTitleExtras(userId, allTitles.map((title) => title.id));
  const availableRecommendations = recommendations.filter(
    (row) => !extras.statusById.has(row.titleId) && !extras.favoriteIds.has(row.titleId),
  );
  const usedRecommendationIds = new Set<string>();
  const takeUnique = <T extends { titleId: string }>(rows: T[], limit = 18) =>
    rows.filter((row) => {
      if (usedRecommendationIds.has(row.titleId)) return false;
      usedRecommendationIds.add(row.titleId);
      return true;
    }).slice(0, limit);
  const becauseYouLiked = takeUnique(availableRecommendations.filter((row) => row.reason.startsWith("Because you liked")));
  const hiddenGems = takeUnique(availableRecommendations.filter((row) => row.reason.toLowerCase().includes("hidden gem")));
  const forYou = takeUnique(availableRecommendations);
  const recTitles = forYou.map((row) => row.title);
  const availableNewTitles = newTitles.filter(
    (title) => !extras.statusById.has(title.id) && !extras.favoriteIds.has(title.id),
  );

  return {
    continueWatching: await toCards(
      continueRows.map((row) => row.title),
      extras,
    ),
    becauseYouLiked: await toCards(
      becauseYouLiked.slice(0, 18).map((row) => row.title),
      extras,
    ),
    becauseReasons: Object.fromEntries(becauseYouLiked.map((row) => [row.titleId, row.reason])),
    hiddenGems: await toCards(hiddenGems.map((row) => row.title), extras),
    recommended: await toCards(recTitles, extras),
    recReasons: Object.fromEntries(forYou.map((row) => [row.titleId, row.reason])),
    newThisWeek: await toCards(availableNewTitles, extras),
    lastLoved: recentlyCompleted[0]?.title.title ?? null,
  };
}

export async function getDiscoverData(userId: string, genre?: string, type?: TitleType) {
  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  const where = {
    ...(type ? { type } : {}),
    ...(genre ? { genres: { some: { genre: { name: genre } } } } : {}),
  };

  const [trending, topRated, hidden, newReleases, recommendations] = await Promise.all([
    prisma.title.findMany({ where, include: titleInclude, orderBy: { popularity: "desc" }, take: 24 }),
    prisma.title.findMany({ where, include: titleInclude, orderBy: { voteAverage: "desc" }, take: 18 }),
    prisma.title.findMany({
      where: { ...where, popularity: { lt: 40 }, voteAverage: { gte: 7 } },
      include: titleInclude,
      orderBy: { voteAverage: "desc" },
      take: 18,
    }),
    prisma.title.findMany({ where: { ...where, releaseDate: { not: null } }, include: titleInclude, orderBy: { releaseDate: "desc" }, take: 18 }),
    getActiveRecommendations(userId),
  ]);

  const extras = await getUserTitleExtras(userId, [
    ...trending,
    ...topRated,
    ...hidden,
    ...newReleases,
    ...recommendations.map((row) => row.title),
  ].map((title) => title.id));
  const filteredRecommendations = recommendations.filter(
    (row) =>
      (!type || row.title.type === type) &&
      (!genre || row.title.genres.some((item) => item.genre.name === genre)),
  );

  return {
    genres,
    trending: await toCards(trending, extras),
    topRated: await toCards(topRated, extras),
    hiddenGems: await toCards(hidden, extras),
    forYou: await toCards(
      filteredRecommendations.slice(0, 18).map((row) => row.title),
      extras,
    ),
    becauseYouLiked: await toCards(
      filteredRecommendations.filter((row) => row.reason.startsWith("Because you liked")).slice(0, 18).map((row) => row.title),
      extras,
    ),
    newReleases: await toCards(newReleases, extras),
    recReasons: Object.fromEntries(filteredRecommendations.map((row) => [row.titleId, row.reason])),
  };
}

export async function getLibrary(userId: string, status: WatchStatus) {
  const rows = await prisma.userTitleStatus.findMany({
    where: { userId, status },
    include: { title: { include: titleInclude } },
    orderBy: { updatedAt: "desc" },
  });
  const extras = await getUserTitleExtras(
    userId,
    rows.map((row) => row.titleId),
  );
  return toCards(
    rows.map((row) => row.title),
    extras,
  );
}

export async function getComingSoon(userId: string) {
  const now = new Date();
  const end = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const from = now.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  try {
    const pages = await Promise.all([
      getUpcomingMovies(1), getUpcomingMovies(2), getUpcomingMovies(3),
      getUpcomingTv(from, to, 1), getUpcomingTv(from, to, 2), getUpcomingTv(from, to, 3),
    ]);
    const movieItems = [...new Map(
      pages.slice(0, 3).flatMap((page) => page.results).map((title) => [title.id, title]),
    ).values()];
    const seriesItems = [...new Map(
      pages.slice(3).flatMap((page) => page.results).map((title) => [title.id, title]),
    ).values()];
    await Promise.all([
      ...movieItems.map((title) => upsertTitleStub(title, TitleType.MOVIE)),
      ...seriesItems.map((title) => upsertTitleStub(title, TitleType.TV)),
    ]);
  } catch {
    // The existing local catalog remains available if TMDB is temporarily unreachable.
  }
  const [titles, favorites, watched, preferences] = await Promise.all([
    prisma.title.findMany({
      where: { releaseDate: { gte: now, lte: end } },
      include: titleInclude,
      take: 120,
    }),
    prisma.favorite.findMany({ where: { userId }, include: { title: { include: { genres: true } } } }),
    prisma.userTitleStatus.findMany({
      where: { userId, status: WatchStatus.COMPLETED },
      include: { title: { include: { genres: true } } },
    }),
    prisma.userGenrePreference.findMany({ where: { userId } }),
  ]);
  const interestGenres = new Set([
    ...favorites.flatMap((row) => row.title.genres.map((genre) => genre.genreId)),
    ...watched.flatMap((row) => row.title.genres.map((genre) => genre.genreId)),
  ]);
  const preferenceScore = new Map<string, number>();
  for (const preference of preferences) {
    preferenceScore.set(preference.genreId, (preferenceScore.get(preference.genreId) ?? 0) + preference.score);
  }
  const rankedTitles = titles
    .map((title) => {
      const genreIds = title.genres.map((genre) => genre.genreId);
      const matchCount = genreIds.filter((id) => interestGenres.has(id)).length;
      const preferenceMatch = genreIds.reduce((total, id) => total + (preferenceScore.get(id) ?? 0), 0);
      const daysUntilRelease = title.releaseDate ? Math.max(0, (title.releaseDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 90;
      return { title, score: matchCount * 3 + preferenceMatch * 2 + Math.min(title.voteAverage / 10, 1) + (90 - daysUntilRelease) / 900 };
    })
    .sort((a, b) => b.score - a.score || (a.title.releaseDate?.getTime() ?? 0) - (b.title.releaseDate?.getTime() ?? 0))
    .slice(0, 36)
    .map((entry) => entry.title);
  const extras = await getUserTitleExtras(userId, rankedTitles.map((title) => title.id));
  return toCards(rankedTitles, extras);
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function getUpcomingReleases(userId: string) {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return prisma.upcomingRelease.findMany({
    where: { userId, releaseDate: { gte: now, lte: nextWeek } },
    include: { relatedTitle: { include: titleInclude } },
    orderBy: { releaseDate: "asc" },
  });
}

export async function getWatchedLibrary(userId: string) {
  const [completed, ratings, favorites] = await Promise.all([
    getLibrary(userId, WatchStatus.COMPLETED),
    prisma.rating.findMany({
      where: { userId },
      include: { title: { include: titleInclude } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: { title: { include: titleInclude } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const extras = await getUserTitleExtras(userId, [
    ...ratings.map((row) => row.titleId),
    ...favorites.map((row) => row.titleId),
  ]);
  return {
    completed,
    rated: await toCards(
      ratings.map((row) => row.title),
      extras,
    ),
    favorites: await toCards(
      favorites.map((row) => row.title),
      extras,
    ),
  };
}

export async function getTitlePage(userId: string | undefined, titleId: string) {
  await ensureTitleFresh(titleId);
  await ensureRecentEpisodes(titleId);
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    include: {
      genres: { include: { genre: true } },
      keywords: { include: { keyword: true } },
      credits: { include: { person: true }, orderBy: { castOrder: "asc" } },
      seasons: { include: { episodes: { orderBy: { episodeNumber: "asc" } } }, orderBy: { seasonNumber: "asc" } },
    },
  });
  if (!title) return null;

  const [extras, watchedEpisodeIds] = await Promise.all([
    getUserTitleExtras(userId, [title.id]),
    userId ? prisma.episodeProgress.findMany({ where: { userId, episode: { season: { titleId } } }, select: { episodeId: true } }) : Promise.resolve([]),
  ]);
  const match = userId ? await explainTitleMatch(userId, title.id) : null;
  const collections = userId
    ? await prisma.collection.findMany({
        where: { userId },
        include: { items: { where: { titleId } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];
  const recommendation = userId
    ? await prisma.recommendation.findFirst({
        where: { userId, titleId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      })
    : null;

  const similar = await prisma.title.findMany({
    where: {
      id: { not: title.id },
      genres: { some: { genreId: { in: title.genres.map((item) => item.genreId) } } },
    },
    include: titleInclude,
    orderBy: { popularity: "desc" },
    take: 12,
  });
  const similarExtras = await getUserTitleExtras(
    userId,
    similar.map((item) => item.id),
  );

  return {
    title,
    card: toTitleCard(title, {
      watchStatus: extras.statusById.get(title.id) ?? null,
      isFavorite: extras.favoriteIds.has(title.id),
      userRating: extras.ratingById.get(title.id) ?? null,
    }),
    match,
    collections,
    recommendation,
    similar: await toCards(similar, similarExtras),
    watchedEpisodeIds: watchedEpisodeIds.map((row) => row.episodeId),
  };
}

export async function getPersonPage(personId: string, userId?: string) {
  await hydratePersonIfNeeded(personId);
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      credits: {
        include: { title: { include: titleInclude } },
        orderBy: { title: { popularity: "desc" } },
      },
    },
  });
  if (!person) return null;
  const uniqueTitles = [...new Map(person.credits.map((credit) => [credit.titleId, credit.title])).values()];
  const extras = await getUserTitleExtras(
    userId,
    uniqueTitles.map((title) => title.id),
  );
  return {
    person,
    titles: await toCards(uniqueTitles, extras),
  };
}

export async function getOnboardingCatalog() {
  const [genres, titles] = await Promise.all([
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
    prisma.title.findMany({
      include: titleInclude,
      orderBy: { popularity: "desc" },
      take: 36,
    }),
  ]);
  return { genres, titles: titles.map((title) => toTitleCard(title)) };
}

export async function getCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    include: { items: { include: { title: true }, orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCollectionPage(userId: string | undefined, id: string) {
  const collection = await prisma.collection.findFirst({
    where: {
      id,
      OR: userId ? [{ userId }, { isPrivate: false }] : [{ isPrivate: false }],
    },
    include: {
      user: { select: { name: true, username: true } },
      items: { include: { title: { include: titleInclude } }, orderBy: { position: "asc" } },
    },
  });
  if (!collection) return null;
  const extras = await getUserTitleExtras(
    userId,
    collection.items.map((item) => item.titleId),
  );
  return {
    collection,
    titles: await toCards(
      collection.items.map((item) => item.title),
      extras,
    ),
  };
}

export async function getAnalytics(userId: string) {
  const [statuses, ratings, taste] = await Promise.all([
    prisma.userTitleStatus.findMany({
      where: { userId },
      include: { title: { include: { genres: { include: { genre: true } } } } },
    }),
    prisma.rating.findMany({ where: { userId } }),
    getTasteProfile(userId),
  ]);

  const completed = statuses.filter((row) => row.status === WatchStatus.COMPLETED);
  const minutes = completed.reduce((sum, row) => sum + (row.title.runtime ?? 0), 0);
  const movies = completed.filter((row) => row.title.type === TitleType.MOVIE).length;
  const shows = completed.filter((row) => row.title.type === TitleType.TV).length;
  const avgRating =
    ratings.length === 0 ? 0 : ratings.reduce((sum, row) => sum + Number(row.rating), 0) / ratings.length;

  const byYear = new Map<number, number>();
  const byMonth = new Map<string, number>();
  for (const row of completed) {
    const year = (row.completedAt ?? row.updatedAt).getFullYear();
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
    const date = row.completedAt ?? row.updatedAt;
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
  }

  const genreCounts = new Map<string, number>();
  for (const row of completed) {
    for (const item of row.title.genres) {
      genreCounts.set(item.genre.name, (genreCounts.get(item.genre.name) ?? 0) + 1);
    }
  }

  const ratingDistribution = new Map<number, number>();
  for (const row of ratings) {
    const value = Number(row.rating);
    ratingDistribution.set(value, (ratingDistribution.get(value) ?? 0) + 1);
  }

  return {
    hours: Math.round(minutes / 60),
    movies,
    shows,
    avgRating,
    completed: completed.length,
    watchlist: statuses.filter((row) => row.status === WatchStatus.WATCHLIST).length,
    taste,
    years: [...byYear.entries()].sort((a, b) => a[0] - b[0]),
    months: [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12),
    genres: [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    ratingDistribution: [...ratingDistribution.entries()].sort((a, b) => a[0] - b[0]),
  };
}

export async function getProfileData(userId: string) {
  const [user, favorites, recent, analytics] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { preferences: true } }),
    prisma.favorite.findMany({
      where: { userId },
      include: { title: { include: titleInclude } },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
    prisma.userTitleStatus.findMany({
      where: { userId, status: WatchStatus.COMPLETED },
      include: { title: { include: titleInclude } },
      take: 12,
      orderBy: { completedAt: "desc" },
    }),
    getAnalytics(userId),
  ]);
  const extras = await getUserTitleExtras(userId, [
    ...favorites.map((row) => row.titleId),
    ...recent.map((row) => row.titleId),
  ]);
  return {
    user,
    favorites: await toCards(
      favorites.map((row) => row.title),
      extras,
    ),
    recent: await toCards(
      recent.map((row) => row.title),
      extras,
    ),
    analytics,
  };
}
