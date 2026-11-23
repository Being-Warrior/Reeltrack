import { AppShell } from "@/components/app-shell";
import { getAnalytics } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalytics(user.id);
  const maxYear = Math.max(1, ...data.years.map(([, count]) => count));
  const maxGenre = Math.max(1, ...data.genres.map(([, count]) => count));
  const maxMonth = Math.max(1, ...data.months.map(([, count]) => count));
  const maxRating = Math.max(1, ...data.ratingDistribution.map(([, count]) => count));

  return (
    <AppShell>
      <h1 className="font-serif text-5xl">Analytics</h1>
      <p className="mt-2 text-muted">A quiet read of how you actually watch.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [`${data.hours}h`, "Hours logged"],
          [String(data.movies), "Movies completed"],
          [String(data.shows), "Series completed"],
          [data.avgRating ? data.avgRating.toFixed(1) : "—", "Average rating"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-3xl border border-line bg-paper p-5">
            <p className="font-serif text-4xl">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-paper p-6">
          <h2 className="font-serif text-2xl">Taste</h2>
          <ul className="mt-4 space-y-3">
            {data.taste.slice(0, 8).map((item) => (
              <li key={item.name}>
                <div className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-muted">{item.percent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                  <div className="h-full bg-gold" style={{ width: `${item.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-line bg-paper p-6">
          <h2 className="font-serif text-2xl">Completed by year</h2>
          <div className="mt-6 flex items-end gap-3">
            {data.years.length === 0 ? (
              <p className="text-sm text-muted">Finish a title to start the timeline.</p>
            ) : (
              data.years.map(([year, count]) => (
                <div key={year} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t bg-gold/80" style={{ height: `${(count / maxYear) * 120}px` }} />
                  <span className="text-xs text-muted">{year}</span>
                </div>
              ))
            )}
          </div>
          <h3 className="mt-8 font-serif text-xl">Genres watched</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.genres.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between">
                <span>{name}</span>
                <span className="text-muted">
                  {count} · {Math.round((count / maxGenre) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-paper p-6">
          <h2 className="font-serif text-2xl">Monthly activity</h2>
          {data.months.length === 0 ? <p className="mt-4 text-sm text-muted">Complete a title to start your activity timeline.</p> : (
            <div className="mt-6 flex h-36 items-end gap-2">
              {data.months.map(([month, count]) => <div key={month} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t bg-terracotta/80" style={{ height: `${(count / maxMonth) * 100}%` }} /><span className="text-[10px] text-muted">{month.slice(5)}</span></div>)}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-line bg-paper p-6">
          <h2 className="font-serif text-2xl">Rating distribution</h2>
          {data.ratingDistribution.length === 0 ? <p className="mt-4 text-sm text-muted">Rate a title to see the shape of your taste.</p> : (
            <div className="mt-6 space-y-3">{data.ratingDistribution.map(([rating, count]) => <div key={rating}><div className="flex justify-between text-sm"><span>{rating.toFixed(1)} stars</span><span className="text-muted">{count}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised"><div className="h-full bg-gold" style={{ width: `${(count / maxRating) * 100}%` }} /></div></div>)}</div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
