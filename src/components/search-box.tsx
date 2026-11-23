"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";

export function SearchBox({ compact = false, live = false }: { compact?: boolean; live?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    start(() => router.push(`/search?q=${encodeURIComponent(q)}`));
  }

  useEffect(() => {
    if (!live) return;
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => start(() => router.replace(`/search?q=${encodeURIComponent(q)}`)), 280);
    return () => window.clearTimeout(timer);
  }, [live, query, router]);

  return (
    <form onSubmit={onSubmit} className={compact ? "w-full" : "w-full max-w-md"}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles and people"
          className="w-full rounded-full border border-line bg-paper py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted focus:border-gold/50"
        />
      </label>
      {pending ? <span className="sr-only">Searching</span> : null}
    </form>
  );
}

export function SearchLink() {
  return (
    <Link href="/search" className="text-sm text-muted hover:text-ink">
      Search
    </Link>
  );
}
