import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TitleRow } from "@/components/title-card";
import { getUserTitleExtras, toCards } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { getShowsByProvider, getStreamingProviders } from "@/lib/tmdb/tv";
import { upsertSearchTitleStub } from "@/lib/tmdb/sync";
import { providerLogoUrl } from "@/lib/tmdb/images";
import { Title, TitleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TMDB_PAGE_AUXILIARY_TIMEOUT_MS } from "@/lib/constants";

export default async function StreamingPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const user = await requireUser();
  const { provider } = await searchParams;
  const country = user.preferences?.country ?? "US";
  const providerId = Number(provider);
  let providers: Array<{ provider_id: number; provider_name: string; logo_path: string | null }> = [];
  let shows: Title[] = [];
  const selectedProviderId = Number.isInteger(providerId) && providerId > 0 ? providerId : undefined;
  const [providerResult, showResult] = await Promise.allSettled([
    getStreamingProviders(country, TMDB_PAGE_AUXILIARY_TIMEOUT_MS),
    getShowsByProvider(country, selectedProviderId, TMDB_PAGE_AUXILIARY_TIMEOUT_MS),
  ]);
  if (providerResult.status === "fulfilled") providers = providerResult.value.results;
  if (showResult.status === "fulfilled") {
    const items = showResult.value.results.slice(0, 18);
    const existing = await prisma.title.findMany({
      where: { type: TitleType.TV, tmdbId: { in: items.map((item) => item.id) } },
    });
    const knownIds = new Set(existing.map((show) => show.tmdbId));
    const added = await Promise.all(items.filter((item) => !knownIds.has(item.id)).map((item) => upsertSearchTitleStub(item, TitleType.TV)));
    const byTmdbId = new Map([...existing, ...added].map((show) => [show.tmdbId, show]));
    shows = items.flatMap((item) => {
      const show = byTmdbId.get(item.id);
      return show ? [show] : [];
    });
  }
  const extras = await getUserTitleExtras(user.id, shows.map((show) => show.id));
  const cards = await toCards(shows, extras);
  const selected = providers.find((item) => item.provider_id === providerId);
  return <AppShell><div className="space-y-8">
    <header><h1 className="font-serif text-5xl">Streaming now</h1><p className="mt-2 text-muted">Popular series available in {country.toUpperCase()}, based on TMDB’s regional provider listings.</p></header>
    <div className="flex flex-wrap gap-2">
      <Link href="/streaming" className={`rounded-full border px-3 py-1.5 text-xs ${!selected ? "border-gold text-gold" : "border-line text-muted"}`}>All services</Link>
      {providers.map((item) => <Link key={item.provider_id} href={`/streaming?provider=${item.provider_id}`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${selected?.provider_id === item.provider_id ? "border-gold text-gold" : "border-line text-muted"}`}>{providerLogoUrl(item.logo_path) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={providerLogoUrl(item.logo_path) ?? ""} alt="" className="h-4 w-4 rounded-sm" />
      ) : null}{item.provider_name}</Link>)}
    </div>
    <TitleRow heading={selected ? `Popular on ${selected.provider_name}` : "Popular across streaming services"} titles={cards} empty="No streaming data is currently available for this country or provider." />
  </div></AppShell>;
}
