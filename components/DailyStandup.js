"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  standup,
  titles,
  tickets,
  escalationDrafts,
  beats,
  getBeat,
  fmtDate,
  buildDeltaItems,
  buildSprintCadence,
  inboxHrefForTicket,
  inboxHrefForTitle,
} from "@/lib/data";
import Badge from "./Badge";
import EscalationModal from "./EscalationModal";
import BudgetPanel from "./BudgetPanel";
import GoNoGoChecklist from "./GoNoGoChecklist";
import ProductionHealthTiles from "./ProductionHealthTiles";
import PortfolioHealthGrid from "./PortfolioHealthGrid";
import CashflowTimeline from "./CashflowTimeline";
import {
  AlertTriangle,
  Send,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Inbox,
  Phone,
  ListTodo,
  CornerDownRight,
  Gauge,
  FileText,
  Zap,
  ClipboardCheck,
  CalendarRange,
  Ban,
} from "lucide-react";

const STATUS_LABEL = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  delayed: "Delayed",
};

const SEVERITY_TONE = {
  high: "red",
  medium: "amber",
  low: "neutral",
};

const DECISION_STATUS_LABEL = {
  awaiting_decision: "Awaiting",
  held: "Held",
  decide_today: "Decide today",
  cleared: "Cleared",
  on_track: "On track",
};

const DECISION_STATUS_TONE = {
  awaiting_decision: "amber",
  held: "red",
  decide_today: "amber",
  cleared: "success",
  on_track: "success",
};

const PREP_TONE = {
  ready: { label: "Prep ready", tone: "success" },
  outstanding: { label: "Prep outstanding", tone: "amber" },
  blocked: { label: "Prep blocked", tone: "red" },
};

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

function ticketHref(ticketId) {
  if (!ticketId) return null;
  const tk = tickets.find((t) => t.ticket_id === ticketId);
  if (!tk) return null;
  const t = titleForId(tk.title_id);
  return t ? `/titles/${t.franchise_slug}#tickets` : null;
}

