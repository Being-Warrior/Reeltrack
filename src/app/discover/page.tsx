import Link from "next/link";
import { TitleType } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { TitleRow } from "@/components/title-card";
import { getDiscoverData } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; type?: string }>;
}) {
  const user = await requireUser();
  const { genre, type } = await searchParams;
  const titleType = type === "MOVIE" || type === "TV" ? (type as TitleType) : undefined;
  const data = await getDiscoverData(user.id, genre, titleType);

  return (
    <AppShell>
      <div className="space-y-10">
        <header>
          <h1 className="font-serif text-5xl">Discover</h1>
          <p className="mt-2 text-muted">Browse the catalog we store locally, filtered to your mood.</p>
          <div className="mt-5 max-w-xl"><SearchBox /></div>
        </header>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/discover"
            className={cn("rounded-full border px-3 py-1 text-xs", !genre && !type ? "border-gold text-gold" : "border-line text-muted")}
          >
            All
          </Link>
          <Link
            href="/discover?type=MOVIE"
            className={cn("rounded-full border px-3 py-1 text-xs", type === "MOVIE" ? "border-gold text-gold" : "border-line text-muted")}
          >
            Movies
          </Link>
          <Link
            href="/discover?type=TV"
            className={cn("rounded-full border px-3 py-1 text-xs", type === "TV" ? "border-gold text-gold" : "border-line text-muted")}
          >
            Series
          </Link>
          {data.genres.map((item) => (
            <Link
              key={item.id}
              href={`/discover?genre=${encodeURIComponent(item.name)}${type ? `&type=${type}` : ""}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                genre === item.name ? "border-gold text-gold" : "border-line text-muted",
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <TitleRow heading="For you" titles={data.forYou} reasons={data.recReasons} />
        <TitleRow heading="Because you liked" titles={data.becauseYouLiked} reasons={data.recReasons} empty="Rate a few favourites and this row will become more specific." />
        <TitleRow heading="Trending in catalog" titles={data.trending} />
        <TitleRow heading="New releases" titles={data.newReleases} />
        <TitleRow heading="Highest rated" titles={data.topRated} />
        <TitleRow heading="Hidden gems" titles={data.hiddenGems} />
      </div>
    </AppShell>
  );
}
