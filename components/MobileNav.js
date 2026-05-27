"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  CalendarDays,
  LayoutGrid,
  Inbox,
  FileText,
} from "lucide-react";

// Mobile nav is space-constrained — drop Connect (rarely used on mobile),
// promote Brief in its place so the shareable view is one tap away.
const NAV = [
  { href: "/", label: "Standup", icon: LayoutDashboard },
  { href: "/brief", label: "Brief", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/titles", label: "Titles", icon: LayoutGrid },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden sticky bottom-0 z-30 border-t border-line bg-white">
      <ul className="grid grid-cols-5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                  active ? "text-accent-primary" : "text-ink-500"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
