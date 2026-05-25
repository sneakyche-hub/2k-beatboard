"use client";

import { useState } from "react";
import { titles } from "@/lib/data";
import TitleKpis from "./TitleKpis";
import { Gauge } from "lucide-react";

export default function KpisPage() {
  const [activeId, setActiveId] = useState(titles[0]?.title_id);
  const active = titles.find((t) => t.title_id === activeId) || titles[0];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
          <Gauge className="h-3 w-3" /> KPIs
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          Per-franchise KPI tracker
        </h1>
        <p className="text-[13px] text-ink-500 mt-1">
          Phase gates, leading indicators, and trend by franchise. Daily Standup
          stays focused on operations. Decision packets that depend on these
          numbers link from the standup's pending decisions panel.
        </p>
      </div>

      {/* Franchise selector */}
      <div className="border-b border-line">
        <div className="flex flex-wrap gap-1">
          {titles.map((t) => {
            const isActive = t.title_id === activeId;
            return (
              <button
                key={t.title_id}
                type="button"
                onClick={() => setActiveId(t.title_id)}
                className={`px-3 py-2 text-[12.5px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-current"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                }`}
                style={isActive ? { color: t.brand_color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: t.brand_color }}
                />
                {t.title_name}
              </button>
            );
          })}
        </div>
      </div>

      <TitleKpis title={active} />
    </div>
  );
}
