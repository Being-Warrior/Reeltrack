import Link from "next/link";
import { CheckCircle2, CircleAlert, Clock3, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AutoSyncDashboard } from "@/components/autosync-dashboard";
import { AutoSyncReviewQueue } from "@/components/autosync-review-queue";
import { getAutoSyncDashboard, getAutoSyncReviewSessions } from "@/lib/autosync";
import { requireUser } from "@/lib/session";

function sessionName(session: { title: { title: string } | null; episode: { name: string; episodeNumber: number } | null; sourceTitle: string | null }) {
  if (session.title && session.episode) return `${session.title.title} · E${session.episode.episodeNumber}: ${session.episode.name}`;
  return session.title?.title ?? session.sourceTitle ?? "Unmatched activity";
}

export default async function AutoSyncPage() {
  const user = await requireUser();
  const [data, reviewSessions] = await Promise.all([getAutoSyncDashboard(user.id), getAutoSyncReviewSessions(user.id)]);
  return <AppShell><div className="space-y-8">
    <header className="max-w-3xl"><p className="text-sm font-medium uppercase tracking-[0.18em] text-gold">Private playback sync</p><h1 className="mt-2 font-serif text-5xl">AutoSync</h1><p className="mt-3 text-muted">Bring viewing activity into ReelTrack through devices and approved connectors. We keep the raw events, make conservative matches, and let you review anything uncertain.</p></header>
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-3xl border border-line bg-paper p-5"><CheckCircle2 className="h-5 w-5 text-gold" /><p className="mt-4 font-serif text-3xl">{data.completed}</p><p className="mt-1 text-sm text-muted">Completed sessions</p></div><div className="rounded-3xl border border-line bg-paper p-5"><CircleAlert className="h-5 w-5 text-terracotta" /><p className="mt-4 font-serif text-3xl">{data.pendingReview}</p><p className="mt-1 text-sm text-muted">Need review</p></div><div className="rounded-3xl border border-line bg-paper p-5"><Sparkles className="h-5 w-5 text-gold" /><p className="mt-4 font-serif text-3xl">{data.integrations.length}</p><p className="mt-1 text-sm text-muted">Connected sources</p></div></div>
    <AutoSyncDashboard devices={data.devices} />
    <AutoSyncReviewQueue sessions={reviewSessions} />
    <section className="rounded-3xl border border-line bg-paper p-6"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-gold" /><h2 className="font-serif text-2xl">Recent activity</h2></div>{data.recentSessions.length ? <ul className="mt-5 divide-y divide-line">{data.recentSessions.map((session) => <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-medium">{sessionName(session)}</p><p className="mt-0.5 text-xs text-muted">{session.source} · {session.state.replaceAll("_", " ").toLowerCase()}</p></div><span className="text-xs text-muted">{session.watchedSeconds ? `${Math.round(session.watchedSeconds / 60)} min` : "Started"}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted">No synced activity yet. The browser connector is the next local milestone; Plex and desktop players follow after that.</p>}</section>
    <section className="rounded-3xl border border-line bg-paper p-6"><h2 className="font-serif text-2xl">Connect a source</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Link href="/autosync/youtube" className="rounded-2xl bg-raised/60 p-4 transition hover:bg-raised"><p className="font-medium">YouTube browser extension</p><p className="mt-1 text-sm text-muted">Download, install, pair, and sync YouTube activity.</p></Link><Link href="/autosync/vlc" className="rounded-2xl bg-raised/60 p-4 transition hover:bg-raised"><p className="font-medium">VLC desktop companion</p><p className="mt-1 text-sm text-muted">Set up a private background VLC connection.</p></Link><div className="rounded-2xl bg-raised/60 p-4"><p className="font-medium">Plex and Jellyfin</p><p className="mt-1 text-sm text-muted">Webhook/import support follows VLC validation.</p></div></div></section>
  </div></AppShell>;
}
