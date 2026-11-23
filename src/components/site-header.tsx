import Link from "next/link";
import { Bell, Clapperboard } from "lucide-react";
import { APP_NAME, NAV_DESKTOP } from "@/lib/constants";
import { SearchBox } from "@/components/search-box";
import { logoutAction } from "@/actions/auth";

export function SiteHeader({
  name,
  avatar,
  unreadNotifications = 0,
}: {
  name?: string | null;
  avatar?: string | null;
  unreadNotifications?: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
        <Link href="/home" className="flex shrink-0 items-center gap-2 font-serif text-xl">
          <Clapperboard className="h-5 w-5 text-gold" />
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
          {NAV_DESKTOP.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden flex-1 justify-end md:flex">
          <SearchBox compact />
        </div>
        <div className="min-w-0 flex-1 md:hidden">
          <SearchBox compact />
        </div>
        <Link href="/notifications" aria-label="Notifications" className="relative hidden h-8 w-8 place-items-center text-muted hover:text-ink sm:grid">
          <Bell className="h-4 w-4" />
          {unreadNotifications ? <span className="absolute right-0 top-0 min-w-4 rounded-full bg-terracotta px-1 text-center text-[9px] leading-4 text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}
        </Link>
        <Link href="/profile" className="flex shrink-0 items-center gap-2 text-sm">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-raised text-xs text-gold">
              {(name ?? "R").slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>
        <form action={logoutAction} className="hidden md:block">
          <button className="text-xs uppercase tracking-wide text-muted hover:text-ink">Sign out</button>
        </form>
      </div>
    </header>
  );
}
