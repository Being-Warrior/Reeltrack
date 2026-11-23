import Link from "next/link";
import { TitleType } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { SearchFilters } from "@/components/search-filters";
import { TitleCard } from "@/components/title-card";
import { searchAction } from "@/actions/user";
import { getUserTitleExtras, toCards } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { profileUrl } from "@/lib/tmdb/images";
import { SEARCH_MIN_CHARS } from "@/lib/constants";
import { prisma } from "@/lib/db";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; genre?: string; year?: string; minRating?: string; language?: string; minRuntime?: string }>;
}) {
  const user = await requireUser();
  const { q = "", type, genre, year, minRating, language, minRuntime } = await searchParams;
  const query = q.trim();
  const parsedYear = Number(year);
  const parsedRating = Number(minRating);
  const parsedRuntime = Number(minRuntime);
  const filters = {
    type: type === "MOVIE" || type === "TV" ? (type as TitleType) : undefined,
    genre: genre || undefined,
    year: Number.isInteger(parsedYear) && parsedYear >= 1888 && parsedYear <= 2100 ? parsedYear : undefined,
    minRating: parsedRating >= 0 && parsedRating <= 10 ? parsedRating : undefined,
    language: language?.trim().toLowerCase() || undefined,
    minRuntime: Number.isInteger(parsedRuntime) && parsedRuntime > 0 ? parsedRuntime : undefined,
  };
  const [results, genres] = await Promise.all([
    query.length >= SEARCH_MIN_CHARS ? searchAction(query, filters) : Promise.resolve({ titles: [], people: [] }),
    prisma.genre.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  const extras = await getUserTitleExtras(
    user.id,
    results.titles.map((title) => title.id),
  );
  const cards = await toCards(results.titles, extras);

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="font-serif text-5xl">Search</h1>
        <SearchBox live />
        {query.length >= SEARCH_MIN_CHARS ? <SearchFilters query={query} genres={genres.map((item) => item.name)} values={{ type, genre, year, minRating, language, minRuntime }} /> : null}
        {query.length > 0 && query.length < SEARCH_MIN_CHARS ? (
          <p className="text-sm text-muted">Type at least two characters.</p>
        ) : null}
        {query.length >= SEARCH_MIN_CHARS && cards.length === 0 && results.people.length === 0 ? (
          <p className="text-muted">Nothing in the catalog matched “{query}”.</p>
        ) : null}
        {cards.length > 0 ? (
          <section>
            <h2 className="font-serif text-2xl">Titles</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              {cards.map((title) => (
                <TitleCard key={title.id} title={title} />
              ))}
            </div>
          </section>
        ) : null}
        {results.people.length > 0 ? (
          <section>
            <h2 className="font-serif text-2xl">People</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {results.people.map((person) => (
                <Link
                  key={person.id}
                  href={`/person/${person.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-raised">
                    {profileUrl(person.profilePath) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileUrl(person.profilePath) ?? ""} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{person.name}</p>
                    <p className="text-xs text-muted">{person.knownForDepartment ?? "Credit"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
