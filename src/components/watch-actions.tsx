"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { WatchStatus } from "@prisma/client";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { dismissRecommendation, setRating, setWatchStatus, toggleFavorite } from "@/actions/tracking";
import { STATUS_OPTIONS, WATCH_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function WatchActions({
  titleId,
  status,
  favorite,
  rating,
  recommendationId,
}: {
  titleId: string;
  status: WatchStatus | null;
  favorite: boolean;
  rating: number | null;
  recommendationId?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const next = status === option ? null : option;
              const result = await setWatchStatus(titleId, next);
              if (result.promptRating) toast.message("Mark a rating while it's fresh.");
              router.refresh();
            })
          }
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition",
            status === option
              ? "border-gold bg-gold text-bg"
              : "border-line text-muted hover:border-gold/50 hover:text-ink",
          )}
        >
          {WATCH_STATUS_LABEL[option]}
        </button>
      ))}
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleFavorite(titleId);
            router.refresh();
          })
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs",
          favorite ? "border-terracotta text-terracotta" : "border-line text-muted",
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", favorite && "fill-current")} />
        Favourite
      </button>
      <div className="flex items-center gap-1 pl-1">
        {Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map((value) => (
          <button
            key={value}
            disabled={pending}
            aria-label={`Rate ${value} out of 5`}
            title={`${value} stars`}
            className={cn("text-sm leading-none", rating && rating >= value ? "text-gold" : "text-muted/40")}
            onClick={() =>
              start(async () => {
                await setRating(titleId, value);
                router.refresh();
              })
            }
          >
            ★
          </button>
        ))}
      </div>
      {recommendationId ? (
        <button disabled={pending} onClick={() => start(async () => { await dismissRecommendation(recommendationId); router.refresh(); })} className="text-xs text-muted hover:text-terracotta">
          Not for me
        </button>
      ) : null}
    </div>
  );
}
