"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { decisionLog, standup, titles, fmtDate, fmtMoney } from "@/lib/data";
import Badge from "./Badge";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  DollarSign,
  Sparkles,
  BookOpen,
  RotateCcw,
} from "lucide-react";

// -------------------------------------------------------------------
// DecisionLog
//
// Chronological record of every GO / NO-GO / Deferred decision across
// the portfolio. Pending decisions show at the top as the current
// queue; closed decisions scroll below, newest first.
//
// This is the QBR artifact: a single surface that answers "what did
// we decide, when, who decided it, and what happened 30 days later."
// -------------------------------------------------------------------

const OUTCOME_CONFIG = {
  go: { label: "GO", tone: "success", Icon: CheckCircle2 },
  no_go: { label: "NO-GO", tone: "red", Icon: XCircle },
  deferred: { label: "Deferred", tone: "amber", Icon: RotateCcw },
};

const PENDING_STATUS_CONFIG = {
  awaiting_decision: { label: "Awaiting", tone: "amber" },
  held: { label: "On hold", tone: "red" },
  decide_today: { label: "Decide today", tone: "amber" },
};

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

export default function DecisionLog() {
  const [titleFilter, setTitleFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const pendingDecisions = useMemo(() => standup.pending_decisions || [], []);

  const closedDecisions = useMemo(() => {
    return [...decisionLog].sort(
      (a, b) => b.decided_at.localeCompare(a.decided_at)
    );
  }, []);

  const titleOptions = useMemo(() => {
    const ids = new Set([
      ...pendingDecisions.map((d) => d.title_id),
      ...closedDecisions.map((d) => d.title_id),
    ].filter(Boolean));
    return [...ids].map((id) => titleForId(id)).filter(Boolean);
  }, [pendingDecisions, closedDecisions]);

  const filteredClosed = useMemo(() => {
    return closedDecisions.filter((d) => {
      if (titleFilter !== "all" && d.title_id !== titleFilter) return false;
      if (outcomeFilter !== "all" && d.decision_outcome !== outcomeFilter) return false;
      return true;
    });
  }, [closedDecisions, titleFilter, outcomeFilter]);

  const filteredPending = useMemo(() => {
    return pendingDecisions.filter((d) => {
      if (titleFilter !== "all" && d.title_id !== titleFilter) return false;
      return true;
    });
  }, [pendingDecisions, titleFilter]);

  // Total capital committed via GO decisions
  const totalCommitted = useMemo(() => {
    return closedDecisions
      .filter((d) => d.decision_outcome === "go")
      .reduce((sum, d) => sum + (d.tranche_amount_usd || 0), 0);
  }, [closedDecisions]);

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1100px] mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-500 hover:text-accent-primary"
      >
        <ArrowLeft className="h-3 w-3" /> Back to standup
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-accent-primary" />
            NA Integrated Marketing
          </div>
          <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
            Decision Log
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1.5 max-w-xl">
            Every GO, NO-GO, and Deferred across the portfolio — with rationale and
            30-day outcomes. The QBR artifact.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-center">
            <div className="text-[22px] font-bold mono text-ink-900">
              {closedDecisions.length}
            </div>
            <div className="text-[10.5px] text-ink-500 uppercase tracking-wider">
              closed
            </div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-bold mono text-accent-amber">
              {filteredPending.length}
            </div>
            <div className="text-[10.5px] text-ink-500 uppercase tracking-wider">
              pending
            </div>
          </div>
          <div className="text-center">
            <div className="text-[22px] font-bold mono text-accent-success">
              {fmtMoney(totalCommitted)}
            </div>
            <div className="text-[10.5px] text-ink-500 uppercase tracking-wider">
              GO capital
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          className="text-[12px] px-2.5 py-1.5 rounded-lg border border-line bg-white text-ink-900 focus:border-accent-primary focus:outline-none"
        >
          <option value="all">All titles</option>
          {titleOptions.map((t) => (
            <option key={t.title_id} value={t.title_id}>
              {t.title_name}
            </option>
          ))}
        </select>
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="text-[12px] px-2.5 py-1.5 rounded-lg border border-line bg-white text-ink-900 focus:border-accent-primary focus:outline-none"
        >
          <option value="all">All outcomes</option>
          <option value="go">GO</option>
          <option value="no_go">NO-GO</option>
          <option value="deferred">Deferred</option>
        </select>
        {(titleFilter !== "all" || outcomeFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setTitleFilter("all"); setOutcomeFilter("all"); }}
            className="text-[11.5px] text-accent-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Pending decisions */}
      {filteredPending.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-accent-amber" />
            Pending decisions
            <span className="text-ink-500 font-normal">({filteredPending.length})</span>
          </h2>
          <div className="space-y-2">
            {filteredPending.map((d) => {
              const t = titleForId(d.title_id);
              const cfg = PENDING_STATUS_CONFIG[d.status] || { label: d.status, tone: "neutral" };
              const isExpanded = expandedId === d.decision_id;
              return (
                <div
                  key={d.decision_id}
                  className="panel border-l-4 border-l-accent-amber overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(d.decision_id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-ink-100/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {t && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold shrink-0"
                            style={{ color: t.brand_color }}
                          >
                            {t.title_name}
                          </span>
                        )}
                        <span className="text-[13px] font-medium text-ink-900">
                          {d.decision}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{d.decision_owner}</span>
                        <span>·</span>
                        <span className="mono">{fmtDate(d.decision_date)}</span>
                        {d.tranche_amount_usd > 0 && (
                          <>
                            <span>·</span>
                            <span className="mono text-ink-700 font-semibold flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              {(d.tranche_amount_usd / 1000).toFixed(0)}K
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={cfg.tone} size="sm">{cfg.label}</Badge>
                      <ChevronDown
                        className={`h-4 w-4 text-ink-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    </div>
                  </button>
                  {isExpanded && d.blocking_inputs && d.blocking_inputs.length > 0 && (
                    <div className="px-4 pb-4 pt-0 border-t border-line">
                      <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mt-3 mb-1.5">
                        Blocking inputs
                      </div>
                      <ul className="space-y-1">
                        {d.blocking_inputs.map((inp, i) => (
                          <li key={i} className="text-[12.5px] text-ink-700 flex gap-2">
                            <span className="text-ink-400 shrink-0">·</span>
                            {inp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Decision log */}
      <section className="space-y-3">
        <h2 className="section-title flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-accent-primary" />
          Decision log
          <span className="text-ink-500 font-normal">({filteredClosed.length})</span>
        </h2>
        {filteredClosed.length === 0 ? (
          <p className="text-[13px] text-ink-500 italic panel p-5">
            No decisions match the current filters.
          </p>
        ) : (
          <div className="space-y-2">
            {filteredClosed.map((d) => {
              const t = titleForId(d.title_id);
              const cfg = OUTCOME_CONFIG[d.decision_outcome] || OUTCOME_CONFIG.go;
              const isExpanded = expandedId === d.decision_id;
              const borderColor = d.decision_outcome === "go"
                ? "border-l-accent-success"
                : d.decision_outcome === "deferred"
                ? "border-l-accent-amber"
                : "border-l-accent-red";

              return (
                <div
                  key={d.decision_id}
                  className={`panel border-l-4 ${borderColor} overflow-hidden`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(d.decision_id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-ink-100/20 transition-colors"
                  >
                    <cfg.Icon
                      className={`h-4 w-4 shrink-0 ${
                        d.decision_outcome === "go"
                          ? "text-accent-success"
                          : d.decision_outcome === "deferred"
                          ? "text-accent-amber"
                          : "text-accent-red"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {t && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold shrink-0"
                            style={{ color: t.brand_color }}
                          >
                            {t.title_name}
                          </span>
                        )}
                        <span className="text-[13px] font-medium text-ink-900">
                          {d.decision}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{d.decided_by}</span>
                        <span>·</span>
                        <span className="mono">{fmtDate(d.decided_at, { year: true })}</span>
                        {d.tranche_amount_usd > 0 && (
                          <>
                            <span>·</span>
                            <span className="mono text-ink-700 font-semibold flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              {(d.tranche_amount_usd / 1000).toFixed(0)}K
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={cfg.tone} size="sm">{cfg.label}</Badge>
                      <ChevronDown
                        className={`h-4 w-4 text-ink-400 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-line space-y-3">
                      {d.rationale_note && (
                        <div>
                          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mt-3 mb-1">
                            Rationale
                          </div>
                          <p className="text-[12.5px] text-ink-700 leading-relaxed">
                            {d.rationale_note}
                          </p>
                        </div>
                      )}
                      {d.outcome_30d_note && (
                        <div className="rounded-lg bg-accent-primary/5 border border-accent-primary/20 p-3">
                          <div className="text-[10.5px] uppercase tracking-wider text-accent-primary font-semibold mb-1">
                            30-day outcome
                          </div>
                          <p className="text-[12.5px] text-ink-700 leading-relaxed">
                            {d.outcome_30d_note}
                          </p>
                        </div>
                      )}
                      {d.linked_ticket_id && (
                        <div className="text-[11.5px] mono text-ink-500">
                          Ticket: {d.linked_ticket_id}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
