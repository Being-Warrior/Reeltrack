import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-2xl">
            <Clapperboard className="h-6 w-6 text-gold" />
            {APP_NAME}
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/login" className="rounded-full px-4 py-2 text-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-full bg-gold px-4 py-2 text-bg">
              Create account
            </Link>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-16 py-24 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Personal cinema memory</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-tight sm:text-7xl">
              Remember what you watched. Discover what comes next.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              ReelTrack keeps your watchlist, ratings, and taste profile on your terms — then recommends films and
              series from a catalog stored in your own database, not a live TMDB feed on every page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg">
                Start tracking
              </Link>
              <Link href="/login" className="rounded-full border border-line px-6 py-3 text-sm text-muted">
                I already have an account
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Watchlist that stays yours", "Statuses, notes in your history, and collections you can keep private."],
              ["Taste, not trends", "Recommendations from ratings, favourites, and genres you actually finish."],
              ["Movies and series", "One library for both, with seasons when the catalog has them."],
              ["Private by default", "Export or delete your history whenever you want."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-line bg-paper/80 p-5">
                <h2 className="font-serif text-xl">{title}</h2>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
