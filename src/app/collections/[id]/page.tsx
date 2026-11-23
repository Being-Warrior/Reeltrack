import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CollectionControls, RemoveFromCollectionButton, ReorderCollectionButton } from "@/components/collection-controls";
import { TitleCard } from "@/components/title-card";
import { getCollectionPage } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { SaveSharedCollection } from "@/components/save-shared-collection";
import { CollectionTitlePicker } from "@/components/collection-title-picker";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const data = await getCollectionPage(user?.id, id);
  if (!data) notFound();

  const content = (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl">{data.collection.name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{data.collection.description}</p>
          {!data.collection.isPrivate ? <p className="mt-2 text-sm text-gold">Shared by {data.collection.user.name ?? data.collection.user.username ?? "a ReelTrack member"}</p> : null}
        </div>
        {user?.id === data.collection.userId ? <CollectionControls collection={data.collection} /> : user ? <SaveSharedCollection collectionId={data.collection.id} /> : <p className="text-sm text-muted">Shared collection</p>}
      </div>
      {user?.id === data.collection.userId ? <div className="mt-6"><CollectionTitlePicker collectionId={data.collection.id} /></div> : null}
      <div className="mt-10 flex flex-wrap gap-4">
        {data.titles.map((title, index) => (
          <div key={title.id}>
            <TitleCard title={title} interactive={Boolean(user)} />
            {user?.id === data.collection.userId ? <div className="mt-2 flex gap-3">
              <ReorderCollectionButton collectionId={data.collection.id} titleIds={data.titles.map((item) => item.id)} index={index} direction="previous" />
              <ReorderCollectionButton collectionId={data.collection.id} titleIds={data.titles.map((item) => item.id)} index={index} direction="next" />
              <RemoveFromCollectionButton collectionId={data.collection.id} titleId={title.id} />
            </div> : null}
          </div>
        ))}
      </div>
    </>
  );
  return user ? <AppShell>{content}</AppShell> : <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">{content}</main>;
}
