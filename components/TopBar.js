"use client";

import { Search, Bell } from "lucide-react";

export default function TopBar() {
  const today = new Date("2026-05-24T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center gap-4 px-4 md:px-6 lg:px-8 py-3">
        <div className="md:hidden">
          <span className="display text-base font-bold tracking-tight">
            2K <span className="text-accent-primary">BeatBoard</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[12px] text-ink-500">
          <span className="mono">{today}</span>
          <span>·</span>
          <span>Demo mode</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-base text-sm text-ink-500 min-w-[260px]">
            <Search className="h-3.5 w-3.5" />
            <span className="text-[12px]">Search titles, beats, tickets…</span>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="h-9 w-9 rounded-lg border border-line bg-white flex items-center justify-center text-ink-700 hover:bg-ink-300/20"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
