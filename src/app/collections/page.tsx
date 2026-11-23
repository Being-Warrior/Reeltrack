import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CreateCollectionForm } from "@/components/create-collection-form";
import { EmptyState } from "@/components/empty-state";
import { Poster } from "@/components/poster";
import { getCollections } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function CollectionsPage() {
  const user = await requireUser();
  const collections = await getCollections(user.id);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl">Collections</h1>
          <p className="mt-2 text-muted">Private lists, unless you say otherwise.</p>
        </div>
        <CreateCollectionForm />
      </div>
      {collections.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No collections yet" body="Create a list and add titles from any film or series page." />
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`} className="rounded-3xl border border-line bg-paper p-5">
              <div className="flex gap-2">
                {collection.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="relative h-24 w-16 overflow-hidden rounded-lg">
                    <Poster path={item.title.posterPath} title={item.title.title} className="h-full w-full" sizes="64px" />
                  </div>
                ))}
              </div>
              <h2 className="mt-4 font-serif text-2xl">{collection.name}</h2>
              <p className="text-sm text-muted">
                {collection.items.length} titles · {collection.isPrivate ? "Private" : "Unlisted"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
