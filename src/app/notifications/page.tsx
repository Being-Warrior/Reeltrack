import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { markAllNotificationsRead } from "@/actions/user";
import { getNotifications } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.id);
  return <AppShell>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-serif text-5xl">Reminders</h1><p className="mt-2 text-muted">Upcoming releases linked to titles you follow.</p></div>
      {notifications.some((item) => !item.readAt) ? <form action={markAllNotificationsRead}><button className="rounded-full border border-line px-4 py-2 text-sm text-muted">Mark all read</button></form> : null}
    </div>
    <div className="mt-8 space-y-3">
      {notifications.length ? notifications.map((item) => <Link key={item.id} href={item.href ?? "/watchlist"} className={`block rounded-2xl border p-4 ${item.readAt ? "border-line bg-paper" : "border-gold/40 bg-raised"}`}><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-muted">{item.body}</p></Link>) : <p className="text-muted">No upcoming-release reminders yet.</p>}
    </div>
  </AppShell>;
}
