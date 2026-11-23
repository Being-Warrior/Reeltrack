import { TitleType, UpcomingReleaseKind, WatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { syncReleaseNotifications } from "@/lib/notifications";
import { getMovie, getMovieCollection } from "@/lib/tmdb/movies";
import { getTv } from "@/lib/tmdb/tv";
import { upsertTitleStub } from "@/lib/tmdb/sync";

const day = 24 * 60 * 60 * 1000;

function inTheNextWeek(date: string | null | undefined, now: Date) {
  if (!date) return false;
  const value = new Date(`${date}T00:00:00Z`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today.getTime() + 7 * day);
  return !Number.isNaN(value.getTime()) && value >= today && value <= weekFromNow;
}

async function saveAlert(input: {
  userId: string;
  sourceTitleId: string;
  relatedTitleId?: string;
  kind: UpcomingReleaseKind;
  externalKey: string;
  title: string;
  subtitle?: string;
  releaseDate: string;
}) {
  await prisma.upcomingRelease.upsert({
    where: { userId_externalKey: { userId: input.userId, externalKey: input.externalKey } },
    update: { title: input.title, subtitle: input.subtitle, releaseDate: new Date(`${input.releaseDate}T00:00:00Z`) },
    create: { ...input, releaseDate: new Date(`${input.releaseDate}T00:00:00Z`) },
  });
}

async function syncMovie(userId: string, source: { id: string; tmdbId: number }, now: Date) {
  const movie = await getMovie(source.tmdbId);
  if (!movie.belongs_to_collection) return 0;
  const collection = await getMovieCollection(movie.belongs_to_collection.id);
  let additions = 0;
  for (const item of collection.parts.filter((part) => part.id !== source.tmdbId && inTheNextWeek(part.release_date, now))) {
    const related = await upsertTitleStub(item, TitleType.MOVIE);
    await prisma.userTitleStatus.createMany({
      data: [{ userId, titleId: related.id, status: WatchStatus.WATCHLIST }],
      skipDuplicates: true,
    });
    await saveAlert({
      userId,
      sourceTitleId: source.id,
      relatedTitleId: related.id,
      kind: UpcomingReleaseKind.MOVIE,
      externalKey: `movie:${item.id}`,
      title: item.title ?? item.original_title ?? "Untitled",
      subtitle: "Related to a title you watched or favourited",
      releaseDate: item.release_date!,
    });
    additions += 1;
  }
  return additions;
}

async function syncSeries(userId: string, source: { id: string; tmdbId: number; title: string }, now: Date) {
  const series = await getTv(source.tmdbId);
  let additions = 0;
  for (const season of series.seasons?.filter((item) => item.season_number > 0 && inTheNextWeek(item.air_date, now)) ?? []) {
    await saveAlert({
      userId,
      sourceTitleId: source.id,
      kind: UpcomingReleaseKind.SEASON,
      externalKey: `season:${source.tmdbId}:${season.id}`,
      title: source.title,
      subtitle: `${season.name} premieres`,
      releaseDate: season.air_date!,
    });
    additions += 1;
  }
  const episode = series.next_episode_to_air;
  if (episode && inTheNextWeek(episode.air_date, now)) {
    await saveAlert({
      userId,
      sourceTitleId: source.id,
      kind: UpcomingReleaseKind.EPISODE,
      externalKey: `episode:${source.tmdbId}:${episode.id}`,
      title: source.title,
      subtitle: `S${episode.season_number ?? "?"} E${episode.episode_number}: ${episode.name ?? "New episode"}`,
      releaseDate: episode.air_date!,
    });
    additions += 1;
  }
  return additions;
}

export async function runUpcomingSync() {
  const [completed, favourites] = await Promise.all([
    prisma.userTitleStatus.findMany({ where: { status: WatchStatus.COMPLETED }, include: { title: true } }),
    prisma.favorite.findMany({ include: { title: true } }),
  ]);
  const tracked = new Map<string, { userId: string; id: string; tmdbId: number; type: TitleType; title: string }>();
  for (const row of [...completed, ...favourites]) {
    tracked.set(`${row.userId}:${row.titleId}`, {
      userId: row.userId,
      id: row.titleId,
      tmdbId: row.title.tmdbId,
      type: row.title.type,
      title: row.title.title,
    });
  }

  const now = new Date();
  let additions = 0;
  for (const source of tracked.values()) {
    additions += source.type === TitleType.MOVIE
      ? await syncMovie(source.userId, source, now)
      : await syncSeries(source.userId, source, now);
  }
  const reminders = await syncReleaseNotifications();
  return { additions, reminders };
}
