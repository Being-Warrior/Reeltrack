"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCollection, removeTitleFromCollection, reorderCollectionItems, updateCollection } from "@/actions/collections";

export function CollectionControls({
  collection,
}: {
  collection: { id: string; name: string; description: string | null; isPrivate: boolean };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        className="flex flex-wrap items-end gap-2"
        action={(formData) =>
          start(async () => {
            await updateCollection(collection.id, {
              name: String(formData.get("name")),
              description: String(formData.get("description") || "") || undefined,
              isPrivate: formData.get("isPrivate") === "on",
            });
            setEditing(false);
            router.refresh();
          })
        }
      >
        <input name="name" defaultValue={collection.name} required className="w-40 rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
        <input name="description" defaultValue={collection.description ?? ""} placeholder="Description" className="w-48 rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
        <label className="text-xs text-muted"><input type="checkbox" name="isPrivate" defaultChecked={collection.isPrivate} className="mr-1" />Private</label>
        <button disabled={pending} className="rounded-full bg-gold px-3 py-2 text-xs text-bg">Save</button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted">Cancel</button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!collection.isPrivate ? <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">Copy share link</button> : null}
      <button onClick={() => setEditing(true)} className="rounded-full border border-line px-3 py-1 text-xs text-muted">Edit collection</button>
      <button
        disabled={pending}
        className="rounded-full border border-terracotta/40 px-3 py-1 text-xs text-terracotta"
        onClick={() => start(async () => { await deleteCollection(collection.id); router.push("/collections"); })}
      >
        Delete collection
      </button>
    </div>
  );
}

export function RemoveFromCollectionButton({ collectionId, titleId }: { collectionId: string; titleId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      className="mt-2 text-xs text-muted hover:text-terracotta"
      onClick={() =>
        start(async () => {
          await removeTitleFromCollection(collectionId, titleId);
          router.refresh();
        })
      }
    >
      Remove
    </button>
  );
}

export function ReorderCollectionButton({
  collectionId,
  titleIds,
  index,
  direction,
}: {
  collectionId: string;
  titleIds: string[];
  index: number;
  direction: "previous" | "next";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const target = direction === "previous" ? index - 1 : index + 1;
  if (target < 0 || target >= titleIds.length) return null;

  return (
    <button
      disabled={pending}
      onClick={() => start(async () => {
        const next = [...titleIds];
        [next[index], next[target]] = [next[target], next[index]];
        await reorderCollectionItems(collectionId, next);
        router.refresh();
      })}
      className="text-xs text-muted hover:text-gold"
    >
      {direction === "previous" ? "Move earlier" : "Move later"}
    </button>
  );
}
