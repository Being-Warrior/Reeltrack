import { CreditType, Prisma, TitleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { STALE_SYNC_MS } from "@/lib/constants";
import { getMovie } from "@/lib/tmdb/movies";
import { getPerson } from "@/lib/tmdb/people";
import { getTv, getTvSeason } from "@/lib/tmdb/tv";
import { syncGenres } from "@/lib/tmdb/genres";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import type { TmdbCastMember, TmdbCrewMember, TmdbTitleListItem } from "@/lib/tmdb/types";

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function titleName(item: TmdbTitleListItem, type: TitleType) {
  if (type === TitleType.MOVIE) return item.title ?? item.original_title ?? "Untitled";
  return item.name ?? item.original_name ?? "Untitled";
}

async function upsertPerson(member: TmdbCastMember | TmdbCrewMember) {
  return prisma.person.upsert({
    where: { tmdbId: member.id },
    update: {
      name: member.name,
      profilePath: member.profile_path,
      knownForDepartment: member.known_for_department,
    },
    create: {
      tmdbId: member.id,
      name: member.name,
      profilePath: member.profile_path,
      knownForDepartment: member.known_for_department,
    },
  });
}

async function attachGenres(titleId: string, genreIds: number[]) {
  if (genreIds.length === 0) return;
  const genres = await prisma.genre.findMany({ where: { tmdbId: { in: genreIds } } });
  if (genres.length === 0) return;
  await prisma.titleGenre.deleteMany({ where: { titleId } });
  await prisma.titleGenre.createMany({
    data: genres.map((genre) => ({ titleId, genreId: genre.id })),
    skipDuplicates: true,
  });
}

async function attachKeywords(titleId: string, keywords: { id: number; name: string }[]) {
  if (keywords.length === 0) return;
  await prisma.$transaction(
    keywords.map((keyword) =>
      prisma.keyword.upsert({
        where: { tmdbId: keyword.id },
        update: { name: keyword.name },
        create: { tmdbId: keyword.id, name: keyword.name },
      }),
    ),
  );
  const stored = await prisma.keyword.findMany({
    where: { tmdbId: { in: keywords.map((keyword) => keyword.id) } },
  });
  await prisma.titleKeyword.deleteMany({ where: { titleId } });
  await prisma.titleKeyword.createMany({
    data: stored.map((keyword) => ({ titleId, keywordId: keyword.id })),
    skipDuplicates: true,
  });
}

async function attachCredits(
  titleId: string,
  cast: TmdbCastMember[] = [],
  crew: TmdbCrewMember[] = [],
) {
  const limitedCast = cast.slice(0, 24);
  const importantJobs = new Set(["Director", "Writer", "Screenplay", "Creator", "Executive Producer", "Producer"]);
  const limitedCrew = crew.filter((member) => member.job && importantJobs.has(member.job)).slice(0, 16);

  const people = await Promise.all([...limitedCast, ...limitedCrew].map(upsertPerson));
  const peopleByTmdb = new Map(people.map((person) => [person.tmdbId, person]));

  await prisma.titleCredit.deleteMany({ where: { titleId } });

  const creditData: Prisma.TitleCreditCreateManyInput[] = [];
  limitedCast.forEach((member) => {
    const person = peopleByTmdb.get(member.id);
    if (!person) return;
    creditData.push({
      titleId,
      personId: person.id,
      creditType: CreditType.CAST,
      character: member.character,
      castOrder: member.order ?? 0,
      department: "Acting",
      job: "Actor",
    });
  });
  limitedCrew.forEach((member) => {
    const person = peopleByTmdb.get(member.id);
    if (!person) return;
    creditData.push({
      titleId,
      personId: person.id,
      creditType: CreditType.CREW,
      job: member.job,
      department: member.department,
    });
  });

  if (creditData.length > 0) {
    await prisma.titleCredit.createMany({ data: creditData });
  }
}

export async function upsertTitleStub(item: TmdbTitleListItem, type: TitleType) {
  const title = titleName(item, type);
  return prisma.title.upsert({
    where: { tmdbId_type: { tmdbId: item.id, type } },
    update: {
      title,
      originalTitle: item.original_title ?? item.original_name,
      overview: item.overview,
      releaseDate: parseDate(item.release_date ?? item.first_air_date),
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      popularity: item.popularity,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      originalLanguage: item.original_language,
    },
    create: {
      tmdbId: item.id,
      type,
      title,
      originalTitle: item.original_title ?? item.original_name,
      overview: item.overview,
      releaseDate: parseDate(item.release_date ?? item.first_air_date),
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      popularity: item.popularity,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      originalLanguage: item.original_language,
    },
  });
}

export async function upsertSearchTitleStub(item: TmdbTitleListItem, type: TitleType) {
  const title = await upsertTitleStub(item, type);
  await attachGenres(title.id, item.genre_ids ?? []);
  return title;
}

export async function syncMovie(tmdbId: number) {
  const movie = await getMovie(tmdbId);
  const record = await prisma.title.upsert({
    where: { tmdbId_type: { tmdbId, type: TitleType.MOVIE } },
    update: {
      title: movie.title ?? "Untitled",
      originalTitle: movie.original_title,
      tagline: movie.tagline,
      overview: movie.overview,
      releaseDate: parseDate(movie.release_date),
      runtime: movie.runtime ?? null,
      originalLanguage: movie.original_language,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      status: movie.status,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      tmdbLastSyncedAt: new Date(),
    },
    create: {
      tmdbId,
      type: TitleType.MOVIE,
      title: movie.title ?? "Untitled",
      originalTitle: movie.original_title,
      tagline: movie.tagline,
      overview: movie.overview,
      releaseDate: parseDate(movie.release_date),
      runtime: movie.runtime ?? null,
      originalLanguage: movie.original_language,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      status: movie.status,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      tmdbLastSyncedAt: new Date(),
    },
  });

  await attachGenres(record.id, (movie.genres ?? []).map((genre) => genre.id));
  await attachKeywords(record.id, movie.keywords?.keywords ?? []);
  await attachCredits(record.id, movie.credits?.cast, movie.credits?.crew);
  return record;
}

export async function syncTv(tmdbId: number, includeEpisodes = false) {
  const show = await getTv(tmdbId);
  const runtime = show.episode_run_time?.[0] ?? null;
  const record = await prisma.title.upsert({
    where: { tmdbId_type: { tmdbId, type: TitleType.TV } },
    update: {
      title: show.name ?? "Untitled",
      originalTitle: show.original_name,
      tagline: show.tagline,
      overview: show.overview,
      releaseDate: parseDate(show.first_air_date),
      runtime,
      originalLanguage: show.original_language,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      status: show.status,
      popularity: show.popularity,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      tmdbLastSyncedAt: new Date(),
    },
    create: {
      tmdbId,
      type: TitleType.TV,
      title: show.name ?? "Untitled",
      originalTitle: show.original_name,
      tagline: show.tagline,
      overview: show.overview,
      releaseDate: parseDate(show.first_air_date),
      runtime,
      originalLanguage: show.original_language,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      status: show.status,
      popularity: show.popularity,
      voteAverage: show.vote_average,
      voteCount: show.vote_count,
      tmdbLastSyncedAt: new Date(),
    },
  });

  await attachGenres(record.id, (show.genres ?? []).map((genre) => genre.id));
  await attachKeywords(record.id, show.keywords?.results ?? []);
  const credits = show.aggregate_credits ?? show.credits;
  await attachCredits(record.id, credits?.cast, credits?.crew);

  const seasonsWithEpisodes = new Set(
    (show.seasons ?? []).filter((season) => season.season_number > 0).slice(-2).map((season) => season.season_number),
  );
  for (const season of show.seasons ?? []) {
    if (season.season_number < 0) continue;
    const storedSeason = await prisma.season.upsert({
      where: { titleId_seasonNumber: { titleId: record.id, seasonNumber: season.season_number } },
      update: {
        tmdbId: season.id,
        name: season.name,
        overview: season.overview,
        airDate: parseDate(season.air_date),
        episodeCount: season.episode_count ?? 0,
        posterPath: season.poster_path,
      },
      create: {
        titleId: record.id,
        tmdbId: season.id,
        seasonNumber: season.season_number,
        name: season.name,
        overview: season.overview,
        airDate: parseDate(season.air_date),
        episodeCount: season.episode_count ?? 0,
        posterPath: season.poster_path,
      },
    });

    if (includeEpisodes && seasonsWithEpisodes.has(season.season_number)) {
      const detail = await getTvSeason(tmdbId, season.season_number);
      for (const episode of detail.episodes ?? []) {
        await prisma.episode.upsert({
          where: {
            seasonId_episodeNumber: {
              seasonId: storedSeason.id,
              episodeNumber: episode.episode_number,
            },
          },
          update: {
            tmdbId: episode.id,
            name: episode.name,
            overview: episode.overview,
            airDate: parseDate(episode.air_date),
            runtime: episode.runtime,
            stillPath: episode.still_path,
          },
          create: {
            seasonId: storedSeason.id,
            tmdbId: episode.id,
            episodeNumber: episode.episode_number,
            name: episode.name,
            overview: episode.overview,
            airDate: parseDate(episode.air_date),
            runtime: episode.runtime,
            stillPath: episode.still_path,
          },
        });
      }
    }
  }

  return record;
}

export async function syncTitleByTmdb(tmdbId: number, type: TitleType) {
  return type === TitleType.MOVIE ? syncMovie(tmdbId) : syncTv(tmdbId);
}

export async function ensureTitleFresh(titleId: string) {
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    include: { credits: { take: 1 }, genres: { take: 1 } },
  });
  if (!title) return null;

  const stale =
    !title.tmdbLastSyncedAt ||
    Date.now() - title.tmdbLastSyncedAt.getTime() > STALE_SYNC_MS ||
    title.credits.length === 0;

  if (!stale) return title;
  try {
    await syncTitleByTmdb(title.tmdbId, title.type);
  } catch {
    return title;
  }
  return prisma.title.findUnique({ where: { id: titleId } });
}

