"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { copySharedCollection } from "@/actions/collections";

export function SaveSharedCollection({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button disabled={pending} onClick={() => start(async () => { const copy = await copySharedCollection(collectionId); router.push(`/collections/${copy.id}`); })} className="rounded-full bg-gold px-4 py-2 text-sm text-bg">{pending ? "Saving…" : "Save to my collections"}</button>;
}
