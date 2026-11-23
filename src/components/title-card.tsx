import Link from "next/link";
import type { TitleCardModel } from "@/lib/titles";
import { TITLE_TYPE_LABEL, WATCH_STATUS_LABEL } from "@/lib/labels";
import { Poster } from "@/components/poster";
import { TitleCardActions } from "@/components/title-card-actions";

export function TitleCard({
  title,
  reason,
  interactive = true,
  className = "",
  showReleaseDate = false,
}: {
  title: TitleCardModel;
  reason?: string;
  interactive?: boolean;
  className?: string;
  showReleaseDate?: boolean;
}) {
  return (
    <div className={`group relative block ${className || "w-[148px] shrink-0 sm:w-[168px]"}`}>
      <Link href={`/title/${title.id}`} className="block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl ring-1 ring-line transition duration-300 group-hover:-translate-y-1 group-hover:ring-gold/40">
        <Poster path={title.posterPath} title={title.title} className="h-full w-full" />
        {title.watchStatus ? (
          <span className="absolute left-2 top-2 rounded-full bg-bg/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold backdrop-blur">
            {WATCH_STATUS_LABEL[title.watchStatus]}
          </span>
        ) : null}
      </div>
      <div className="mt-2">
        <p className="line-clamp-1 text-sm font-medium">{title.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {showReleaseDate && title.releaseDate
            ? title.releaseDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : title.year ?? TITLE_TYPE_LABEL[title.type]}
          {title.userRating ? ` · ${title.userRating.toFixed(1)}` : ""}
        </p>
        {reason ? <p className="mt-1 line-clamp-2 text-[11px] text-gold/80">{reason}</p> : null}
      </div>
      </Link>
      {interactive ? <TitleCardActions titleId={title.id} favorite={title.isFavorite} status={title.watchStatus} /> : null}
    </div>
  );
}

export function TitleRow({
  heading,
  titles,
  reasons,
  empty,
  interactive = true,
  compactOnMobile = false,
  showReleaseDate = false,
}: {
  heading: string;
  titles: TitleCardModel[];
  reasons?: Record<string, string>;
  empty?: string;
  interactive?: boolean;
  compactOnMobile?: boolean;
  showReleaseDate?: boolean;
}) {
  if (titles.length === 0) {
    return empty ? (
      <section className="space-y-3">
        <h2 className="font-serif text-2xl">{heading}</h2>
        <p className="text-sm text-muted">{empty}</p>
      </section>
    ) : null;
  }

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl">{heading}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {titles.map((title, index) => (
          <TitleCard
            key={title.id}
            title={title}
            reason={reasons?.[title.id]}
            interactive={interactive}
            showReleaseDate={showReleaseDate}
            className={`w-full min-w-0 shrink ${compactOnMobile && index >= 6 ? "hidden lg:block" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}
