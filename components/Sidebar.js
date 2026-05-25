"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  CalendarDays,
  LayoutGrid,
  Inbox,
  Plug,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Daily Standup", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/titles", label: "Titles", icon: LayoutGrid },
  { href: "/inbox", label: "AI Inbox", icon: Inbox },
  { href: "/connections", label: "Connections", icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-line bg-white">
      <div className="px-5 pt-6 pb-5 border-b border-line">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="display text-[22px] font-bold tracking-tight">
            2K
          </span>
          <span className="display text-[22px] font-bold tracking-tight text-accent-primary">
            BeatBoard
          </span>
        </Link>
        <p className="text-[11px] text-ink-500 mt-1 leading-tight">
          Integrated Marketing Ops · NA
        </p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-ink-700 hover:bg-ink-300/20"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-line space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-sm font-semibold">
            AA
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Alex Akiyama</div>
            <div className="text-[11px] text-ink-500 truncate">
              Manager, Integrated Marketing — NA
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
            Team
          </div>
          <ul className="space-y-1 text-[11px]">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-violet shrink-0" />
              <span className="text-ink-700 truncate">Davide Detta</span>
              <span className="text-ink-500 truncate">· Sr Mgr</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shrink-0" />
              <span className="text-ink-700 truncate">Alex Akiyama</span>
              <span className="text-ink-500 truncate">· Mgr (NA)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-300 shrink-0" />
              <span className="text-ink-700 truncate">Marketing Mgr II</span>
              <span className="text-ink-500 truncate">· peer</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
