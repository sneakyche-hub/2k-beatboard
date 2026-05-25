"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getTitleStandup,
  getBeatsForTitle,
  getCalendarForTitle,
  getTicketsForTitle,
  getTranscriptsForTitle,
  getSlackForTitle,
  getGmailForTitle,
  getDraftsForTitle,
  getVendorsForTitle,
  fmtMoney,
  fmtDate,
  fmtDateTime,
} from "@/lib/data";
import Badge from "./Badge";
import GanttBar from "./GanttBar";
import Sparkline from "./Sparkline";
import EscalationModal from "./EscalationModal";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  AlertTriangle,
  MessageSquare,
  Mail,
  Video,
  DollarSign,
  Target,
  Briefcase,
  Send,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const STATUS_LABEL = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  delayed: "Delayed",
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "calendar", label: "Production calendar" },
  { key: "tickets", label: "Tickets" },
  { key: "budget", label: "Budget" },
  { key: "kpis", label: "KPIs" },
  { key: "inbox", label: "Inbox" },
];

export default function TitleWorkspace({ title }) {
  const [tab, setTab] = useState("overview");
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [openTranscript, setOpenTranscript] = useState(null);

  const standupEntry = getTitleStandup(title.title_id);
  const beats = getBeatsForTitle(title.title_id);
  const tasks = getCalendarForTitle(title.title_id);
  const tickets = getTicketsForTitle(title.title_id);
  const transcripts = getTranscriptsForTitle(title.title_id);
  const slacks = getSlackForTitle(title.title_id);
  const gmails = getGmailForTitle(title.title_id);
  const drafts = getDraftsForTitle(title.title_id);
  const vendors = getVendorsForTitle(title.title_id);

  const activeDraft = drafts.find((d) => d.draft_id === activeDraftId);

  const pct = Math.round(
    (title.budget_spent_usd / title.budget_committed_usd) * 100
  );

  // Gantt range — auto-fit to title's beats/tasks
  const allDates = [
    ...beats.flatMap((b) => [b.start_date, b.end_date]),
    ...tasks.flatMap((t) => [t.start_date, t.end_date]),
  ].map((d) => new Date(d).getTime());
  const ganttStart =
    allDates.length > 0 ? Math.min(...allDates) : Date.now();
  const ganttEnd = allDates.length > 0 ? Math.max(...allDates) : Date.now();

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/titles"
          className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3 w-3" /> All titles
        </Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span
            className="h-5 w-5 rounded-full shrink-0"
            style={{ backgroundColor: title.brand_color }}
          />
          <h1 className="display text-[28px] md:text-[34px] font-bold tracking-tight">
            {title.title_name}
          </h1>
          <Badge status={title.campaign_status}>
            {STATUS_LABEL[title.campaign_status] || title.campaign_status}
          </Badge>
          <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
            Phase · {title.current_phase.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-[13px] text-ink-500 mt-1">
          Next milestone:{" "}
          <span className="text-ink-900 font-medium">
            {title.next_milestone_name}
          </span>{" "}
          · {fmtDate(title.next_milestone_date, { year: true })}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-line overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-5">
          {standupEntry && (
            <div className="panel p-5">
              <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
                Today's read — Claude
              </div>
              <p className="text-[14px] leading-relaxed">
                {standupEntry.claude_blurb}
              </p>
              {standupEntry.phase_gate_check && (
                <div className="mt-3 flex items-center gap-3 text-[12px] flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-500">
                      Phase gate · {standupEntry.phase_gate_check.kpi_label}:
                    </span>
                    <span className="mono font-semibold">
                      {standupEntry.phase_gate_check.actual}
                    </span>
                    <span className="text-ink-500">
                      / {standupEntry.phase_gate_check.threshold}
                    </span>
                    <Badge
                      status={standupEntry.phase_gate_check.status}
                      size="xs"
                    >
                      {standupEntry.phase_gate_check.status.replace(
                        /_/g,
                        " "
                      )}
                    </Badge>
                  </div>
                  <div className="ml-auto">
                    <Sparkline
                      values={standupEntry.sparkline_values}
                      color={title.brand_color}
                      width={120}
                      height={28}
                    />
                  </div>
                </div>
              )}
              {title.phase_gate_blocker && (
                <div className="mt-3 p-3 rounded-md bg-accent-amber/10 border border-accent-amber/20 text-[12.5px] text-ink-900 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent-amber shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-accent-amber mb-0.5">
                      Phase-gate blocker
                    </div>
                    {title.phase_gate_blocker}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(title.current_phase_actuals).map(([k, v]) => {
              const targetKey = k.includes("_pct")
                ? k.replace("_pct", "_target_pct")
                : k.includes("_daily")
                ? k.replace("_daily", "_target_daily")
                : `${k}_target`;
              const target = title.current_phase_kpis[targetKey];
              return (
                <div key={k} className="kpi-tile">
                  <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold truncate">
                    {k.replace(/_/g, " ")}
                  </div>
                  <div className="display text-[20px] font-bold mt-1">
                    {v == null ? "—" : v.toLocaleString()}
                  </div>
                  {target != null && (
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      Target {target.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vendors */}
          <div className="panel p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" /> Vendors on this title
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {vendors.map((v) => {
                const engagement = v.current_engagements.find(
                  (e) =>
                    beats.some((b) => b.beat_id === e.beat_id) ||
                    true
                );
                return (
                  <div
                    key={v.vendor_id}
                    className="border border-line rounded-lg p-3 hover:border-ink-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-semibold">{v.name}</div>
                      <span className="text-[10px] text-ink-500 mono">
                        {v.active_tickets_count} tickets
                      </span>
                    </div>
                    <div className="text-[11.5px] text-ink-700 mt-0.5">
                      {engagement?.role}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTION CALENDAR */}
      {tab === "calendar" && (
        <div className="space-y-5">
          <div className="panel p-3 overflow-hidden">
            <div className="text-[11px] text-ink-500 px-2 pt-1 pb-2 uppercase tracking-wider font-semibold">
              Beats · {fmtDate(ganttStart)} → {fmtDate(ganttEnd)}
            </div>
            {beats.map((b) => (
              <div
                key={b.beat_id}
                className="grid grid-cols-[180px_1fr] md:grid-cols-[260px_1fr] border-t border-line py-2 items-center"
              >
                <div className="px-2 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">
                    {b.beat_name}
                  </div>
                  <div className="text-[10.5px] text-ink-500 truncate">
                    {b.lead_owner} · {fmtMoney(b.budget_usd)}
                  </div>
                </div>
                <div className="px-2">
                  <GanttBar
                    label={b.status.replace(/_/g, " ")}
                    startDate={b.start_date}
                    endDate={b.end_date}
                    status={b.status}
                    rangeStart={ganttStart}
                    rangeEnd={ganttEnd}
                    brandColor={title.brand_color}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="panel p-3 overflow-hidden">
            <div className="text-[11px] text-ink-500 px-2 pt-1 pb-2 uppercase tracking-wider font-semibold">
              Tasks
            </div>
            {tasks.map((t) => (
              <div
                key={t.task_id}
                className="grid grid-cols-[180px_1fr] md:grid-cols-[260px_1fr] border-t border-line py-2 items-center"
              >
                <div className="px-2 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">
                    {t.task_name}
                  </div>
                  <div className="text-[10.5px] text-ink-500 truncate">
                    {t.owner}
                  </div>
                </div>
                <div className="px-2">
                  <GanttBar
                    label={t.status.replace(/_/g, " ")}
                    startDate={t.start_date}
                    endDate={t.end_date}
                    status={t.status}
                    rangeStart={ganttStart}
                    rangeEnd={ganttEnd}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TICKETS — Kanban */}
      {tab === "tickets" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {["open", "in_progress", "at_risk", "completed"].map((col) => {
            const items = tickets.filter(
              (t) =>
                t.status === col ||
                (col === "in_progress" && t.status === "scheduled") ||
                (col === "at_risk" && t.status === "blocked")
            );
            const labels = {
              open: "Open",
              in_progress: "In progress",
              at_risk: "At risk / blocked",
              completed: "Done",
            };
            return (
              <div key={col} className="panel p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="section-title">{labels[col]}</h3>
                  <span className="text-[11px] text-ink-500 mono">
                    {items.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((t) => (
                    <li
                      key={t.ticket_id}
                      className="border border-line rounded-md p-2.5 hover:border-ink-300 hover:shadow-sm bg-white"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="mono text-[10px] text-ink-500">
                          {t.ticket_id}
                        </span>
                        <Badge status={t.priority} size="xs">
                          {t.priority}
                        </Badge>
                      </div>
                      <div className="text-[12.5px] font-medium mt-1 leading-snug">
                        {t.summary}
                      </div>
                      <div className="text-[10.5px] text-ink-500 mt-1.5 flex items-center justify-between">
                        <span className="truncate">{t.owner}</span>
                        <span className="mono shrink-0 ml-2">
                          {fmtDate(t.due_date)}
                        </span>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="text-[11px] text-ink-400 italic py-1">
                      Nothing here.
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* BUDGET */}
      {tab === "budget" && (
        <div className="space-y-5">
          <div className="panel p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" /> Budget pacing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                  Committed
                </div>
                <div className="display text-[24px] font-bold mt-1">
                  {fmtMoney(title.budget_committed_usd)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                  Spent
                </div>
                <div className="display text-[24px] font-bold mt-1">
                  {fmtMoney(title.budget_spent_usd)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                  Remaining
                </div>
                <div className="display text-[24px] font-bold mt-1">
                  {fmtMoney(title.budget_remaining_usd)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                  Pacing
                </div>
                <div className="display text-[24px] font-bold mt-1 mono">
                  {pct}%
                </div>
              </div>
            </div>
            <div className="h-2 bg-ink-300/40 rounded mt-4 overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${pct}%`,
                  backgroundColor: title.brand_color,
                }}
              />
            </div>
            <div className="mt-3 text-[12px] text-ink-700">
              <span className="font-semibold">Manager track:</span> I track
              spend + invoice flow against committed plan, flag overruns or
              gating decisions up to Davide. I do not authorize spend tranches
              — those are Davide GO/NO-GOs.
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="section-title mb-3">Budget by beat</h3>
            <ul className="divide-y divide-line">
              {beats.map((b) => (
                <li
                  key={b.beat_id}
                  className="py-2.5 flex items-center justify-between gap-3 text-[13px]"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{b.beat_name}</div>
                    <div className="text-[11px] text-ink-500">
                      {b.lead_owner} · {b.status.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="mono text-[12.5px] font-semibold shrink-0">
                    {fmtMoney(b.budget_usd)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KPIs */}
      {tab === "kpis" && (
        <div className="space-y-5">
          <div className="panel p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Target className="h-3.5 w-3.5" /> Phase KPIs vs targets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(title.current_phase_actuals).map(([k, v]) => {
                const targetKey = k.includes("_pct")
                  ? k.replace("_pct", "_target_pct")
                  : k.includes("_daily")
                  ? k.replace("_daily", "_target_daily")
                  : `${k}_target`;
                const target = title.current_phase_kpis[targetKey];
                const meets =
                  v == null || target == null
                    ? null
                    : k.includes("ceiling") || k.includes("cpi")
                    ? v <= target
                    : v >= target;
                return (
                  <div
                    key={k}
                    className="border border-line rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[12px] text-ink-700">
                        {k.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10.5px] text-ink-500 mono">
                        target {target?.toLocaleString() ?? "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="mono font-semibold text-[15px]">
                        {v == null ? "—" : v.toLocaleString()}
                      </div>
                      {meets === true && (
                        <CheckCircle2 className="h-4 w-4 text-accent-success" />
                      )}
                      {meets === false && (
                        <AlertTriangle className="h-4 w-4 text-accent-amber" />
                      )}
                      {meets === null && (
                        <Circle className="h-4 w-4 text-ink-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {standupEntry && (
            <div className="panel p-5">
              <h3 className="section-title mb-3">
                {standupEntry.sparkline_metric_label}
              </h3>
              <Sparkline
                values={standupEntry.sparkline_values}
                color={title.brand_color}
                width={600}
                height={120}
              />
            </div>
          )}
        </div>
      )}

      {/* INBOX */}
      {tab === "inbox" && (
        <div className="space-y-5">
          {/* Drafts */}
          {drafts.length > 0 && (
            <div className="panel p-5">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-accent-violet" /> Claude-drafted
                escalations
              </h3>
              <div className="space-y-2">
                {drafts.map((d) => (
                  <button
                    key={d.draft_id}
                    type="button"
                    onClick={() => setActiveDraftId(d.draft_id)}
                    className="w-full text-left border border-line rounded-md p-3 hover:border-accent-primary hover:bg-accent-primary/[0.03]"
                  >
                    <div className="flex items-center justify-between text-[11px] text-ink-500 uppercase tracking-wider font-semibold">
                      <span>
                        {d.channel} · {d.recipient}
                      </span>
                      <span className="text-accent-primary normal-case tracking-normal">
                        Open
                      </span>
                    </div>
                    <div className="text-[13px] mt-1 line-clamp-2">
                      {d.body.split("\n")[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slack + Gmail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="panel p-5">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" /> Slack
              </h3>
              <ul className="space-y-3">
                {slacks.map((m) => (
                  <li
                    key={m.message_id}
                    className="border border-line rounded-md p-3"
                  >
                    <div className="flex items-center justify-between text-[11px] text-ink-500">
                      <span className="font-semibold text-ink-700">
                        {m.author}
                      </span>
                      <span className="mono">{fmtDateTime(m.timestamp)}</span>
                    </div>
                    <div className="text-[10.5px] text-ink-500 mb-1">
                      {m.channel}
                    </div>
                    <p className="text-[13px] leading-relaxed">{m.text}</p>
                  </li>
                ))}
                {slacks.length === 0 && (
                  <li className="text-[12px] text-ink-400 italic">
                    No Slack threads for this title this week.
                  </li>
                )}
              </ul>
            </div>
            <div className="panel p-5">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Gmail
              </h3>
              <ul className="space-y-3">
                {gmails.map((g) => (
                  <li
                    key={g.thread_id}
                    className="border border-line rounded-md p-3"
                  >
                    <div className="flex items-center justify-between text-[11px] text-ink-500">
                      <span className="font-semibold text-ink-700 truncate">
                        {g.from}
                      </span>
                      <span className="mono">{fmtDateTime(g.timestamp)}</span>
                    </div>
                    <div className="text-[12.5px] font-medium mt-1">
                      {g.subject}
                    </div>
                    <p className="text-[12px] text-ink-700 mt-1">
                      {g.thread_summary}
                    </p>
                  </li>
                ))}
                {gmails.length === 0 && (
                  <li className="text-[12px] text-ink-400 italic">
                    No Gmail threads for this title.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Zoom transcripts */}
          <div className="panel p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Video className="h-3.5 w-3.5" /> Zoom transcripts
            </h3>
            <ul className="space-y-2">
              {transcripts.map((tr) => {
                const isOpen = openTranscript === tr.transcript_id;
                return (
                  <li
                    key={tr.transcript_id}
                    className="border border-line rounded-md"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenTranscript(isOpen ? null : tr.transcript_id)
                      }
                      className="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-base/50"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate">
                          {tr.meeting_title}
                        </div>
                        <div className="text-[11px] text-ink-500">
                          {fmtDate(tr.meeting_date, { year: true })} ·{" "}
                          {tr.duration_minutes} min ·{" "}
                          {tr.extracted_tickets.length} tickets extracted
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-ink-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-line px-3 py-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
                            Transcript ({tr.exchanges.length} exchanges)
                          </div>
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                            {tr.exchanges.map((ex, i) => (
                              <div key={i} className="text-[12.5px]">
                                <span className="font-semibold text-accent-primary">
                                  {ex.speaker}:
                                </span>{" "}
                                <span className="text-ink-700">
                                  {ex.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
                            Claude-extracted tickets
                          </div>
                          <ul className="space-y-2">
                            {tr.extracted_tickets.map((pt) => (
                              <li
                                key={pt.proposed_ticket_id}
                                className="border border-line rounded p-2 text-[12px]"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="mono text-[10px] text-ink-500">
                                    {pt.proposed_ticket_id}
                                  </span>
                                  <Badge status={pt.priority} size="xs">
                                    {pt.priority}
                                  </Badge>
                                </div>
                                <div className="font-medium mt-0.5">
                                  {pt.title}
                                </div>
                                <div className="text-[10.5px] text-ink-500 mt-0.5">
                                  Owner: {pt.owner}
                                  {pt.vendor_owner && ` · ${pt.vendor_owner}`}
                                </div>
                                <div className="text-[11px] text-ink-700 italic mt-1">
                                  "{pt.source_quote}"
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
              {transcripts.length === 0 && (
                <li className="text-[12px] text-ink-400 italic">
                  No transcripts for this title.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <EscalationModal
        draft={activeDraft}
        onClose={() => setActiveDraftId(null)}
      />
    </div>
  );
}
