import { ExternalLink, Play } from "lucide-react";
import { providerLogoUrl } from "@/lib/tmdb/images";

type Provider = { provider_id: number; provider_name: string; logo_path: string | null };

export function TitleExtras({ titleId, trailerKey, providers }: { titleId: string; trailerKey?: string; providers: { link?: string; flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[] } | null }) {
  const services = [...(providers?.flatrate ?? []), ...(providers?.rent ?? []), ...(providers?.buy ?? [])]
    .filter((item, index, list) => list.findIndex((other) => other.provider_id === item.provider_id) === index).slice(0, 8);
  if (!trailerKey && services.length === 0) return null;
  return <div className="flex flex-wrap gap-3">
    {trailerKey ? <a href={`https://www.youtube.com/watch?v=${trailerKey}&reeltrackTitle=${titleId}&reeltrackTrailer=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm text-gold"><Play className="h-4 w-4" />Trailer</a> : null}
    {services.length ? <a href={providers?.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm text-muted">Where to watch <ExternalLink className="h-3.5 w-3.5" /></a> : null}
    {services.map((service) => <span key={service.provider_id} title={service.provider_name} className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-raised">{providerLogoUrl(service.logo_path) ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={providerLogoUrl(service.logo_path) ?? ""} alt={service.provider_name} className="h-full w-full object-cover" />
    ) : service.provider_name.slice(0, 1)}</span>)}
  </div>;
}
