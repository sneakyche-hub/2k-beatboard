"use client";

import { useState } from "react";
import Link from "next/link";
import {
  standup,
  titles,
  tickets,
  escalationDrafts,
  beats,
  getBeat,
  fmtDate,
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
  CheckCircle2,
  Inbox,
  Phone,
  ListTodo,
  CornerDownRight,
  Gauge,
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

export default function DailyStandup() {
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [activeChecklistBeatId, setActiveChecklistBeatId] = useState(null);

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
        <Link
          href="/inbox"
          className="text-[12px] text-accent-primary font-medium flex items-center gap-1 hover:underline"
        >
          Open AI Inbox <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

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
                  <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-line">
                    {d.linked_beat_id && (
                      <button
                        type="button"
                        onClick={() => setActiveChecklistBeatId(d.linked_beat_id)}
                        className="text-[11.5px] text-accent-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        View GO/NO-GO checklist <ArrowUpRight className="h-3 w-3" />
                      </button>
                    )}
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

      {/* Portfolio health roll-up — structured by status + per-title cards */}
      <PortfolioHealthGrid summary={standup.portfolio_health_summary} />

      {/* Top risks + suggested escalations */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-accent-amber" />
              Top risks · what I'm flagging up
            </h2>
            <span className="text-[11px] text-ink-500">
              {standup.top_risks.length} this week
            </span>
          </div>
          <ul className="divide-y divide-line">
            {standup.top_risks.map((r) => {
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
