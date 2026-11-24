"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, Search } from "lucide-react";
import { linkAutoSyncSessionAction } from "@/actions/autosync";
import { searchAction } from "@/actions/user";

type ReviewSession = { id: string; sourceTitle: string | null; source: string; mediaType: string; watchedSeconds: number; durationSeconds: number | null };
type Result = { id: string; title: string; type: string; releaseDate: Date | null };

export function AutoSyncReviewQueue({ sessions }: { sessions: ReviewSession[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function find(session: ReviewSession) {
    setOpenId(session.id); setQuery(session.sourceTitle ?? ""); setResults([]); setMessage("");
    startTransition(async () => {
      const found = await searchAction(session.sourceTitle ?? "");
      setResults(found.titles.map((item) => ({ id: item.id, title: item.title, type: item.type, releaseDate: item.releaseDate })));
    });
  }
  function search() {
    startTransition(async () => { const found = await searchAction(query); setResults(found.titles.map((item) => ({ id: item.id, title: item.title, type: item.type, releaseDate: item.releaseDate }))); });
  }
  function link(sessionId: string, titleId: string) {
    startTransition(async () => { try { await linkAutoSyncSessionAction(sessionId, titleId); setMessage("Activity linked."); setOpenId(null); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not link this activity."); } });
  }
  if (!sessions.length) return null;
  return <section className="rounded-3xl border border-gold/30 bg-paper p-6"><h2 className="font-serif text-2xl">Review activity</h2><p className="mt-1 text-sm text-muted">Confirm uncertain local files. ReelTrack will never guess and mark the wrong title watched.</p><div className="mt-5 space-y-3">{sessions.map((session) => <div key={session.id} className="rounded-2xl bg-raised/60 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{session.sourceTitle ?? "Unnamed activity"}</p><p className="mt-1 text-xs text-muted">{session.source} · {session.mediaType.replaceAll("_", " ").toLowerCase()} · {Math.round(session.watchedSeconds / 60)} min watched</p></div><button type="button" onClick={() => find(session)} disabled={pending} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-gold"><Search className="h-3.5 w-3.5" />Find title</button></div>{openId === session.id ? <div className="mt-4 border-t border-line pt-4"><div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm" placeholder="Search the catalog"/><button type="button" onClick={search} disabled={pending} className="rounded-xl border border-line px-3 text-sm">Search</button></div>{pending ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted"><LoaderCircle className="h-4 w-4 animate-spin" />Searching…</p> : null}<ul className="mt-3 space-y-2">{results.slice(0, 6).map((result) => <li key={result.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2"><span className="min-w-0 truncate text-sm">{result.title} <span className="text-muted">· {result.type}</span></span><button type="button" onClick={() => link(session.id, result.id)} disabled={pending} className="inline-flex shrink-0 items-center gap-1 text-xs text-gold"><Check className="h-3.5 w-3.5" />Link</button></li>)}</ul></div> : null}</div>)}</div>{message ? <p role="status" className="mt-3 text-sm text-muted">{message}</p> : null}</section>;
}
