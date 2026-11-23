"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export function SearchFilters({
  query,
  genres,
  values,
}: {
  query: string;
  genres: string[];
  values: { type?: string; genre?: string; year?: string; minRating?: string; language?: string; minRuntime?: string };
}) {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams({ q: query });
    ["type", "genre", "year", "minRating", "language", "minRuntime"].forEach((key) => {
      const value = String(data.get(key) ?? "").trim();
      if (value) params.set(key, value);
    });
    router.push(`/search?${params.toString()}`);
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 rounded-2xl border border-line bg-paper p-3">
      <select name="type" defaultValue={values.type ?? ""} className="rounded-xl bg-bg px-2 py-1.5 text-xs"><option value="">All types</option><option value="MOVIE">Movies</option><option value="TV">Series</option></select>
      <select name="genre" defaultValue={values.genre ?? ""} className="rounded-xl bg-bg px-2 py-1.5 text-xs"><option value="">All genres</option>{genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}</select>
      <input name="year" defaultValue={values.year ?? ""} inputMode="numeric" placeholder="Year" className="w-20 rounded-xl bg-bg px-2 py-1.5 text-xs" />
      <select name="minRating" defaultValue={values.minRating ?? ""} className="rounded-xl bg-bg px-2 py-1.5 text-xs"><option value="">Any rating</option><option value="6">6+</option><option value="7">7+</option><option value="8">8+</option></select>
      <input name="language" defaultValue={values.language ?? ""} placeholder="Language" className="w-24 rounded-xl bg-bg px-2 py-1.5 text-xs" />
      <input name="minRuntime" defaultValue={values.minRuntime ?? ""} inputMode="numeric" placeholder="Min. mins" className="w-24 rounded-xl bg-bg px-2 py-1.5 text-xs" />
      <button className="rounded-xl border border-gold/40 px-3 py-1.5 text-xs text-gold">Apply</button>
    </form>
  );
}
