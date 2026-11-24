export const APP_NAME = "ReelTrack";

export const STALE_SYNC_MS = 1000 * 60 * 60 * 24 * 14;

export const RECOMMENDATION_VERSION = "v1";
export const RECOMMENDATION_TTL_MS = 1000 * 60 * 60 * 24;

export const RATING_MIN = 0.5;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;

export const SEARCH_DEBOUNCE_MS = 280;
export const SEARCH_MIN_CHARS = 2;
export const TMDB_INTERACTIVE_TIMEOUT_MS = 2_500;
export const TMDB_PAGE_AUXILIARY_TIMEOUT_MS = 1_500;
export const TMDB_BACKGROUND_TIMEOUT_MS = 6_000;
export const REGIONAL_FEED_TTL_MS = 1000 * 60 * 60 * 12;

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const TITLE_SYNC_INCLUDE = {
  genres: true,
  credits: true,
  keywords: true,
  seasons: true,
} as const;

export const NAV_DESKTOP = [
  { href: "/home", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/collections", label: "Collections" },
  { href: "/watched", label: "Watched" },
  { href: "/analytics", label: "Analytics" },
  { href: "/coming-soon", label: "Coming soon" },
  { href: "/streaming", label: "Streaming now" },
] as const;

export const NAV_MOBILE = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/watchlist", label: "Library", icon: "library" },
  { href: "/profile", label: "Profile", icon: "user" },
] as const;
