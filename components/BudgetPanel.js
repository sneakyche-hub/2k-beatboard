"use client";

import { DollarSign, Pause, TrendingUp, AlertCircle } from "lucide-react";
import { titles, fmtMoney } from "@/lib/data";
import Badge from "./Badge";

const PACING_TONE = {
  on_pace: { label: "On pace", tone: "success" },
  near_cap: { label: "Near cap", tone: "amber" },
  over: { label: "Over", tone: "red" },
  held: { label: "Held", tone: "neutral" },
};

const PHASE_LABEL = {
  planning: "Planning",
  execution: "Execution",
  wrap: "Wrap",
};

function titleFor(id) {
  return titles.find((t) => t.title_id === id);
}

export default function BudgetPanel({ burn }) {
  if (!burn || !burn.campaigns) return null;

  const totalCommitted = burn.campaigns.reduce(
    (sum, c) => sum + (c.committed_this_week_usd || 0),
    0
  );
  const totalSpent = burn.campaigns.reduce(
    (sum, c) => sum + (c.spent_to_date_usd || 0),
    0
  );

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="section-title flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-accent-success" />
          Active campaign burn · {burn.week_label}
        </h2>
        <div className="text-[12px] text-ink-700">
          <span className="mono font-semibold">{fmtMoney(totalSpent)}</span>{" "}
          <span className="text-ink-500">spent of</span>{" "}
          <span className="mono font-semibold">{fmtMoney(totalCommitted)}</span>{" "}
          <span className="text-ink-500">committed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {burn.campaigns.map((c, i) => {
          const t = titleFor(c.title_id);
          const pacing = PACING_TONE[c.pacing_status] || { label: c.pacing_status, tone: "neutral" };
          const isHeld = c.pacing_status === "held";
          return (
            <div
              key={i}
              className="border border-line rounded-lg p-3.5 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ backgroundColor: t?.brand_color || "#888" }}
              />
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  {t && (
                    <div
                      className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                      style={{ color: t.brand_color }}
                    >
                      {t.title_name}
                    </div>
                  )}
                  <div className="text-[13px] font-semibold leading-snug">
                    {c.campaign_name}
                  </div>
                </div>
                <Badge tone={pacing.tone} size="xs">
                  {isHeld ? (
                    <span className="inline-flex items-center gap-1">
                      <Pause className="h-2.5 w-2.5" /> {pacing.label}
                    </span>
                  ) : (
                    pacing.label
                  )}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="mono text-[15px] font-bold">
                  {fmtMoney(c.spent_to_date_usd)}
                </span>
                <span className="text-[11px] text-ink-500">
                  / {fmtMoney(c.committed_this_week_usd)} committed
                </span>
              </div>

              {/* Pacing bar */}
              <div className="mt-2 h-1.5 bg-ink-300/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, c.pacing_pct || 0)}%`,
                    backgroundColor:
                      c.pacing_status === "near_cap"
                        ? "var(--accent-amber, #d97706)"
                        : c.pacing_status === "over"
                        ? "var(--accent-red, #dc2626)"
                        : c.pacing_status === "held"
                        ? "#9ca3af"
                        : t?.brand_color || "#3b82f6",
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-ink-500">
                  Phase:{" "}
                  <span className="text-ink-700 font-medium">
                    {PHASE_LABEL[c.phase] || c.phase}
                  </span>
                </span>
                <span className="text-ink-500">
                  Owner: <span className="text-ink-700">{c.owner}</span>
                </span>
              </div>

              {c.note && (
                <p className="text-[11.5px] text-ink-700 mt-2 leading-relaxed border-t border-line pt-2">
                  {c.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
