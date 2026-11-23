import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await requireUser();
  if (!process.env.ADMIN_EMAIL || user.email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) notFound();
  const [users, titles, collections, unreadNotifications, latestTitles] = await Promise.all([
    prisma.user.count(),
    prisma.title.count(),
    prisma.collection.count(),
    prisma.notification.count({ where: { readAt: null } }),
    prisma.title.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, title: true, type: true, createdAt: true } }),
  ]);
  const stats = [["Users", users], ["Titles", titles], ["Collections", collections], ["Unread reminders", unreadNotifications]];
  return <AppShell><div className="space-y-8"><header><h1 className="font-serif text-5xl">Admin</h1><p className="mt-2 text-muted">Local platform health and catalogue activity.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-paper p-5"><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-2 font-serif text-4xl">{value}</p></div>)}</div>
    <section className="rounded-3xl border border-line bg-paper p-5"><h2 className="font-serif text-2xl">Recently added titles</h2><ul className="mt-4 space-y-2 text-sm">{latestTitles.map((title) => <li key={title.id} className="flex justify-between gap-4"><span>{title.title}</span><span className="text-muted">{title.type}</span></li>)}</ul></section>
  </div></AppShell>;
}
