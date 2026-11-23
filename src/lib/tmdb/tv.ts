import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbGenre, TmdbPaged, TmdbSeason, TmdbTitleListItem, TmdbTvDetail } from "@/lib/tmdb/types";

export function getTvGenres() {
  return tmdbFetch<{ genres: TmdbGenre[] }>("/genre/tv/list");
}

export function searchTv(query: string, page = 1, timeoutMs?: number) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/search/tv", { query, page, include_adult: "false" }, 0, timeoutMs);
}

export function getPopularTv(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/tv/popular", { page });
}

export function getTrendingTv() {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/trending/tv/week");
}

export function getTopRatedTv(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/tv/top_rated", { page });
}

export function getOnTheAirTv(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/tv/on_the_air", { page });
}

export function getUpcomingTv(from: string, to: string, page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/discover/tv", {
    "first_air_date.gte": from,
    "first_air_date.lte": to,
    sort_by: "first_air_date.asc",
    page,
  });
}

export function discoverTv(options: {
  originalLanguage: string;
  originCountry: string;
  year: number;
  page?: number;
}) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/discover/tv", {
    include_adult: "false",
    with_original_language: options.originalLanguage,
    with_origin_country: options.originCountry,
    first_air_date_year: options.year,
    sort_by: "popularity.desc",
    page: options.page ?? 1,
  });
}

export function getStreamingProviders(country: string) {
  return tmdbFetch<{ results: Array<{ provider_id: number; provider_name: string; logo_path: string | null }> }>("/watch/providers/tv", {
    watch_region: country.toUpperCase(),
  });
}

export function getShowsByProvider(country: string, providerId?: number) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/discover/tv", {
    watch_region: country.toUpperCase(),
    with_watch_monetization_types: "flatrate",
    with_watch_providers: providerId,
    sort_by: "popularity.desc",
  });
}

export function getTv(id: number) {
  return tmdbFetch<TmdbTvDetail>(`/tv/${id}`, {
    append_to_response: "aggregate_credits,credits,keywords",
  });
}

export function getTvSeason(tvId: number, seasonNumber: number) {
  return tmdbFetch<TmdbSeason & { episodes?: import("@/lib/tmdb/types").TmdbEpisode[] }>(
    `/tv/${tvId}/season/${seasonNumber}`,
  );
}
