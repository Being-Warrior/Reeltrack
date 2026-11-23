import { TMDB_IMAGE_BASE } from "@/lib/constants";

export function posterUrl(path: string | null | undefined, size: "w342" | "w500" | "w780" = "w500") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null | undefined, size: "w185" | "h632" = "w185") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function stillUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w300${path}`;
}

export function providerLogoUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w92${path}`;
}
