import { prisma } from "@/lib/db";
import { getMovieGenres } from "@/lib/tmdb/movies";
import { getTvGenres } from "@/lib/tmdb/tv";

export async function syncGenres() {
  const [movie, tv] = await Promise.all([getMovieGenres(), getTvGenres()]);
  const unique = new Map<number, string>();
  [...movie.genres, ...tv.genres].forEach((genre) => unique.set(genre.id, genre.name));

  const genres = [...unique.entries()];
  await prisma.$transaction(
    genres.map(([tmdbId, name]) =>
      prisma.genre.upsert({
        where: { tmdbId },
        update: { name },
        create: { tmdbId, name },
      }),
    ),
  );

  return prisma.genre.findMany({ orderBy: { name: "asc" } });
}
