import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { TitleCard } from "@/components/title-card";
import { getWatchedLibrary } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function WatchedPage() {
  const user = await requireUser();
  const data = await getWatchedLibrary(user.id);

  return (
    <AppShell>
      <h1 className="font-serif text-5xl">Watched</h1>
      <p className="mt-2 text-muted">Completed titles, ratings, and favourites.</p>
      {data.completed.length === 0 && data.rated.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No history yet" body="Mark something as watched and it will appear here." href="/discover" cta="Find a title" />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-serif text-2xl">Completed</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              {data.completed.map((title) => (
                <TitleCard key={title.id} title={title} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-serif text-2xl">Favourites</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              {data.favorites.map((title) => (
                <TitleCard key={title.id} title={title} />
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
