import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbPaged, TmdbPerson } from "@/lib/tmdb/types";

export function searchPeople(query: string, page = 1, timeoutMs?: number) {
  return tmdbFetch<TmdbPaged<TmdbPerson>>("/search/person", { query, page, include_adult: "false" }, 0, timeoutMs);
}

export function getPerson(id: number) {
  return tmdbFetch<TmdbPerson>(`/person/${id}`);
}
