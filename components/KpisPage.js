"use client";

import { useState } from "react";
import { titles, standup, escalationDrafts } from "@/lib/data";
import TitleKpis from "./TitleKpis";
import Badge from "./Badge";
import { Gauge, AlertTriangle, Send, ChevronDown } from "lucide-react";

const SEVERITY_TONE = { high: "red", medium: "amber", low: "neutral" };

export default function KpisPage() {
  const [activeId, setActiveId] = useState(titles[0]?.title_id);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [activeDraftId, setActiveDraftId] = useState(null);

  const active = titles.find((t) => t.title_id === activeId) || titles[0];

  // KPI-flagged risks live here, not in the standup
  const kpiAlerts = (standup.top_risks || []).filter(
    (r) => r.flag_type === "kpi"
  );

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
          Phase gates, leading indicators, and trend by franchise. Metric flags
          that need attention live here. Execution consequences (holds, tranches,
          decisions) surface in the standup's pending decisions panel.
        </p>
      </div>

      {/* KPI alerts — metric flags that belong here, not in the standup */}
      {kpiAlerts.length > 0 && (
        <section className="panel border-l-4 border-l-accent-amber overflow-hidden">
          <button
            type="button"
            onClick={() => setAlertsOpen((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-amber">
              <AlertTriangle className="h-4 w-4" />
              KPI alerts
              <span className="text-[11px] mono text-ink-500 font-normal ml-1">
                ({kpiAlerts.length}) · metric flags that crossed a gate this week
              </span>
            </h2>
            <ChevronDown
              className={`h-4 w-4 text-ink-400 transition-transform shrink-0 ${
                alertsOpen ? "" : "-rotate-90"
              }`}
            />
          </button>
          {alertsOpen && (
            <div className="px-4 pb-4 pt-0 border-t border-line">
              <ul className="divide-y divide-line">
                {kpiAlerts.map((r) => {
                  const t = titles.find((ti) => ti.title_id === r.title_id);
                  const draft = escalationDrafts.find(
                    (d) => d.draft_id === r.escalation_draft_id
                  );
                  return (
                    <li key={r.risk_id} className="py-3 first:pt-3 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Badge tone={SEVERITY_TONE[r.severity]} size="xs">
                          {r.severity}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-[13.5px] font-semibold text-ink-900">
                              {r.headline}
                            </span>
                            {t && (
                              <span
                                className="text-[10px] uppercase tracking-wider font-semibold"
                                style={{ color: t.brand_color }}
                              >
                                {t.title_name}
                              </span>
                            )}
                          </div>
                          <p className="text-[12.5px] text-ink-700 mt-1">
                            {r.detail}
                          </p>
                          <p className="text-[12.5px] text-ink-900 mt-1.5">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 mr-1.5">
                              Action
                            </span>
                            {r.recommended_action}
                          </p>
                          {draft && (
                            <button
                              type="button"
                              onClick={() => setActiveDraftId(draft.draft_id)}
                              className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-accent-primary font-medium hover:underline"
                            >
                              <Send className="h-3 w-3" />
                              View Claude-drafted {draft.channel} to {draft.recipient}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

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
