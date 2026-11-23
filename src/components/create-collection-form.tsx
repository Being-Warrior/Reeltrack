"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollection } from "@/actions/collections";

export function CreateCollectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-full bg-gold px-4 py-2 text-sm text-bg">
        New collection
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      action={(formData) =>
        start(async () => {
          await createCollection({
            name: String(formData.get("name")),
            description: String(formData.get("description") || "") || undefined,
            isPrivate: formData.get("isPrivate") === "on",
          });
          setOpen(false);
          router.refresh();
        })
      }
    >
      <input name="name" required placeholder="Name" className="rounded-2xl border border-line bg-paper px-3 py-2" />
      <input name="description" placeholder="Description" className="rounded-2xl border border-line bg-paper px-3 py-2" />
      <label className="text-xs text-muted">
        <input type="checkbox" name="isPrivate" defaultChecked className="mr-2" />
        Private
      </label>
      <button disabled={pending} className="rounded-full bg-gold px-4 py-2 text-sm text-bg">
        Save
      </button>
    </form>
  );
}
