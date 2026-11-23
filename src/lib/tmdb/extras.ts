import { TitleType } from "@prisma/client";
import { tmdbFetch } from "@/lib/tmdb/client";

type Provider = { provider_id: number; provider_name: string; logo_path: string | null };
type Providers = { link?: string; flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[] };
type Videos = { results: Array<{ key: string; site: string; type: string; official?: boolean }> };

export async function getStreamingProviders(type: TitleType, tmdbId: number, country: string, timeoutMs?: number) {
  const resource = type === TitleType.MOVIE ? "movie" : "tv";
  const data = await tmdbFetch<{ results: Record<string, Providers> }>(`/${resource}/${tmdbId}/watch/providers`, {}, 0, timeoutMs);
  return data.results[country.toUpperCase()] ?? null;
}

export async function getTrailer(type: TitleType, tmdbId: number, timeoutMs?: number) {
  const resource = type === TitleType.MOVIE ? "movie" : "tv";
  const data = await tmdbFetch<Videos>(`/${resource}/${tmdbId}/videos`, {}, 0, timeoutMs);
  return data.results.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)
    ?? data.results.find((video) => video.site === "YouTube" && video.type === "Trailer")
    ?? null;
}
