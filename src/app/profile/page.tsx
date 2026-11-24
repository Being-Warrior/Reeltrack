import Link from "next/link";
import { BarChart3, Radio } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TitleCard } from "@/components/title-card";
import { getProfileData } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();
  const data = await getProfileData(user.id);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl">{data.user?.name ?? "Viewer"}</h1>
          <p className="mt-2 text-muted">@{data.user?.username ?? "reeltrack"} · {data.analytics.completed} watched</p>
        </div>
        <Link href="/settings" className="rounded-full border border-line px-4 py-2 text-sm">
          Settings
        </Link>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/analytics" className="group rounded-3xl border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:border-gold/50"><BarChart3 className="h-5 w-5 text-gold" /><h2 className="mt-4 font-serif text-2xl">Analytics</h2><p className="mt-1 text-sm text-muted">See your watched time, favourite genres, ratings, and viewing patterns.</p></Link>
        <Link href="/autosync" className="group rounded-3xl border border-line bg-paper p-5 transition hover:-translate-y-0.5 hover:border-gold/50"><Radio className="h-5 w-5 text-gold" /><h2 className="mt-4 font-serif text-2xl">AutoSync</h2><p className="mt-1 text-sm text-muted">Connect YouTube or VLC and review playback activity.</p></Link>
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">Favourites</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {data.favorites.map((title) => (
            <TitleCard key={title.id} title={title} />
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">Recently completed</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {data.recent.map((title) => (
            <TitleCard key={title.id} title={title} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
