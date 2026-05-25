"use client";

import { useState } from "react";
import Link from "next/link";
import {
  standup,
  titles,
  tickets,
  escalationDrafts,
  analyticsRollups,
  fmtDate,
} from "@/lib/data";
import Badge from "./Badge";
import KpiCard from "./KpiCard";
import Sparkline from "./Sparkline";
import EscalationModal from "./EscalationModal";
import {
  AlertTriangle,
  CircleDot,
  Send,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Inbox,
  Flag,
  PlusCircle,
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

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

function ticketHref(ticketId) {
  const tk = tickets.find((t) => t.ticket_id === ticketId);
  if (!tk) return null;
  const t = titleForId(tk.title_id);
  return t ? `/titles/${t.franchise_slug}#tickets` : null;
}

export default function DailyStandup() {
  const [activeDraftId, setActiveDraftId] = useState(null);

  const activeDraft = escalationDrafts.find(
    (d) => d.draft_id === activeDraftId
  );

  const k = standup.kpi_top_strip;
  const brief = standup.standup_brief;
  const prod = standup.production_health;

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
            <span className="bg-twok-gold-soft/60 px-1.5 rounded">NA Integrated Marketing</span>{" "}
            daily standup
          </h1>
          <div className="text-[12.5px] text-ink-500 mt-1.5">
            Production-first roll-up. Tickets are the source of truth for deliverables.
          </div>
        </div>
        <Link
          href="/inbox"
          className="text-[12px] text-accent-primary font-medium flex items-center gap-1 hover:underline"
        >
          Open AI Inbox <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Production health hero — 4 tiles */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="panel p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-accent-success" />
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-accent-success" />
            On track this week
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="display text-[32px] font-bold tracking-tight">
              {prod.tickets_on_track_this_week}
            </span>
            <span className="text-[12px] text-ink-500">tickets</span>
          </div>
          <div className="text-[11.5px] text-ink-500 mt-1">
            {prod.this_week_window_label}
          </div>
        </div>

        <div className="panel p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-accent-amber" />
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-accent-amber" />
            Need to get ahead of
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="display text-[32px] font-bold tracking-tight">
              {prod.tickets_need_to_get_ahead_of}
            </span>
            <span className="text-[12px] text-ink-500">tickets</span>
          </div>
          <div className="text-[11.5px] text-ink-500 mt-1">
            {prod.tickets_at_risk_this_week} flagged at risk
          </div>
        </div>

        <div className="panel p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-accent-primary" />
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-accent-primary" />
            Closed yesterday
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="display text-[32px] font-bold tracking-tight">
              {prod.tickets_completed_yesterday}
            </span>
            <span className="text-[12px] text-ink-500">on time</span>
          </div>
          <div className="text-[11.5px] text-ink-500 mt-1">
            {prod.tickets_slipped_yesterday} slipped (see brief)
          </div>
        </div>

        <div className="panel p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-twok-gold" />
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
            <PlusCircle className="h-3 w-3 text-twok-black" />
            Opened yesterday
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="display text-[32px] font-bold tracking-tight">
              {prod.tickets_opened_yesterday}
            </span>
            <span className="text-[12px] text-ink-500">new tickets</span>
          </div>
          <div className="text-[11.5px] text-ink-500 mt-1">
            Self-assigned + vendor inbound
          </div>
        </div>
      </section>

      {/* Standup brief — 3 columns */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tracking */}
        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <Flag className="h-3.5 w-3.5 text-accent-primary" />
            Tracking
          </h2>
          <ul className="space-y-2.5 text-[12.5px] text-ink-900 leading-relaxed">
            {brief.tracking.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink-400 mt-1">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Today's priorities */}
        <div className="panel p-5">
          <h2 className="section-title flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-accent-violet" />
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

        {/* Yesterday + Blockers */}
        <div className="panel p-5 space-y-4">
          <div>
            <h2 className="section-title flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-success" />
              Yesterday close-out
            </h2>
            <p className="text-[12.5px] text-ink-700 leading-relaxed">
              {brief.yesterday_closeout.summary}
            </p>
            {brief.yesterday_closeout.slipped.length > 0 && (
              <div className="mt-2.5 border-l-2 border-accent-red/50 pl-2.5">
                <div className="text-[10.5px] uppercase tracking-wider text-accent-red font-semibold">
                  Slipped
                </div>
                {brief.yesterday_closeout.slipped.map((s) => {
                  const href = ticketHref(s.ticket_id);
                  return (
                    <div key={s.ticket_id} className="mt-1">
                      <div className="text-[12.5px] text-ink-900">
                        {s.summary}
                      </div>
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

          <div className="border-t border-line pt-3">
            <h2 className="section-title flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-accent-red" />
              Blockers
            </h2>
            <ul className="space-y-2 text-[12.5px] text-ink-900">
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
        </div>
      </section>

      {/* New tickets opened yesterday — clickable list */}
      <section className="panel p-5">
        <h2 className="section-title flex items-center gap-2 mb-3">
          <Inbox className="h-3.5 w-3.5 text-twok-black" />
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

      {/* Portfolio health roll-up (compact) */}
      <section className="panel p-4 md:p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent-primary via-twok-gold to-accent-primary" />
        <div className="flex items-start gap-3">
          <div className="h-7 w-7 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
              Portfolio health roll-up · generated by Claude
            </div>
            <p className="text-[13.5px] leading-relaxed mt-1.5 text-ink-700">
              {standup.portfolio_health_summary}
            </p>
          </div>
        </div>
      </section>

      {/* KPI top strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Tickets due today"
          value={k.tickets_due_today}
          hint={`${k.tickets_at_risk_this_week} at risk this week`}
        />
        <KpiCard
          label="Portfolio D30"
          value={`${k.avg_d30_retention_pct}%`}
          trend={k.avg_d30_retention_trend}
          delta={`${k.avg_d30_retention_delta_pp > 0 ? "+" : ""}${
            k.avg_d30_retention_delta_pp
          }pp`}
        />
        <KpiCard
          label="Wishlist velocity / wk"
          value={k.portfolio_wishlist_velocity_weekly.toLocaleString()}
          trend={k.portfolio_wishlist_velocity_trend}
          delta={`+${k.portfolio_wishlist_velocity_delta_pct}%`}
        />
        <KpiCard
          label="Avg review score"
          value={`${k.avg_review_score_pct}%`}
          trend={k.avg_review_score_trend}
          delta={`+${k.avg_review_score_delta_pp}pp`}
        />
        <KpiCard
          label="Budget pacing"
          value={`${k.budget_pacing_spent_pct}%`}
          hint={`Quarter ${k.budget_pacing_quarter_through_pct}% through`}
        />
        <KpiCard
          label="Decisions pending"
          value={analyticsRollups.decisions_pending_director.length}
          hint="Awaiting Davide call"
        />
      </section>

      {/* By title grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">By title</h2>
          <Link
            href="/titles"
            className="text-[11px] text-accent-primary font-medium hover:underline flex items-center gap-1"
          >
            All titles <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {standup.by_title.map((b) => {
            const t = titleForId(b.title_id);
            if (!t) return null;
            return (
              <Link
                key={b.title_id}
                href={`/titles/${t.franchise_slug}`}
                className="panel p-4 hover:shadow-md hover:border-ink-300 transition-all group block"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.brand_color }}
                    />
                    <span className="text-sm font-semibold truncate">
                      {t.title_name}
                    </span>
                  </div>
                  <Badge status={t.campaign_status} size="xs">
                    {STATUS_LABEL[t.campaign_status] || t.campaign_status}
                  </Badge>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-700 mb-3">
                  {b.claude_blurb}
                </p>
                <div className="flex items-center justify-between text-[11px] mt-auto pt-2 border-t border-line">
                  <div>
                    <div className="text-ink-500">
                      {b.phase_gate_check.kpi_label}
                    </div>
                    <div className="mono font-semibold">
                      {b.phase_gate_check.actual}{" "}
                      <span className="text-ink-400 font-normal">
                        / {b.phase_gate_check.threshold}
                      </span>
                    </div>
                  </div>
                  <Sparkline
                    values={b.sparkline_values}
                    color={t.brand_color}
                    width={84}
                    height={26}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top risks + KPI movements */}
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
          <h2 className="section-title flex items-center gap-2 mb-3">
            <CircleDot className="h-3.5 w-3.5 text-accent-primary" />
            KPI movements
          </h2>
          <ul className="space-y-2.5">
            {standup.kpi_movements.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 text-[12.5px]"
              >
                <span className="text-ink-700 truncate">{m.kpi_label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="mono font-semibold">{m.value}</span>
                  <span
                    className={`text-[11px] mono ${
                      m.direction === "up"
                        ? "text-accent-success"
                        : "text-accent-red"
                    }`}
                  >
                    {m.delta}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Suggested escalations strip */}
      <section className="panel p-5">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-accent-violet" />
          Suggested escalations · drafted for review
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {standup.suggested_escalations.map((s) => {
            const draft = escalationDrafts.find(
              (d) => d.draft_id === s.escalation_draft_id
            );
            return (
              <button
                key={s.escalation_draft_id}
                type="button"
                onClick={() => draft && setActiveDraftId(draft.draft_id)}
                className="text-left border border-line rounded-lg p-3 hover:border-accent-primary hover:bg-accent-primary/[0.03] transition-all"
              >
                <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
                  {s.channel} · {s.recipient}
                </div>
                <div className="text-[13px] font-medium mt-1.5 text-ink-900">
                  {s.summary}
                </div>
                <div className="text-[11px] text-accent-primary mt-2 flex items-center gap-1">
                  Open draft <ArrowUpRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <EscalationModal
        draft={activeDraft}
        onClose={() => setActiveDraftId(null)}
      />

      <footer className="text-[11px] text-ink-500 pt-4 pb-2 text-center">
        Demo data · 2K BeatBoard prototype · built with Claude Code
      </footer>
    </div>
  );
}
