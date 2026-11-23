import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbCollection, TmdbGenre, TmdbMovieDetail, TmdbPaged, TmdbTitleListItem } from "@/lib/tmdb/types";

export function getMovieGenres() {
  return tmdbFetch<{ genres: TmdbGenre[] }>("/genre/movie/list");
}

export function searchMovies(query: string, page = 1, timeoutMs?: number) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/search/movie", { query, page, include_adult: "false" }, 0, timeoutMs);
}

export function getPopularMovies(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/movie/popular", { page });
}

export function getTrendingMovies() {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/trending/movie/week");
}

export function getNowPlayingMovies(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/movie/now_playing", { page });
}

export function getTopRatedMovies(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/movie/top_rated", { page });
}

export function getUpcomingMovies(page = 1) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/movie/upcoming", { page });
}

export function discoverMovies(options: {
  originalLanguage: string;
  region: string;
  year: number;
  page?: number;
}) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/discover/movie", {
    include_adult: "false",
    include_video: "false",
    with_original_language: options.originalLanguage,
    region: options.region,
    primary_release_year: options.year,
    sort_by: "popularity.desc",
    page: options.page ?? 1,
  });
}

export function getPopularMoviesByRegion(country: string, timeoutMs?: number) {
  return tmdbFetch<TmdbPaged<TmdbTitleListItem>>("/discover/movie", {
    include_adult: "false",
    include_video: "false",
    region: country.toUpperCase(),
    with_origin_country: country.toUpperCase(),
    sort_by: "popularity.desc",
    "vote_count.gte": 10,
    page: 1,
  }, 0, timeoutMs);
}

export function getMovie(id: number) {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${id}`, { append_to_response: "credits,keywords" });
}

export function getMovieCollection(id: number) {
  return tmdbFetch<TmdbCollection>(`/collection/${id}`);
}
