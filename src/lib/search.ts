import { Prisma, TitleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isTmdbConfigured } from "@/lib/tmdb/client";
import { searchMovies } from "@/lib/tmdb/movies";
import { searchPeople } from "@/lib/tmdb/people";
import { searchTv } from "@/lib/tmdb/tv";
import { upsertSearchTitleStub, syncTitleByTmdb } from "@/lib/tmdb/sync";
import { getPerson } from "@/lib/tmdb/people";

export type CatalogFilters = {
  type?: TitleType;
  genre?: string;
  year?: number;
  minRating?: number;
  language?: string;
  minRuntime?: number;
};

export async function searchLocalTitles(query: string, take = 20, filters: CatalogFilters = {}) {
  const where: Prisma.TitleWhereInput = {
    OR: [
      { title: { contains: query, mode: "insensitive" } },
      { originalTitle: { contains: query, mode: "insensitive" } },
    ],
  };
  if (filters.type) where.type = filters.type;
  if (filters.genre) where.genres = { some: { genre: { name: filters.genre } } };
  if (filters.year) {
    where.releaseDate = { gte: new Date(`${filters.year}-01-01`), lt: new Date(`${filters.year + 1}-01-01`) };
  }
  if (filters.minRating) where.voteAverage = { gte: filters.minRating };
  if (filters.language) where.originalLanguage = filters.language;
  if (filters.minRuntime) where.runtime = { gte: filters.minRuntime };

  return prisma.title.findMany({
    where,
    include: { genres: { include: { genre: true } } },
    orderBy: [{ popularity: "desc" }],
    take,
  });
}

export async function searchLocalPeople(query: string, take = 12) {
  return prisma.person.findMany({
    where: { name: { contains: query, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take,
  });
}

export async function searchCatalog(query: string, filters: CatalogFilters = {}) {
  const [titles, people] = await Promise.all([searchLocalTitles(query, 20, filters), searchLocalPeople(query)]);

  if (!isTmdbConfigured()) {
    return { titles, people, remote: false };
  }

  try {
    const [movieResult, tvResult, peopleResult] = await Promise.allSettled([
      searchMovies(query),
      searchTv(query),
      searchPeople(query),
    ]);
    const movieResults = movieResult.status === "fulfilled" ? movieResult.value.results : [];
    const tvResults = tvResult.status === "fulfilled" ? tvResult.value.results : [];
    const peopleResults = peopleResult.status === "fulfilled" ? peopleResult.value.results : [];
    if (movieResults.length === 0 && tvResults.length === 0 && peopleResults.length === 0) {
      return { titles, people, remote: false };
    }

    await Promise.all([
      ...movieResults.slice(0, 12).map((item) => upsertSearchTitleStub(item, TitleType.MOVIE)),
      ...tvResults.slice(0, 12).map((item) => upsertSearchTitleStub(item, TitleType.TV)),
      ...peopleResults.slice(0, 8).map((person) => prisma.person.upsert({
        where: { tmdbId: person.id },
        update: { name: person.name, profilePath: person.profile_path },
        create: {
          tmdbId: person.id,
          name: person.name,
          profilePath: person.profile_path,
          knownForDepartment: person.known_for_department,
        },
      })),
    ]);

    const refreshed = await Promise.all([searchLocalTitles(query, 20, filters), searchLocalPeople(query)]);
    return { titles: refreshed[0], people: refreshed[1], remote: true };
  } catch {
    return { titles, people, remote: false };
  }
}

export async function hydrateTitleIfNeeded(titleId: string) {
  const title = await prisma.title.findUnique({
    where: { id: titleId },
    include: { credits: { take: 1 } },
  });
  if (!title) return null;
  if (title.credits.length > 0 && title.tmdbLastSyncedAt) return title;
  if (!isTmdbConfigured()) return title;
  await syncTitleByTmdb(title.tmdbId, title.type);
  return prisma.title.findUnique({ where: { id: titleId } });
}

export async function hydratePersonIfNeeded(personId: string) {
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person || person.biography || !isTmdbConfigured()) return person;
  const detail = await getPerson(person.tmdbId);
  return prisma.person.update({
    where: { id: personId },
    data: {
      biography: detail.biography,
      profilePath: detail.profile_path,
      knownForDepartment: detail.known_for_department,
    },
  });
}
