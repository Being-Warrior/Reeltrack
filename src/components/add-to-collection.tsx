"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addTitleToCollection } from "@/actions/collections";

export function AddToCollection({
  titleId,
  collections,
}: {
  titleId: string;
  collections: { id: string; name: string; already: boolean }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (collections.length === 0) return null;

  return (
    <label className="block text-sm text-muted">
      Add to collection
      <select
        disabled={pending}
        defaultValue=""
        className="mt-1 w-full max-w-xs rounded-2xl border border-line bg-paper px-3 py-2 text-ink"
        onChange={(event) => {
          const collectionId = event.target.value;
          if (!collectionId) return;
          start(async () => {
            await addTitleToCollection(collectionId, titleId);
            router.refresh();
            event.target.value = "";
          });
        }}
      >
        <option value="">Choose…</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id} disabled={collection.already}>
            {collection.name}
            {collection.already ? " (already added)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
