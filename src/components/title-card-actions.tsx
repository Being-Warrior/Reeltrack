"use client";

import { Check, CheckCircle2, Heart, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { WatchStatus } from "@prisma/client";
import { toggleFavorite, setWatchStatus } from "@/actions/tracking";
import { cn } from "@/lib/utils";

export function TitleCardActions({ titleId, favorite, status }: { titleId: string; favorite: boolean; status: WatchStatus | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (event: React.MouseEvent, work: () => Promise<unknown>) => {
    event.preventDefault();
    event.stopPropagation();
    start(async () => { await work(); router.refresh(); });
  };
  return (
    <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
      <button disabled={pending} aria-label="Add to watchlist" title="Add to watchlist" onClick={(event) => act(event, () => setWatchStatus(titleId, status === WatchStatus.WATCHLIST ? null : WatchStatus.WATCHLIST))} className={cn("grid h-7 w-7 place-items-center rounded-full bg-bg/85 backdrop-blur", status === WatchStatus.WATCHLIST ? "text-gold" : "text-ink")}>{status === WatchStatus.WATCHLIST ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}</button>
      <button disabled={pending} aria-label="Mark as watched" title="Mark as watched" onClick={(event) => act(event, () => setWatchStatus(titleId, WatchStatus.COMPLETED))} className={cn("grid h-7 w-7 place-items-center rounded-full bg-bg/85 backdrop-blur", status === WatchStatus.COMPLETED ? "text-gold" : "text-ink")}><CheckCircle2 className="h-3.5 w-3.5" /></button>
      <button disabled={pending} aria-label="Toggle favourite" title="Toggle favourite" onClick={(event) => act(event, () => toggleFavorite(titleId))} className={cn("grid h-7 w-7 place-items-center rounded-full bg-bg/85 backdrop-blur", favorite ? "text-terracotta" : "text-ink")}><Heart className={cn("h-3.5 w-3.5", favorite && "fill-current")} /></button>
    </div>
  );
}