export async function ensureRecentEpisodes(titleId: string) {
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    include: { seasons: { include: { episodes: true }, orderBy: { seasonNumber: "desc" } } },
  });
  if (!title || title.type !== TitleType.TV || !isTmdbConfigured()) return title;
  const latestSeason = title.seasons.find((season) => season.seasonNumber > 0);
  const needsSync =
    !latestSeason ||
    latestSeason.episodes.length === 0 ||
    Date.now() - latestSeason.updatedAt.getTime() > 1000 * 60 * 60 * 24;
  if (!needsSync) return title;
  try {
    await syncTv(title.tmdbId, true);
  } catch {
    return title;
  }
  return prisma.title.findUnique({ where: { id: titleId } });
}

export async function ingestCatalog() {
  await syncGenres();
  const { getPopularMovies, getTrendingMovies, getNowPlayingMovies, getTopRatedMovies, getUpcomingMovies } = await import(
    "@/lib/tmdb/movies"
  );
  const { getPopularTv, getTrendingTv, getTopRatedTv, getOnTheAirTv } = await import("@/lib/tmdb/tv");
  const pages = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

  const lists = await Promise.all([
    ...pages(5).map(getPopularMovies),
    getTrendingMovies(),
    ...pages(3).map(getNowPlayingMovies),
    ...pages(3).map(getUpcomingMovies),
    ...pages(3).map(getTopRatedMovies),
    ...pages(5).map(getPopularTv),
    getTrendingTv(),
    ...pages(3).map(getTopRatedTv),
    ...pages(5).map(getOnTheAirTv),
  ]);

  const movieLists = lists.slice(0, 15);
  const showLists = lists.slice(15);
  const movies = movieLists.flatMap((page) => page.results);
  const shows = showLists.flatMap((page) => page.results);

  const uniqueMovies = [...new Map(movies.map((item) => [item.id, item])).values()];
  const uniqueShows = [...new Map(shows.map((item) => [item.id, item])).values()];

  async function saveCatalog(items: TmdbTitleListItem[], type: TitleType) {
    for (let index = 0; index < items.length; index += 20) {
      await Promise.all(items.slice(index, index + 20).map(async (item) => {
        const stored = await upsertTitleStub(item, type);
        await attachGenres(stored.id, item.genre_ids ?? []);
      }));
    }
  }
  await saveCatalog(uniqueMovies, TitleType.MOVIE);
  await saveCatalog(uniqueShows, TitleType.TV);

  const stubs = await prisma.title.findMany({
    where: { tmdbLastSyncedAt: null },
    take: 24,
    orderBy: { popularity: "desc" },
  });
  for (const stub of stubs) {
    await syncTitleByTmdb(stub.tmdbId, stub.type);
  }

  return { movies: uniqueMovies.length, shows: uniqueShows.length };
}

export async function enrichPerson(personId: string) {
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person || person.biography) return person;
  const detail = await getPerson(person.tmdbId);
  return prisma.person.update({
    where: { id: personId },
    data: {
      biography: detail.biography,
      birthday: parseDate(detail.birthday),
      deathday: parseDate(detail.deathday),
      profilePath: detail.profile_path,
      knownForDepartment: detail.known_for_department,
    },
  });
}
