"use client";

import { useState, useTransition } from "react";
import { addTitleToCollection, findTitlesForCollection } from "@/actions/collections";

type Result = { id: string; title: string; type: "MOVIE" | "TV"; releaseDate: Date | null; alreadyAdded: boolean };

export function CollectionTitlePicker({ collectionId }: { collectionId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [pending, start] = useTransition();
  function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) return setResults([]);
    start(async () => setResults(await findTitlesForCollection(collectionId, value) as Result[]));
  }
  function add(titleId: string) {
    start(async () => {
      await addTitleToCollection(collectionId, titleId);
      setResults((current) => current.map((item) => item.id === titleId ? { ...item, alreadyAdded: true } : item));
    });
  }
  return <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-3">
    <label className="text-xs uppercase tracking-wide text-muted">Add a title</label>
    <input value={query} onChange={(event) => search(event.target.value)} placeholder="Search movies or series" className="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm" />
    {pending ? <p className="mt-2 text-xs text-muted">Searching…</p> : null}
    {results.length ? <ul className="mt-2 divide-y divide-line">{results.map((title) => <li key={title.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="min-w-0 truncate">{title.title} <span className="text-xs text-muted">· {title.type === "TV" ? "Series" : "Movie"}</span></span><button disabled={pending || title.alreadyAdded} onClick={() => add(title.id)} className="shrink-0 rounded-full border border-gold/40 px-3 py-1 text-xs text-gold disabled:border-line disabled:text-muted">{title.alreadyAdded ? "Added" : "Add"}</button></li>)}</ul> : null}
  </div>;
}
