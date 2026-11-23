"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { toggleEpisodeWatched } from "@/actions/tracking";
import { cn } from "@/lib/utils";

export function EpisodeToggle({ episodeId, watched }: { episodeId: string; watched: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      aria-label={watched ? "Mark episode unwatched" : "Mark episode watched"}
      onClick={() => start(async () => { await toggleEpisodeWatched(episodeId); })}
      className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border", watched ? "border-gold bg-gold text-bg" : "border-line text-muted")}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}
