import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreditType } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { AddToCollection } from "@/components/add-to-collection";
import { TitleRow } from "@/components/title-card";
import { WatchActions } from "@/components/watch-actions";
import { EpisodeToggle } from "@/components/episode-toggle";
import { TitleExtras } from "@/components/title-extras";
import { TITLE_TYPE_LABEL } from "@/lib/labels";
import { getTitlePage } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { backdropUrl, profileUrl, stillUrl } from "@/lib/tmdb/images";
import { formatRuntime, yearFromDate } from "@/lib/utils";
import { getStreamingProviders, getTrailer } from "@/lib/tmdb/extras";
import { TMDB_PAGE_AUXILIARY_TIMEOUT_MS } from "@/lib/constants";

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const data = await getTitlePage(user?.id, id);
  if (!data) notFound();

  const { title, card, match, similar, collections, recommendation } = data;
  const backdrop = backdropUrl(title.backdropPath);
  const cast = title.credits.filter((credit) => credit.creditType === CreditType.CAST).slice(0, 12);
  const crew = title.credits.filter((credit) => credit.creditType === CreditType.CREW).slice(0, 8);
  const [providers, trailer] = await Promise.all([
    getStreamingProviders(title.type, title.tmdbId, user?.preferences?.country ?? "US", TMDB_PAGE_AUXILIARY_TIMEOUT_MS).catch(() => null),
    getTrailer(title.type, title.tmdbId, TMDB_PAGE_AUXILIARY_TIMEOUT_MS).catch(() => null),
  ]);

  const content = (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": title.type === "MOVIE" ? "Movie" : "TVSeries",
            name: title.title,
            description: title.overview,
            image: title.posterPath ? `https://image.tmdb.org/t/p/w780${title.posterPath}` : undefined,
            dateCreated: title.releaseDate?.toISOString().slice(0, 10),
            aggregateRating: title.voteCount > 0 ? { "@type": "AggregateRating", ratingValue: title.voteAverage, ratingCount: title.voteCount } : undefined,
          }),
        }}
      />
      <article className="min-w-0">
        <div className="relative -mx-4 mb-8 overflow-hidden rounded-none sm:mx-0 sm:rounded-3xl">
          {backdrop ? (
            <Image src={backdrop} alt="" width={1280} height={720} className="h-[360px] w-full object-cover sm:h-[420px]" />
          ) : (
            <div className="h-[280px] bg-raised" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">
              {TITLE_TYPE_LABEL[title.type]} {yearFromDate(title.releaseDate) ? `· ${yearFromDate(title.releaseDate)}` : ""}
            </p>
            <h1 className="mt-2 max-w-3xl font-serif text-4xl sm:text-6xl">{title.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {title.genres.map((item) => item.genre.name).join(" · ")}
              {formatRuntime(title.runtime) ? ` · ${formatRuntime(title.runtime)}` : ""}
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="min-w-0 space-y-6">
            {title.tagline ? <p className="font-serif text-2xl text-gold/90">{title.tagline}</p> : null}
            <p className="max-w-3xl text-lg leading-relaxed text-muted">{title.overview ?? "No overview stored yet."}</p>
            {user ? <WatchActions titleId={title.id} status={card.watchStatus} favorite={card.isFavorite} rating={card.userRating} recommendationId={recommendation?.id} /> : <Link href="/login" className="inline-flex rounded-full bg-gold px-4 py-2 text-sm text-bg">Sign in to track this</Link>}
            <TitleExtras titleId={title.id} trailerKey={trailer?.key} providers={providers} />
            {user ? <AddToCollection
              titleId={title.id}
              collections={collections.map((collection) => ({
                id: collection.id,
                name: collection.name,
                already: collection.items.length > 0,
              }))}
            /> : null}
            {cast.length > 0 ? (
              <section>
                <h2 className="font-serif text-2xl">Cast</h2>
                <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                  {cast.map((credit) => (
                    <Link key={credit.id} href={`/person/${credit.personId}`} className="min-w-0">
                      <div className="aspect-[2/3] overflow-hidden rounded-xl bg-raised">
                        {profileUrl(credit.person.profilePath) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profileUrl(credit.person.profilePath) ?? ""}
                            alt={credit.person.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm">{credit.person.name}</p>
                      <p className="line-clamp-1 text-xs text-muted">{credit.character}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
            {title.seasons.length > 0 ? (
              <section className="space-y-4">
                <h2 className="font-serif text-2xl">Seasons</h2>
                {title.seasons
                  .filter((season) => season.seasonNumber > 0)
                  .map((season) => (
                    <div key={season.id} className="rounded-2xl border border-line bg-paper p-4">
                      <h3 className="font-medium">
                        {season.name} · {season.episodeCount} episodes
                      </h3>
                      <p className="mt-1 text-sm text-muted">{season.overview}</p>
                      {season.episodes.length > 0 ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {season.episodes.map((episode) => (
                            <div key={episode.id} className="flex gap-3">
                              {stillUrl(episode.stillPath) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={stillUrl(episode.stillPath) ?? ""} alt="" className="h-16 w-28 rounded-lg object-cover" />
                              ) : null}
                              <div>
                                <p className="text-sm">
                                  {episode.episodeNumber}. {episode.name}
                                </p>
                                <p className="line-clamp-2 text-xs text-muted">{episode.overview}</p>
                              </div>
                              {user ? <EpisodeToggle episodeId={episode.id} watched={data.watchedEpisodeIds.includes(episode.id)} /> : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
              </section>
            ) : null}
            <TitleRow heading="More like this" titles={similar} interactive={Boolean(user)} />
          </div>
          <aside className="space-y-4">
            {match ? (
              <div className="rounded-3xl border border-line bg-paper p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Why this</p>
                {match.percent ? <p className="mt-2 font-serif text-4xl">{match.percent}% match</p> : null}
                <p className="mt-2 text-sm text-muted">{match.text}</p>
              </div>
            ) : null}
            {crew.length > 0 ? (
              <div className="rounded-3xl border border-line bg-paper p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Crew</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {crew.map((credit) => (
                    <li key={credit.id}>
                      <Link href={`/person/${credit.personId}`} className="hover:text-gold">
                        {credit.person.name}
                      </Link>
                      <span className="text-muted"> · {credit.job}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {title.keywords.length > 0 ? (
              <div className="rounded-3xl border border-line bg-paper p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">Keywords</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {title.keywords.slice(0, 12).map((item) => (
                    <span key={item.keywordId} className="rounded-full border border-line px-2 py-1 text-xs text-muted">
                      {item.keyword.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </article>
    </>
  );
  return user ? <AppShell>{content}</AppShell> : <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">{content}</main>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const title = await prisma.title.findUnique({ where: { id }, select: { title: true, overview: true, posterPath: true } });
  if (!title) return { title: "Title not found" };
  const image = title.posterPath ? `https://image.tmdb.org/t/p/w780${title.posterPath}` : undefined;
  return {
    title: title.title,
    description: title.overview ?? `Discover ${title.title} on ReelTrack.`,
    openGraph: { title: title.title, description: title.overview ?? undefined, images: image ? [image] : [] },
  };
}