// -------------------------------------------------------------------
// SprintCadencePanel (#6)
//
// Frames the week like a sprint: what we committed and finished, what's
// still due this week, and what carried over (overdue). Derived from
// each ticket's due_date + status via buildSprintCadence(), so it stays
// in sync with the board with no separate sprint state to maintain.
// -------------------------------------------------------------------
function CadenceColumn({ label, tone, tickets: items }) {
  const headTone =
    tone === "success"
      ? "text-accent-success"
      : tone === "amber"
      ? "text-accent-amber"
      : tone === "red"
      ? "text-accent-red"
      : "text-ink-500";
  const shown = items.slice(0, 6);
  const rest = items.length - shown.length;
  return (
    <div className="border border-line rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] uppercase tracking-wider font-semibold ${headTone}`}>
          {label}
        </span>
        <span className="text-[12px] mono font-bold text-ink-900">
          {items.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {shown.map((t) => {
          const href = ticketHref(t.ticket_id);
          const title = titleForId(t.title_id);
          const row = (
            <div className="flex items-start gap-2">
              <Badge status={t.priority} size="xs">
                {t.priority}
              </Badge>
              <span className="text-[11.5px] leading-snug flex-1 min-w-0">
                {t.summary}
              </span>
              {title && (
                <span
                  className="h-2 w-2 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: title.brand_color }}
                  title={title.title_name}
                />
              )}
            </div>
          );
          return (
            <li key={t.ticket_id}>
              {href ? (
                <Link
                  href={href}
                  className="block rounded-md p-1.5 -mx-1.5 hover:bg-base/70"
                >
                  {row}
                </Link>
              ) : (
                <div className="p-1.5">{row}</div>
              )}
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="text-[11px] text-ink-400 italic">Nothing here.</li>
        )}
        {rest > 0 && (
          <li className="text-[11px] text-ink-500 pt-0.5">+{rest} more</li>
        )}
      </ul>
    </div>
  );
}

function SprintCadencePanel() {
  const c = buildSprintCadence();
  const pct = c.completionPct ?? 0;
  const barTone =
    pct >= 70 ? "bg-accent-success" : pct >= 40 ? "bg-accent-amber" : "bg-accent-red";

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2 mb-1">
        <CalendarRange className="h-3.5 w-3.5 text-accent-primary" />
        <h2 className="section-title">This week&rsquo;s cadence</h2>
        <span className="text-[10.5px] mono text-ink-500 font-normal ml-1">
          {fmtDate(c.startISO)}–{fmtDate(c.endISO)}
        </span>
        {c.blockedCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red text-[10.5px] font-medium ml-auto">
            <Ban className="h-2.5 w-2.5" />
            {c.blockedCount} blocked
          </span>
        )}
      </div>

      {/* Completion bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1">
          <span>
            {c.doneThisWeek.length} of {c.committed} committed tickets done
          </span>
          <span className="mono">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink-300/30 overflow-hidden">
          <div className={`h-full ${barTone}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CadenceColumn
          label="Done this week"
          tone="success"
          tickets={c.doneThisWeek}
        />
        <CadenceColumn
          label="Due this week"
          tone="amber"
          tickets={c.dueThisWeek}
        />
        <CadenceColumn
          label="Carried over"
          tone="red"
          tickets={c.carryover}
        />
      </div>

      <div className="mt-3 text-right">
        <Link
          href="/tickets"
          className="text-[11px] mono text-accent-primary hover:underline"
        >
          Open portfolio board →
        </Link>
      </div>
    </section>
  );
}

export default function DailyStandup() {
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [activeChecklistBeatId, setActiveChecklistBeatId] = useState(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const activeDraft = escalationDrafts.find(
    (d) => d.draft_id === activeDraftId
  );
  const activeChecklistBeat = activeChecklistBeatId
    ? getBeat(activeChecklistBeatId)
    : null;
  const activeChecklistTitle = activeChecklistBeat
    ? titleForId(activeChecklistBeat.title_id)
    : null;

  const brief = standup.standup_brief;
  const prod = standup.production_health;
  const burn = standup.active_campaign_burn;
  const decisions = standup.pending_decisions || [];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-accent-primary" />
            Daily Standup · {fmtDate(standup.standup_date, { year: true })}
          </div>
          <h1 className="display text-[28px] md:text-[34px] font-bold tracking-tight mt-1">
            <span className="bg-twok-red/15 px-1.5 rounded">NA Integrated Marketing</span>{" "}
            daily standup
          </h1>
          <div className="text-[12.5px] text-ink-500 mt-1.5">
            Operations-first roll-up. Tickets are the source of truth. KPI tracking lives in{" "}
            <Link href="/kpis" className="text-accent-primary hover:underline font-medium">
              KPIs
            </Link>
            .
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/brief"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-twok-red text-white text-[12px] font-semibold hover:bg-twok-red-deep transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Shareable Daily Brief
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          <Link
            href="/inbox"
            className="text-[12px] text-accent-primary font-medium flex items-center gap-1 hover:underline"
          >
            Open AI Inbox <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Needs attention — pre-computed delta strip */}
      <DeltaStrip />

      {/* Production health hero — 4 expandable tiles */}
      <ProductionHealthTiles prod={prod} brief={brief} />

      {/* Today's agenda — Calls → Priorities → Follow-ups */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's calls */}
        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <Phone className="h-3.5 w-3.5 text-accent-primary" />
            Today's calls
            <span className="text-[10.5px] mono text-ink-500 font-normal ml-1">
              {(brief.today_calls || []).length}
            </span>
          </h2>
          <ul className="space-y-3">
            {(brief.today_calls || []).map((c, i) => {
              const prep = PREP_TONE[c.prep_status] || PREP_TONE.outstanding;
              const href = ticketHref(c.linked_ticket_id);
              return (
                <li
                  key={i}
                  className="border-l-2 border-accent-primary/40 pl-2.5 py-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="mono text-[11.5px] font-semibold text-ink-900">
                      {c.time_label}
                    </span>
                    <Badge tone={prep.tone} size="xs">
                      {prep.label}
                    </Badge>
                  </div>
                  <div className="text-[12.5px] font-medium text-ink-900 mt-0.5 leading-snug">
                    {c.title}
                  </div>
                  {c.topic && (
                    <div className="text-[11.5px] text-ink-700 mt-0.5 leading-relaxed">
                      {c.topic}
                    </div>
                  )}
                  {c.prep_note && (
                    <div className="text-[11px] text-ink-500 mt-0.5 italic">
                      {c.prep_note}
                    </div>
                  )}
                  {href && (
                    <Link
                      href={href}
                      className="text-[11px] mono text-accent-primary hover:underline mt-1 inline-block"
                    >
                      {c.linked_ticket_id} →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Today's priorities */}
        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <ListTodo className="h-3.5 w-3.5 text-accent-violet" />
            Today's priorities
          </h2>
          <ul className="space-y-3">
            {brief.today_priorities.map((p, i) => {
              const href = ticketHref(p.linked_ticket_id);
              return (
                <li
                  key={i}
                  className="border-l-2 border-accent-violet/40 pl-2.5 py-0.5"
                >
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
                    {p.owner}
                  </div>
                  <div className="text-[12.5px] text-ink-900 leading-relaxed mt-0.5">
                    {p.task}
                  </div>
                  {href && (
                    <Link
                      href={href}
                      className="text-[11px] mono text-accent-primary hover:underline mt-1 inline-block"
                    >
                      {p.linked_ticket_id} →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Today's follow-ups */}
        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <CornerDownRight className="h-3.5 w-3.5 text-twok-red" />
            Today's follow-ups
            <span className="text-[10.5px] mono text-ink-500 font-normal ml-1">
              {(brief.today_followups || []).length}
            </span>
          </h2>
          <ul className="space-y-3">
            {(brief.today_followups || []).map((f, i) => {
              const href = ticketHref(f.linked_ticket_id);
              return (
                <li
                  key={i}
                  className="border-l-2 border-twok-red pl-2.5 py-0.5"
                >
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
                    To {f.owed_to}
                  </div>
                  <div className="text-[12.5px] text-ink-900 leading-relaxed mt-0.5">
                    {f.what}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      Promised: <span className="text-ink-700">{f.promised_for}</span>
                    </span>
                    {href && (
                      <Link
                        href={href}
                        className="mono text-accent-primary hover:underline"
                      >
                        {f.linked_ticket_id} →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Pending decisions — GO/NO-GO + sign-off queue */}
      {decisions.length > 0 && (
        <section className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <Gauge className="h-3.5 w-3.5 text-accent-amber" />
            Pending decisions
            <span className="text-[10.5px] mono text-ink-500 font-normal ml-1">
              {decisions.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {decisions.map((d) => {
              const t = titleForId(d.title_id);
              const href = ticketHref(d.linked_ticket_id);
              const tone = DECISION_STATUS_TONE[d.status] || "neutral";
              return (
                <div
                  key={d.decision_id}
                  className="border border-line rounded-lg p-3.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
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
                        {d.decision}
                      </div>
                    </div>
                    <Badge tone={tone} size="xs">
                      {DECISION_STATUS_LABEL[d.status] || d.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] text-ink-500 flex-wrap mt-1">
                    <span>
                      Owner: <span className="text-ink-700 font-medium">{d.decision_owner}</span>
                    </span>
                    <span>
                      By: <span className="mono text-ink-700">{fmtDate(d.decision_date)}</span>
                    </span>
                    {d.tranche_amount_usd > 0 && (
                      <span>
                        Tranche:{" "}
                        <span className="mono text-ink-700">
                          ${(d.tranche_amount_usd / 1000).toFixed(0)}K
                        </span>
                      </span>
                    )}
                  </div>
                  {d.blocking_inputs && d.blocking_inputs.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11.5px] text-ink-700">
                      {d.blocking_inputs.map((bi, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-ink-400 mt-0.5">·</span>
                          <span>{bi}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-line flex-wrap">
                    {d.linked_beat_id && (
                      <button
                        type="button"
                        onClick={() => setActiveChecklistBeatId(d.linked_beat_id)}
                        className="text-[11.5px] text-accent-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        View GO/NO-GO checklist <ArrowUpRight className="h-3 w-3" />
                      </button>
                    )}
                    <Link
                      href={
                        (d.linked_ticket_id &&
                          inboxHrefForTicket(d.linked_ticket_id)) ||
                        inboxHrefForTitle(d.title_id)
                      }
                      className="text-[11.5px] text-ink-600 font-medium hover:text-accent-primary hover:underline inline-flex items-center gap-1"
                    >
                      Trace to source signal <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    {href && (
                      <Link
                        href={href}
                        className="text-[11px] mono text-ink-500 hover:text-accent-primary hover:underline"
                      >
                        {d.linked_ticket_id} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Yesterday + Blockers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent-success" />
            Yesterday close-out
          </h2>
          <p className="text-[12.5px] text-ink-700 leading-relaxed">
            {brief.yesterday_closeout.summary}
          </p>
          {brief.yesterday_closeout.slipped.length > 0 && (
            <div className="mt-3 border-l-2 border-accent-red/50 pl-2.5">
              <div className="text-[10.5px] uppercase tracking-wider text-accent-red font-semibold">
                Slipped
              </div>
              {brief.yesterday_closeout.slipped.map((s) => {
                const href = ticketHref(s.ticket_id);
                return (
                  <div key={s.ticket_id} className="mt-1">
                    <div className="text-[12.5px] text-ink-900">{s.summary}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      {s.reason} · now due {fmtDate(s.now_due)}
                    </div>
                    {href && (
                      <Link
                        href={href}
                        className="text-[11px] mono text-accent-primary hover:underline"
                      >
                        {s.ticket_id} →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {(brief.yesterday_closeout.completed || []).length > 0 && (
            <div className="mt-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setClosedOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left group"
                aria-expanded={closedOpen}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-accent-success" />
                  <span className="text-[10.5px] uppercase tracking-wider text-accent-success font-semibold">
                    Closed yesterday
                  </span>
                  <span className="text-[10.5px] mono text-ink-500 font-normal">
                    {brief.yesterday_closeout.completed.length}
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-ink-400 group-hover:text-ink-700 transition-transform ${
                    closedOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {closedOpen && (
                <ul className="mt-2 space-y-1.5">
                  {brief.yesterday_closeout.completed.map((c) => {
                    const href = ticketHref(c.ticket_id);
                    const t = titleForId(c.title_id);
                    return (
                      <li
                        key={c.ticket_id}
                        className="flex items-start gap-2 text-[12px] leading-snug"
                      >
                        <CheckCircle2 className="h-3 w-3 text-accent-success/70 mt-[3px] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {t && (
                              <span
                                className="text-[9.5px] uppercase tracking-wider font-semibold"
                                style={{ color: t.brand_color }}
                              >
                                {t.title_name}
                              </span>
                            )}
                            <span className="text-ink-700">{c.summary}</span>
                          </div>
                        </div>
                        {href && (
                          <Link
                            href={href}
                            className="text-[10.5px] mono text-accent-primary hover:underline shrink-0"
                          >
                            {c.ticket_id} →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <AlertTriangle className="h-3.5 w-3.5 text-accent-red" />
            Blockers
          </h2>
          <ul className="space-y-2.5 text-[12.5px] text-ink-900">
            {brief.blockers.map((b, i) => {
              const t = titleForId(b.title_id);
              return (
                <li key={i} className="leading-relaxed">
                  {t && (
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold mr-1.5"
                      style={{ color: t.brand_color }}
                    >
                      {t.title_name}
                    </span>
                  )}
                  <span>{b.blocker}</span>
                  <div className="text-[11px] text-ink-500 mt-0.5">
                    Needs {b.needed_from} by {fmtDate(b.by)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* New tickets opened yesterday */}
      <section className="panel p-5">
        <h2 className="section-title flex items-center gap-2 mb-3">
          <Inbox className="h-3.5 w-3.5 text-twok-red" />
          New tickets opened yesterday
          <span className="text-[10.5px] mono text-ink-500 font-normal ml-1">
            {brief.yesterday_closeout.opened_yesterday.length}
          </span>
        </h2>
        <ul className="divide-y divide-line">
          {brief.yesterday_closeout.opened_yesterday.map((o) => {
            const href = ticketHref(o.ticket_id);
            const t = titleForId(o.title_id);
            return (
              <li key={o.ticket_id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Badge tone={o.priority === "P1" ? "amber" : "neutral"} size="xs">
                    {o.priority}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-ink-900">
                        {o.summary}
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
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      Source: {o.source.replace(/_/g, " ")}
                    </div>
                  </div>
                  {href && (
                    <Link
                      href={href}
                      className="text-[11px] mono text-accent-primary hover:underline shrink-0"
                    >
                      {o.ticket_id} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* #6 — Sprint cadence: committed / done / carried over this week */}
      <SprintCadencePanel />

      {/* Portfolio health roll-up — structured by status + per-title cards */}
      <PortfolioHealthGrid summary={standup.portfolio_health_summary} />

      {/* Execution flags + suggested escalations */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel p-5">
          {(() => {
            const execRisks = (standup.top_risks || []).filter(
              (r) => r.flag_type !== "kpi"
            );
            const kpiRiskCount = (standup.top_risks || []).filter(
              (r) => r.flag_type === "kpi"
            ).length;
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-title flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-accent-amber" />
                    Execution flags
                  </h2>
                  <span className="text-[11px] text-ink-500">
                    {execRisks.length} this week
                  </span>
                </div>
                <ul className="divide-y divide-line">
                  {execRisks.map((r) => {
                    const draft = escalationDrafts.find(
                      (d) => d.draft_id === r.escalation_draft_id
                    );
                    const t = titleForId(r.title_id);
                    return (
                      <li key={r.risk_id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Badge tone={SEVERITY_TONE[r.severity]} size="xs">
                            {r.severity}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[13.5px] font-semibold">
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
                              <span className="text-[9.5px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-500">
                                {r.flag_type}
                              </span>
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
                                View Claude-drafted {draft.channel} to{" "}
                                {draft.recipient}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {kpiRiskCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                    <p className="text-[11.5px] text-ink-500">
                      <span className="font-semibold text-ink-700">{kpiRiskCount} KPI signal{kpiRiskCount > 1 ? "s" : ""}</span> filtered out — metric flags live in KPIs, not the standup.
                    </p>
                    <Link
                      href="/kpis"
                      className="inline-flex items-center gap-1 text-[11.5px] text-accent-primary font-medium hover:underline shrink-0 ml-3"
                    >
                      View KPI alerts <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="panel p-5">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Send className="h-3.5 w-3.5 text-accent-violet" />
            Suggested escalations
          </h2>
          <div className="space-y-2.5">
            {standup.suggested_escalations.map((s) => {
              const draft = escalationDrafts.find(
                (d) => d.draft_id === s.escalation_draft_id
              );
              return (
                <button
                  key={s.escalation_draft_id}
                  type="button"
                  onClick={() => draft && setActiveDraftId(draft.draft_id)}
                  className="text-left border border-line rounded-lg p-3 hover:border-accent-primary hover:bg-accent-primary/[0.03] transition-all w-full block"
                >
                  <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
                    {s.channel} · {s.recipient}
                  </div>
                  <div className="text-[12.5px] font-medium mt-1 text-ink-900">
                    {s.summary}
                  </div>
                  <div className="text-[11px] text-accent-primary mt-1.5 flex items-center gap-1">
                    Open draft <ArrowUpRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Budget · moved to bottom per PM feedback. Burn first, cashflow second. */}
      {burn && <BudgetPanel burn={burn} />}
      <CashflowTimeline />

      {/* Quick links footer */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/calendar"
          className="panel p-4 hover:border-ink-300 transition-all group flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
              Calendar
            </div>
            <div className="text-[13.5px] font-semibold mt-1">
              Campaign lifecycle view
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-accent-primary" />
        </Link>
        <Link
          href="/titles"
          className="panel p-4 hover:border-ink-300 transition-all group flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
              Titles
            </div>
            <div className="text-[13.5px] font-semibold mt-1">
              Per-title workspaces
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-accent-primary" />
        </Link>
        <Link
          href="/kpis"
          className="panel p-4 hover:border-ink-300 transition-all group flex items-center justify-between"
        >
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
              KPIs
            </div>
            <div className="text-[13.5px] font-semibold mt-1">
              By-franchise KPI tracker
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-accent-primary" />
        </Link>
      </section>

      <EscalationModal
        draft={activeDraft}
        onClose={() => setActiveDraftId(null)}
      />
      <GoNoGoChecklist
        beat={activeChecklistBeat}
        titleColor={activeChecklistTitle?.brand_color}
        onClose={() => setActiveChecklistBeatId(null)}
      />

      <footer className="text-[11px] text-ink-500 pt-4 pb-2 text-center">
        Demo data · 2K BeatBoard prototype · built with Claude Code
      </footer>
    </div>
  );
}

// -------------------------------------------------------------------
// DeltaStrip — "Needs attention" surface on the homepage.
//
// Computes production signals from buildDeltaItems() (Asset Lock
// stalls, decisions due today, at-risk/delayed beats). Items carry
// a "New" badge on first view; localStorage tracks which items have
// been acknowledged so repeat visits are clean. "Mark all seen"
// clears the badges without hiding the signals — the signals stay
// surfaced as long as the underlying condition exists.
// -------------------------------------------------------------------
function DeltaStrip() {
  const [seenIds, setSeenIds] = useState(new Set());
  const [hydrated, setHydrated] = useState(false);

  const items = buildDeltaItems();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("beatboard:delta:seen");
      if (raw) setSeenIds(new Set(JSON.parse(raw)));
    } catch {}
    setHydrated(true);
  }, []);

  const markAllSeen = () => {
    const next = new Set(items.map((i) => i.id));
    setSeenIds(next);
    try {
      window.localStorage.setItem("beatboard:delta:seen", JSON.stringify([...next]));
    } catch {}
  };

  const unseenCount = hydrated ? items.filter((i) => !seenIds.has(i.id)).length : 0;

  if (items.length === 0) return null;

  return (
    <section className="panel border-l-4 border-l-twok-red p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-[12px] font-semibold flex items-center gap-2 text-ink-700">
          <Zap className="h-3.5 w-3.5 text-twok-red" />
          Needs attention
          {unseenCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-twok-red text-white text-[9px] font-bold">
              {unseenCount}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {unseenCount > 0 && (
            <button
              type="button"
              onClick={markAllSeen}
              className="text-[11px] text-accent-primary hover:underline"
            >
              Mark all seen
            </button>
          )}
          <Link
            href="/decisions"
            className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-accent-primary"
          >
            <ClipboardCheck className="h-3 w-3" />
            Decision log
          </Link>
        </div>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => {
          const isSeen = hydrated && seenIds.has(item.id);
          const t = titles.find((ti) => ti.title_id === item.title_id);
          const rowClass = `flex items-baseline gap-2.5 py-2 text-[13px] transition-opacity ${
            isSeen ? "opacity-40" : ""
          }`;
          const inner = (
            <>
              <span
                className={`shrink-0 text-[9.5px] font-bold mono px-1.5 py-0.5 rounded ${
                  item.priority === "P0"
                    ? "bg-accent-red/10 text-accent-red"
                    : "bg-accent-amber/10 text-accent-amber"
                }`}
              >
                {item.priority}
              </span>
              {t && (
                <span
                  className="text-[10px] uppercase tracking-wider font-bold shrink-0"
                  style={{ color: t.brand_color }}
                >
                  {t.title_name}
                </span>
              )}
              <span className={`min-w-0 flex-1 ${isSeen ? "text-ink-700" : "text-ink-900"}`}>
                {item.headline}
              </span>
              <span className="text-[11px] text-ink-500 shrink-0 hidden sm:inline truncate max-w-[260px]">
                {item.detail}
              </span>
              {!isSeen && hydrated && (
                <span className="text-[9px] uppercase font-bold text-accent-success shrink-0">
                  New
                </span>
              )}
              {item.href && (
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-400 shrink-0 group-hover:text-accent-primary" />
              )}
            </>
          );
          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              title="Trace to source signal in AI Inbox"
              className={`group ${rowClass} -mx-2 px-2 rounded-md hover:bg-base/70`}
            >
              {inner}
            </Link>
          ) : (
            <div key={item.id} className={rowClass}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
