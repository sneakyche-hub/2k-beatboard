"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { tickets, titles, fmtDate, DEMO_TODAY_ISO } from "@/lib/data";
import Badge from "./Badge";

function titleFor(id) {
  return titles.find((t) => t.title_id === id);
}

function ticketHref(ticket) {
  const t = titleFor(ticket.title_id);
  return t ? `/titles/${t.franchise_slug}#tickets` : null;
}

// Bucket filters. The headline numbers come from prod (static, curated) but the
// expanded lists come from the live tickets dataset so the user can drill in.
function bucketTickets(bucket, prod, brief) {
  const today = DEMO_TODAY_ISO;
  const weekEnd = "2026-06-01";

  if (bucket === "on_track") {
    return tickets
      .filter(
        (t) =>
          t.due_date >= today &&
          t.due_date <= weekEnd &&
          (t.status === "in_progress" ||
            t.status === "scheduled" ||
            t.status === "open")
      )
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }
  if (bucket === "ahead_of") {
    return tickets
      .filter(
        (t) =>
          t.status === "at_risk" ||
          t.status === "blocked" ||
          (t.due_date < today && t.status !== "completed")
      )
      .sort((a, b) => {
        const rank = { at_risk: 0, blocked: 0 };
        return (rank[a.status] ?? 1) - (rank[b.status] ?? 1) ||
          a.due_date.localeCompare(b.due_date);
      });
  }
  if (bucket === "closed_yesterday") {
    return (brief.yesterday_closeout?.completed || []).map((c) => ({
      ticket_id: c.ticket_id,
      title_id: c.title_id,
      summary: c.summary,
      status: "completed",
      priority: null,
      due_date: null,
      owner: null,
    }));
  }
  if (bucket === "opened_yesterday") {
    return (brief.yesterday_closeout?.opened_yesterday || []).map((o) => ({
      ticket_id: o.ticket_id,
      title_id: o.title_id,
      summary: o.summary,
      status: "open",
      priority: o.priority,
      due_date: null,
      owner: null,
      source: o.source,
    }));
  }
  return [];
}

const TILES = [
  {
    key: "on_track",
    label: "On track this week",
    icon: CheckCircle2,
    barClass: "bg-accent-success",
    iconClass: "text-accent-success",
    countKey: "tickets_on_track_this_week",
    countSuffix: "tickets",
    subLabel: (prod) => prod.this_week_window_label,
  },
  {
    key: "ahead_of",
    label: "Need to get ahead of",
    icon: Clock,
    barClass: "bg-accent-amber",
    iconClass: "text-accent-amber",
    countKey: "tickets_need_to_get_ahead_of",
    countSuffix: "tickets",
    subLabel: (prod) => `${prod.tickets_at_risk_this_week} flagged at risk`,
  },
  {
    key: "closed_yesterday",
    label: "Closed yesterday",
    icon: CheckCircle2,
    barClass: "bg-accent-primary",
    iconClass: "text-accent-primary",
    countKey: "tickets_completed_yesterday",
    countSuffix: "on time",
    subLabel: (prod) => `${prod.tickets_slipped_yesterday} slipped (see brief)`,
  },
  {
    key: "opened_yesterday",
    label: "Opened yesterday",
    icon: PlusCircle,
    barClass: "bg-twok-red",
    iconClass: "text-twok-red",
    countKey: "tickets_opened_yesterday",
    countSuffix: "new tickets",
    subLabel: () => "Self-assigned + vendor inbound",
  },
];

export default function ProductionHealthTiles({ prod, brief }) {
  const [openKey, setOpenKey] = useState(null);

  const activeTile = openKey ? TILES.find((t) => t.key === openKey) : null;
  const activeList = activeTile ? bucketTickets(activeTile.key, prod, brief) : [];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const isOpen = openKey === tile.key;
          const count = prod[tile.countKey];
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => setOpenKey(isOpen ? null : tile.key)}
              className={`panel p-4 relative overflow-hidden text-left transition-all hover:border-ink-300 ${
                isOpen ? "ring-2 ring-twok-red/40 border-twok-red/40" : ""
              }`}
              aria-expanded={isOpen}
            >
              <div className={`absolute top-0 left-0 h-1 w-full ${tile.barClass}`} />
              <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
                <Icon className={`h-3 w-3 ${tile.iconClass}`} />
                {tile.label}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="display text-[32px] font-bold tracking-tight">
                  {count}
                </span>
                <span className="text-[12px] text-ink-500">
                  {tile.countSuffix}
                </span>
              </div>
              <div className="text-[11.5px] text-ink-500 mt-1 flex items-center justify-between">
                <span>{tile.subLabel(prod)}</span>
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-ink-500" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-ink-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {activeTile && (
        <div className="panel p-4 border-twok-red/30 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
              <activeTile.icon className={`h-3 w-3 ${activeTile.iconClass}`} />
              {activeTile.label} · tickets
              <span className="mono ml-1 text-ink-700 normal-case tracking-normal">
                {activeList.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenKey(null)}
              className="text-[11px] text-ink-500 hover:text-ink-900"
            >
              Close
            </button>
          </div>
          {activeList.length === 0 ? (
            <div className="text-[12px] text-ink-400 italic py-2">
              Nothing in this bucket right now.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {activeList.map((t) => {
                const ti = titleFor(t.title_id);
                const href = ticketHref(t);
                const isLate = t.due_date && t.due_date < DEMO_TODAY_ISO;
                return (
                  <li key={t.ticket_id} className="py-2 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      {t.priority && (
                        <Badge
                          tone={
                            t.priority === "P0"
                              ? "red"
                              : t.priority === "P1"
                              ? "amber"
                              : "neutral"
                          }
                          size="xs"
                        >
                          {t.priority}
                        </Badge>
                      )}
                      {!t.priority && t.status === "completed" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent-success shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[12.5px] font-medium text-ink-900">
                            {t.summary}
                          </span>
                          {ti && (
                            <span
                              className="text-[10px] uppercase tracking-wider font-semibold"
                              style={{ color: ti.brand_color }}
                            >
                              {ti.title_name}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          {t.owner && <span>{t.owner}</span>}
                          {t.due_date && (
                            <span
                              className={
                                isLate ? "text-accent-red font-medium" : ""
                              }
                            >
                              {isLate && (
                                <AlertTriangle className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                              )}
                              Due {fmtDate(t.due_date)}
                            </span>
                          )}
                          {t.status && (
                            <span className="text-ink-400">
                              · {t.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                      {href && (
                        <Link
                          href={href}
                          className="text-[11px] mono text-accent-primary hover:underline shrink-0"
                        >
                          {t.ticket_id} →
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
