import { WatchStatus } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { TitleCard } from "@/components/title-card";
import { getLibrary, getUpcomingReleases } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function WatchlistPage() {
  const user = await requireUser();
  const [titles, watching, upcoming] = await Promise.all([
    getLibrary(user.id, WatchStatus.WATCHLIST),
    getLibrary(user.id, WatchStatus.WATCHING),
    getUpcomingReleases(user.id),
  ]);

  return (
    <AppShell>
      <h1 className="font-serif text-5xl">Watchlist</h1>
      <p className="mt-2 text-muted">Queued and currently playing.</p>
      {upcoming.length > 0 ? (
        <section className="mt-8 rounded-3xl border border-gold/30 bg-paper p-5">
          <h2 className="font-serif text-2xl">Releasing this week</h2>
          <div className="mt-4 space-y-3">
            {upcoming.map((release) => (
              <div key={release.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                <p>{release.relatedTitle ? release.relatedTitle.title : release.title}<span className="text-muted"> · {release.subtitle}</span></p>
                <time className="text-xs text-gold">{release.releaseDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {titles.length === 0 && watching.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Nothing queued" body="Save a title from Discover and it will land here." href="/discover" cta="Browse catalog" />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {watching.length > 0 ? (
            <section>
              <h2 className="font-serif text-2xl">Watching</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {watching.map((title) => (
                  <TitleCard key={title.id} title={title} />
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h2 className="font-serif text-2xl">Up next</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              {titles.map((title) => (
                <TitleCard key={title.id} title={title} />
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
