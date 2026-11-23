"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboarding } from "@/actions/onboarding";
import { Poster } from "@/components/poster";
import type { TitleCardModel } from "@/lib/titles";
import { cn } from "@/lib/utils";
import { CountrySelect } from "@/components/country-select";

type Genre = { id: string; name: string };
type TasteItem = { name: string; percent: number };

export function OnboardingWizard({ genres, titles, defaultCountry }: { genres: Genre[]; titles: TitleCardModel[]; defaultCountry: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(defaultCountry);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [taste, setTaste] = useState<TasteItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(list: string[], id: string, max: number) {
    if (list.includes(id)) return list.filter((item) => item !== id);
    if (list.length >= max) return list;
    return [...list, id];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Step {step + 1} of 6</p>
      <h1 className="mt-2 font-serif text-5xl">
        {step === 0 ? "Let's get to know your taste." : step === 5 && taste.length ? "We've got your taste." : "Tell us what you love"}
      </h1>

      {step === 0 ? (
        <section className="mt-8 max-w-2xl">
          <p className="text-lg leading-relaxed text-muted">A few quick choices give ReelTrack a useful starting point. It will keep learning as you watch, rate, and save.</p>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="mt-8 max-w-md">
          <p className="text-muted">Choose your country so streaming services and release dates match where you live.</p>
          <label className="mt-5 block text-sm">
            Country
            <CountrySelect value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3" />
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-8">
          <p className="text-muted">Pick a few genres. One is enough; twelve is the ceiling.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setGenreIds(toggle(genreIds, genre.id, 12))}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm",
                  genreIds.includes(genre.id) ? "border-gold bg-gold text-bg" : "border-line text-muted",
                )}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-8">
          <p className="text-muted">Favourite a handful of titles we already have in the catalog.</p>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {titles.map((title) => (
              <button
                key={title.id}
                onClick={() => setFavoriteIds(toggle(favoriteIds, title.id, 12))}
                className="text-left"
              >
                <div
                  className={cn(
                    "relative aspect-[2/3] overflow-hidden rounded-xl ring-2",
                    favoriteIds.includes(title.id) ? "ring-gold" : "ring-transparent",
                  )}
                >
                  <Poster path={title.posterPath} title={title.title} className="h-full w-full" />
                </div>
                <p className="mt-2 line-clamp-1 text-xs">{title.title}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="mt-8">
          <p className="text-muted">Rate a few you’ve already seen. Half-stars aren’t needed here — pick 1 to 5.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {titles.filter((title) => favoriteIds.includes(title.id)).map((title) => (
              <div key={title.id} className="flex items-center gap-4 rounded-2xl border border-line bg-paper p-3">
                <div className="relative h-20 w-14 overflow-hidden rounded-lg">
                  <Poster path={title.posterPath} title={title.title} className="h-full w-full" sizes="56px" />
                </div>
                <div>
                  <p className="text-sm font-medium">{title.title}</p>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        className={cn("text-lg", (ratings[title.id] ?? 0) >= value ? "text-gold" : "text-muted/40")}
                        onClick={() => setRatings((current) => ({ ...current, [title.id]: value }))}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="mt-8 max-w-2xl">
          {pending ? <p className="text-lg text-muted">Reading the patterns in what you picked...</p> : null}
          {taste.length > 0 ? (
            <div className="space-y-4 rounded-3xl border border-line bg-paper p-6">
              {taste.slice(0, 4).map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm"><span>{item.name}</span><span className="text-gold">{item.percent}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised"><div className="h-full bg-gold" style={{ width: `${item.percent}%` }} /></div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? <p className="mt-4 text-sm text-terracotta">{error}</p> : null}

      <div className="mt-10 flex gap-3">
        {step > 0 && step < 5 ? (
          <button onClick={() => setStep(step - 1)} className="rounded-full border border-line px-5 py-2 text-sm">
            Back
          </button>
        ) : null}
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 2 && genreIds.length === 0}
            className="rounded-full bg-gold px-5 py-2 text-sm text-bg disabled:opacity-50"
          >
            Continue
          </button>
        ) : step === 4 ? (
          <button
            disabled={pending || favoriteIds.length === 0 || Object.keys(ratings).length === 0}
            onClick={() =>
              start(async () => {
                const result = await completeOnboarding({
                  country,
                  genreIds,
                  favoriteIds,
                  ratings: Object.entries(ratings).map(([titleId, rating]) => ({ titleId, rating })),
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setTaste(result.taste ?? []);
                setStep(5);
              })
            }
            className="rounded-full bg-gold px-5 py-2 text-sm text-bg disabled:opacity-50"
          >
            {pending ? "Saving…" : "Enter ReelTrack"}
          </button>
        ) : (
          <button onClick={() => router.push("/home")} className="rounded-full bg-gold px-5 py-2 text-sm text-bg">
            Explore ReelTrack
          </button>
        )}
      </div>
    </div>
  );
}
