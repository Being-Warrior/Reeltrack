"use client";

import Link from "next/link";
import { useState } from "react";
import { Compass, Home, Library, Plus, User, X } from "lucide-react";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/watchlist", label: "Library", icon: Library },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-6 py-3 backdrop-blur md:hidden">
      {open ? <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-2 rounded-2xl border border-line bg-paper p-2 shadow-xl"><Link onClick={() => setOpen(false)} href="/discover" className="whitespace-nowrap rounded-xl px-3 py-2 text-xs text-gold">Find a title</Link><Link onClick={() => setOpen(false)} href="/collections" className="whitespace-nowrap rounded-xl px-3 py-2 text-xs text-gold">Collections</Link><Link onClick={() => setOpen(false)} href="/notifications" className="whitespace-nowrap rounded-xl px-3 py-2 text-xs text-gold">Reminders</Link></div> : null}
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted">
        {items.slice(0, 2).map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button aria-label="Quick actions" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="-mt-8 grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-gold text-bg shadow-lg">
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
        {items.slice(2).map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
