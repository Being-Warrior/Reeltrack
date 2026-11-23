import { TitleType, WatchStatus } from "@prisma/client";

export const WATCH_STATUS_LABEL: Record<WatchStatus, string> = {
  WATCHLIST: "Watchlist",
  WATCHING: "Watching",
  COMPLETED: "Watched",
  PAUSED: "Paused",
  DROPPED: "Dropped",
};

export const TITLE_TYPE_LABEL: Record<TitleType, string> = {
  MOVIE: "Movie",
  TV: "Series",
};

export const STATUS_OPTIONS: WatchStatus[] = [
  WatchStatus.WATCHLIST,
  WatchStatus.WATCHING,
  WatchStatus.COMPLETED,
  WatchStatus.PAUSED,
  WatchStatus.DROPPED,
];
