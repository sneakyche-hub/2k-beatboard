"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  FileText,
  Clock,
  User,
  Flag,
  X,
  Wrench,
  Zap,
  TrendingDown,
  List,
  CalendarDays,
  CheckCircle2,
  Circle,
  Paperclip,
} from "lucide-react";
import { fmtDate, fmtMoney, DEMO_TODAY_ISO } from "@/lib/data";

// ─── Operational category taxonomy ────────────────────────────────────────────
// Maps task_type → production / execution / budget / kpi
// Production = tangible deliverables, assets, vendor activations
// Execution  = operational activities, platform actions, meetings
// Budget     = financial gates, spend decisions, legal
// KPI        = measurement, analysis, reporting

const TASK_TYPE_CAT = {
  creator_activation: "production",
  asset_delivery: "production",
  asset_publish: "production",
  creator_brief_revision: "production",
  vendor_activation: "production",
  vendor_brief: "production",
  creative_dev: "production",
  comms_draft: "production",
  product_launch: "production",
  event_prep: "production",
  external_dependency: "production",

  creator_quest: "execution",
  vendor_deliverable: "execution",
  earned_media: "execution",
  platform_update: "execution",
  platform_event: "execution",
  community_event: "execution",
  creator_seeding: "execution",
  planning_sync: "execution",
  internal_meeting: "execution",
  process_audit: "execution",

  decision_gate: "budget",
  review_gate: "budget",
  paid_media: "budget",
  paid_media_replan: "budget",
  legal_gate: "budget",

  measurement: "kpi",
  reporting: "kpi",
  analysis: "kpi",
  seo_milestone: "kpi",
  planning_doc: "kpi",
};

const CAT = {
  production: {
    label: "Production",
    Icon: Wrench,
    chip: "bg-red-50 text-red-700 border border-red-200",
    chipSolid: "bg-red-500",
    header: "text-red-700",
    section: "border-red-200 bg-red-50/30",
  },
  execution: {
    label: "Execution",
    Icon: Zap,
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    chipSolid: "bg-emerald-500",
    header: "text-emerald-700",
    section: "border-emerald-200 bg-emerald-50/30",
  },
  budget: {
    label: "Budget",
    Icon: DollarSign,
    chip: "bg-amber-50 text-amber-700 border border-amber-200",
    chipSolid: "bg-amber-500",
    header: "text-amber-700",
    section: "border-amber-200 bg-amber-50/30",
  },
  kpi: {
    label: "KPI / Analysis",
    Icon: TrendingDown,
    chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    chipSolid: "bg-indigo-500",
    header: "text-indigo-700",
    section: "border-indigo-200 bg-indigo-50/30",
  },
};

const CAT_ORDER = ["production", "execution", "budget", "kpi"];

const STATUS_STYLE = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  scheduled: "bg-slate-50 text-slate-600 border-slate-200",
  at_risk: "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
  delayed: "bg-red-50 text-red-700 border-red-200",
  planning: "bg-slate-50 text-slate-500 border-slate-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

const PRIORITY_STYLE = {
  P0: "text-red-600 bg-red-50 border-red-200",
  P1: "text-amber-600 bg-amber-50 border-amber-200",
  P2: "text-slate-500 bg-slate-50 border-slate-200",
};

const TASK_TYPE_LABEL = {
  creator_activation: "Creator activation",
  asset_delivery: "Asset delivery",
  asset_publish: "Asset publish",
  creator_brief_revision: "Brief revision",
  vendor_activation: "Vendor activation",
  vendor_brief: "Vendor brief",
  creative_dev: "Creative dev",
  comms_draft: "Comms draft",
  product_launch: "Product launch",
  event_prep: "Event prep",
  external_dependency: "External dep",
  creator_quest: "Creator quest",
  vendor_deliverable: "Vendor deliverable",
  earned_media: "Earned media",
  platform_update: "Platform update",
  platform_event: "Platform event",
  community_event: "Community event",
  creator_seeding: "Creator seeding",
  planning_sync: "Planning sync",
  internal_meeting: "Internal meeting",
  process_audit: "Process audit",
  decision_gate: "Decision gate",
  review_gate: "Review gate",
  paid_media: "Paid media",
  paid_media_replan: "Paid replan",
  legal_gate: "Legal gate",
  measurement: "Measurement",
  reporting: "Reporting",
  analysis: "Analysis",
  seo_milestone: "SEO milestone",
  planning_doc: "Planning doc",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DEMO_TODAY = new Date(DEMO_TODAY_ISO + "T00:00:00Z");
const TODAY_ISO = DEMO_TODAY_ISO;

function parseISO(iso) {
  return new Date(iso + "T00:00:00Z");
}

function daysBetween(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}

function generateCalendarWeeks(year, month) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const startDow = firstDay.getUTCDay();
  const totalDays = lastDay.getUTCDate();

  const days = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month, -i));
    days.push({ date: d, iso: d.toISOString().slice(0, 10), inMonth: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(Date.UTC(year, month, d));
    days.push({ date: dt, iso: dt.toISOString().slice(0, 10), inMonth: true });
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    const next = new Date(last);
    next.setUTCDate(next.getUTCDate() + 1);
    days.push({ date: next, iso: next.toISOString().slice(0, 10), inMonth: false });
  }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function monthLabel(year, month) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function taskCat(task) {
  return TASK_TYPE_CAT[task.task_type] || "execution";
}

function isAtRisk(task) {
  return task.status === "at_risk" || task.status === "blocked" || task.status === "delayed";
}

function jiraUrl(ticketId) {
  return `https://2kgames.atlassian.net/browse/${ticketId}`;
}

// Build day-key → sorted tasks index (start_date only)
function buildDayIndex(tasks) {
  const idx = {};
  for (const t of tasks) {
    if (!idx[t.start_date]) idx[t.start_date] = [];
    idx[t.start_date].push(t);
  }
  for (const k of Object.keys(idx)) {
    idx[k].sort((a, b) => {
      const rA = isAtRisk(a) ? 0 : 1;
      const rB = isAtRisk(b) ? 0 : 1;
      if (rA !== rB) return rA - rB;
      const pA = a.priority === "P0" ? 0 : a.priority === "P1" ? 1 : 2;
      const pB = b.priority === "P0" ? 0 : b.priority === "P1" ? 1 : 2;
      if (pA !== pB) return pA - pB;
      return CAT_ORDER.indexOf(taskCat(a)) - CAT_ORDER.indexOf(taskCat(b));
    });
  }
  return idx;
}

// ─── Micro components ─────────────────────────────────────────────────────────

function CatChip({ cat, size = "sm" }) {
  const c = CAT[cat];
  if (!c) return null;
  const Icon = c.Icon;
  const sz = size === "xs" ? "text-[9px] px-1 py-0.5 gap-0.5" : "text-[10px] px-1.5 py-0.5 gap-1";
  const ic = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span className={`inline-flex items-center rounded font-semibold shrink-0 ${c.chip} ${sz}`}>
      <Icon className={ic} />
      {c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.scheduled;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9.5px] font-medium ${s}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PriBadge({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.P2;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9.5px] font-bold ${s}`}>
      {priority}
    </span>
  );
}

// ─── Event chip (calendar cell) ───────────────────────────────────────────────

function EventChip({ task, onClick }) {
  const cat = taskCat(task);
  const c = CAT[cat];
  const risk = isAtRisk(task);
  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate transition-all hover:opacity-80 hover:shadow-sm border ${c.chip} ${
        risk ? "ring-1 ring-red-400" : ""
      } ${task.priority === "P0" ? "font-bold" : "font-medium"}`}
      title={task.task_name}
    >
      {risk && <span className="mr-0.5 text-red-500 text-[9px]">⚠ </span>}
      {task.task_name}
    </button>
  );
}

// ─── Beat timeline strip ──────────────────────────────────────────────────────

function BeatTimeline({ beats, viewStart, viewEnd, brandColor }) {
  if (!beats.length) return null;
  const totalMs = viewEnd - viewStart;
  if (totalMs <= 0) return null;

  function pct(iso) {
    const ms = parseISO(iso).getTime();
    return Math.max(0, Math.min(100, ((ms - viewStart) / totalMs) * 100));
  }

  const todayPct = pct(TODAY_ISO);

  return (
    <div className="panel p-3 overflow-hidden">
      <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-2 px-1">
        Beat timeline · {fmtDate(new Date(viewStart).toISOString().slice(0, 10))} → {fmtDate(new Date(viewEnd).toISOString().slice(0, 10))}
      </div>
      <div className="relative space-y-1.5">
        {/* Today line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-accent-red/50 z-10 pointer-events-none"
          style={{ left: `${todayPct}%` }}
        />
        {beats.map((b) => {
          const left = pct(b.start_date);
          const right = 100 - pct(b.end_date);
          const statusColor =
            b.status === "active" || b.status === "on_track"
              ? "#16A34A"
              : b.status === "at_risk"
              ? "#D97706"
              : b.status === "blocked" || b.status === "delayed"
              ? "#DC2626"
              : b.status === "planning"
              ? "#94A3B8"
              : brandColor || "#1F4FDB";
          return (
            <div key={b.beat_id} className="relative h-6">
              <div
                className="absolute top-0 h-full rounded text-[10px] font-medium text-white flex items-center px-1.5 overflow-hidden whitespace-nowrap"
                style={{
                  left: `${left}%`,
                  right: `${right}%`,
                  backgroundColor: statusColor,
                  minWidth: "4px",
                  opacity: 0.85,
                }}
                title={`${b.beat_name} · ${b.lifecycle_stage || b.status} · ${fmtDate(b.start_date)} → ${fmtDate(b.end_date)}`}
              >
                <span className="truncate">{b.beat_name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── At-risk strip ────────────────────────────────────────────────────────────

function AlertStrip({ tasks, onSelect }) {
  const risks = tasks.filter(isAtRisk).sort((a, b) => {
    const pA = a.priority === "P0" ? 0 : a.priority === "P1" ? 1 : 2;
    const pB = b.priority === "P0" ? 0 : b.priority === "P1" ? 1 : 2;
    return pA - pB;
  });
  if (!risks.length) return null;

  return (
    <div className="panel border-red-200 p-3 space-y-1.5">
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
        <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
          Needs attention · {risks.length} task{risks.length !== 1 ? "s" : ""} at risk or blocked
        </span>
      </div>
      {risks.map((t) => (
        <button
          key={t.task_id}
          type="button"
          onClick={() => onSelect(t)}
          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded border border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 transition-colors"
        >
          <span
            className={`shrink-0 h-1.5 w-1.5 rounded-full ${
              t.status === "blocked" ? "bg-red-500" : "bg-amber-500"
            }`}
          />
          <span className="text-[11.5px] font-medium text-ink-900 truncate flex-1">
            {t.task_name}
          </span>
          <CatChip cat={taskCat(t)} size="xs" />
          <PriBadge priority={t.priority} />
          <StatusBadge status={t.status} />
          <span className="text-[10.5px] text-ink-500 shrink-0">{fmtDate(t.start_date)}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Task detail panel ────────────────────────────────────────────────────────

function TaskDetailPanel({ task, beat, linkedTickets, linkedInvoices, onClose }) {
  if (!task) return null;

  const cat = taskCat(task);
  const c = CAT[cat];
  const risk = isAtRisk(task);
  const isMultiDay = task.start_date !== task.end_date;
  const durationDays = isMultiDay ? daysBetween(task.start_date, task.end_date) + 1 : null;

  // Collect all attachments across linked tickets
  const allAttachments = linkedTickets.flatMap((tk) => tk.attachments || []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[440px] bg-white border-l border-line shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-line bg-slate-50/60 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <CatChip cat={cat} />
                <PriBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
              <h2 className="text-[13.5px] font-semibold leading-snug text-ink-900">
                {task.task_name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-400 hover:text-ink-700 shrink-0 mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {risk && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {task.status === "blocked"
                ? "Blocked — unblock before this slips the beat"
                : "At risk — monitor daily, flag to Davide if unresolved 48h"}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Date + owner */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> Date
              </div>
              <div className="text-[12.5px] font-medium text-ink-900">
                {fmtDate(task.start_date)}
                {isMultiDay && (
                  <>
                    <span className="text-ink-400"> → </span>
                    {fmtDate(task.end_date)}
                  </>
                )}
              </div>
              {durationDays && (
                <div className="text-[10.5px] text-ink-500">{durationDays}-day flight</div>
              )}
            </div>
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1 flex items-center gap-1">
                <User className="h-2.5 w-2.5" /> Owner
              </div>
              <div className="text-[12.5px] font-medium text-ink-900">{task.owner}</div>
            </div>
          </div>

          {/* Task type */}
          <div>
            <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">
              Task type
            </div>
            <div className="text-[12px] text-ink-700">
              {TASK_TYPE_LABEL[task.task_type] || task.task_type}
            </div>
          </div>

          {/* Beat context */}
          {beat && (
            <div className="border border-line rounded-md p-3 bg-slate-50/50">
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5 flex items-center gap-1">
                <Flag className="h-2.5 w-2.5" /> Beat context
              </div>
              <div className="text-[12.5px] font-medium text-ink-900 leading-snug">
                {beat.beat_name}
              </div>
              <div className="text-[11px] text-ink-500 mt-1 flex flex-wrap items-center gap-1.5">
                {beat.lifecycle_stage && (
                  <span
                    className={`inline-flex items-center text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                      beat.lifecycle_stage === "Asset Lock"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : beat.lifecycle_stage === "Live"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : beat.lifecycle_stage === "QA"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {beat.lifecycle_stage}
                  </span>
                )}
                <span>
                  {fmtDate(beat.start_date)} → {fmtDate(beat.end_date)}
                </span>
                {beat.budget_usd && (
                  <>
                    <span className="text-ink-300">·</span>
                    <span>{fmtMoney(beat.budget_usd)} budget</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Linked Jira tickets */}
          {linkedTickets.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2 flex items-center gap-1">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.022-1.001zM23.013 0H11.442a5.212 5.212 0 0 0 5.213 5.213h2.13v2.058A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z" />
                </svg>
                Jira tickets ({linkedTickets.length})
              </div>
              <div className="space-y-2">
                {linkedTickets.map((tk) => (
                  <a
                    key={tk.ticket_id}
                    href={jiraUrl(tk.ticket_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2.5 rounded-md border border-line hover:border-ink-300 hover:shadow-sm transition-all group bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="mono text-[9.5px] text-ink-500">{tk.ticket_id}</span>
                        <PriBadge priority={tk.priority} />
                        <StatusBadge status={tk.status} />
                      </div>
                      <div className="text-[11.5px] font-medium text-ink-900 leading-snug group-hover:text-accent-primary">
                        {tk.summary}
                      </div>
                      <div className="text-[10.5px] text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{tk.owner}</span>
                        {tk.due_date && (
                          <>
                            <span className="text-ink-300">·</span>
                            <span>Due {fmtDate(tk.due_date)}</span>
                          </>
                        )}
                      </div>
                      {/* Attachments */}
                      {tk.attachments && tk.attachments.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {tk.attachments.map((att) => (
                            <span
                              key={att.attachment_id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-ink-600 bg-slate-50 border border-slate-200 rounded"
                              title={att.notes || att.filename}
                            >
                              <Paperclip className="h-2 w-2" />
                              {att.type.replace(/_/g, " ")}
                              {att.amount_usd ? ` · ${fmtMoney(att.amount_usd)}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-3 w-3 text-ink-400 group-hover:text-accent-primary shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Linked invoices */}
          {linkedInvoices.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2 flex items-center gap-1">
                <DollarSign className="h-2.5 w-2.5" /> Invoices ({linkedInvoices.length})
              </div>
              <div className="space-y-1.5">
                {linkedInvoices.map((inv) => {
                  const invRing =
                    inv.status === "past_due"
                      ? "border-red-200 bg-red-50"
                      : inv.status === "due"
                      ? "border-amber-200 bg-amber-50"
                      : "border-line bg-white";
                  const amtColor =
                    inv.status === "past_due"
                      ? "text-red-700"
                      : inv.status === "due"
                      ? "text-amber-700"
                      : "text-ink-800";
                  return (
                    <div
                      key={inv.invoice_id}
                      className={`p-2.5 rounded-md border text-[11px] ${invRing}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="mono text-[9.5px] text-ink-500">{inv.invoice_id}</span>
                        <span className={`font-bold text-[12.5px] ${amtColor}`}>
                          {fmtMoney(inv.amount_usd)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-ink-900">{inv.vendor}</div>
                      <div className="text-ink-500 text-[10.5px] mt-0.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={inv.status.replace(/_/, " ")} />
                        <span>Due {fmtDate(inv.due_date)}</span>
                        {inv.po_number && (
                          <>
                            <span className="text-ink-300">·</span>
                            <span className="mono">{inv.po_number}</span>
                          </>
                        )}
                      </div>
                      {inv.notes && (
                        <div className="text-ink-500 text-[10px] mt-1 italic leading-relaxed">
                          {inv.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {linkedTickets.length === 0 && linkedInvoices.length === 0 && (
            <div className="text-[11.5px] text-ink-400 italic">
              No linked Jira tickets or invoices for this task.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Monthly calendar grid ────────────────────────────────────────────────────

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarGrid({ tasks, year, month, onSelectTask }) {
  const weeks = useMemo(() => generateCalendarWeeks(year, month), [year, month]);
  const dayIndex = useMemo(() => buildDayIndex(tasks), [tasks]);
  const [expandedDay, setExpandedDay] = useState(null);

  return (
    <div className="panel overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-line">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          className="grid grid-cols-7 border-b border-line last:border-b-0"
          style={{ minHeight: "96px" }}
        >
          {week.map(({ iso, inMonth }) => {
            const isToday = iso === TODAY_ISO;
            const isPast = iso < TODAY_ISO;
            const dayTasks = dayIndex[iso] || [];
            const visible = dayTasks.slice(0, 3);
            const overflow = dayTasks.length - visible.length;
            const isExpanded = expandedDay === iso;
            const allVisible = isExpanded ? dayTasks : visible;

            return (
              <div
                key={iso}
                className={`border-r border-line last:border-r-0 p-1 flex flex-col gap-0.5 min-h-[96px] ${
                  !inMonth ? "bg-slate-50/50" : ""
                } ${isPast && inMonth ? "opacity-70" : ""}`}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-accent-primary text-white"
                        : inMonth
                        ? "text-ink-800"
                        : "text-ink-300"
                    }`}
                  >
                    {parseInt(iso.slice(8), 10)}
                  </span>
                </div>

                {/* Event chips */}
                {allVisible.map((t) => (
                  <EventChip key={t.task_id} task={t} onClick={onSelectTask} />
                ))}

                {/* Overflow */}
                {overflow > 0 && !isExpanded && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(iso)}
                    className="text-[9.5px] text-ink-500 hover:text-ink-800 font-medium text-left px-1"
                  >
                    +{overflow} more
                  </button>
                )}
                {isExpanded && (
                  <button
                    type="button"
                    onClick={() => setExpandedDay(null)}
                    className="text-[9.5px] text-ink-500 hover:text-ink-800 font-medium text-left px-1"
                  >
                    Show less
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ tasks, onSelectTask }) {
  const grouped = useMemo(() => {
    const g = {};
    for (const cat of CAT_ORDER) g[cat] = [];
    for (const t of tasks) {
      const cat = taskCat(t);
      if (g[cat]) g[cat].push(t);
    }
    for (const cat of CAT_ORDER) {
      g[cat].sort((a, b) => {
        const pA = a.priority === "P0" ? 0 : a.priority === "P1" ? 1 : 2;
        const pB = b.priority === "P0" ? 0 : b.priority === "P1" ? 1 : 2;
        if (pA !== pB) return pA - pB;
        return a.start_date.localeCompare(b.start_date);
      });
    }
    return g;
  }, [tasks]);

  return (
    <div className="space-y-3">
      {CAT_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items.length) return null;
        const c = CAT[cat];
        const Icon = c.Icon;
        return (
          <div key={cat} className={`panel border ${c.section}`}>
            <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-inherit`}>
              <Icon className={`h-3.5 w-3.5 ${c.header}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wider ${c.header}`}>
                {c.label}
              </span>
              <span className="text-[10.5px] text-ink-500 ml-1">
                {items.length} task{items.length !== 1 ? "s" : ""}
              </span>
              <span className="ml-auto text-[10px] text-ink-400">
                {items.filter((t) => t.priority === "P0").length} P0 ·{" "}
                {items.filter(isAtRisk).length} at risk
              </span>
            </div>
            <div className="divide-y divide-line">
              {items.map((t) => {
                const risk = isAtRisk(t);
                const isMultiDay = t.start_date !== t.end_date;
                return (
                  <button
                    key={t.task_id}
                    type="button"
                    onClick={() => onSelectTask(t)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-white/70 transition-colors ${
                      risk ? "bg-red-50/30" : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 mt-0.5 ${
                        t.status === "completed"
                          ? "text-green-500"
                          : risk
                          ? "text-red-400"
                          : "text-ink-300"
                      }`}
                    >
                      {t.status === "completed" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[12px] font-medium truncate ${
                            t.status === "completed" ? "line-through text-ink-400" : "text-ink-900"
                          }`}
                        >
                          {risk && <span className="text-red-500 mr-0.5">⚠ </span>}
                          {t.task_name}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-ink-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>{t.owner}</span>
                        <span className="text-ink-300">·</span>
                        <span>{TASK_TYPE_LABEL[t.task_type] || t.task_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <PriBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      <span className="text-[10.5px] text-ink-500 min-w-[52px] text-right">
                        {fmtDate(t.start_date)}
                        {isMultiDay && (
                          <span className="text-ink-300"> →</span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TitleCalendar({ title, tasks, beats, tickets, invoices }) {
  // Default to today's month
  const [viewYear, setViewYear] = useState(
    () => DEMO_TODAY.getUTCFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    () => DEMO_TODAY.getUTCMonth()
  );
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' | 'list'
  const [filterCat, setFilterCat] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filterCat === "all") return tasks;
    if (filterCat === "at_risk") return tasks.filter(isAtRisk);
    return tasks.filter((t) => taskCat(t) === filterCat);
  }, [tasks, filterCat]);

  // For calendar view — tasks in current month
  const monthTasks = useMemo(() => {
    const start = new Date(Date.UTC(viewYear, viewMonth, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).toISOString().slice(0, 10);
    return filteredTasks.filter(
      (t) => t.start_date >= start && t.start_date <= end
    );
  }, [filteredTasks, viewYear, viewMonth]);

  // Beat timeline range: span all beat + task dates
  const { viewStart, viewEnd } = useMemo(() => {
    const allMs = [
      ...beats.flatMap((b) => [parseISO(b.start_date).getTime(), parseISO(b.end_date).getTime()]),
      ...tasks.flatMap((t) => [parseISO(t.start_date).getTime(), parseISO(t.end_date).getTime()]),
    ];
    if (!allMs.length) {
      return { viewStart: DEMO_TODAY.getTime(), viewEnd: DEMO_TODAY.getTime() };
    }
    return { viewStart: Math.min(...allMs), viewEnd: Math.max(...allMs) };
  }, [beats, tasks]);

  // Detail panel data
  const detailBeat = selectedTask?.beat_id
    ? beats.find((b) => b.beat_id === selectedTask.beat_id)
    : null;

  const detailTickets = useMemo(() => {
    if (!selectedTask?.beat_id) return [];
    return tickets.filter(
      (tk) => tk.beat_id === selectedTask.beat_id && tk.status !== "completed"
    );
  }, [selectedTask, tickets]);

  const detailInvoices = useMemo(() => {
    if (!selectedTask?.beat_id) return [];
    return invoices.filter((inv) => inv.beat_id === selectedTask.beat_id);
  }, [selectedTask, invoices]);

  // Category summary for filter bar
  const catCounts = useMemo(() => {
    const counts = { all: tasks.length, at_risk: tasks.filter(isAtRisk).length };
    for (const cat of CAT_ORDER) {
      counts[cat] = tasks.filter((t) => taskCat(t) === cat).length;
    }
    return counts;
  }, [tasks]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <div className="space-y-4">
      {/* Alert strip */}
      <AlertStrip tasks={tasks} onSelect={setSelectedTask} />

      {/* Beat timeline */}
      <BeatTimeline
        beats={beats}
        viewStart={viewStart}
        viewEnd={viewEnd}
        brandColor={title.brand_color}
      />

      {/* Controls bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center border border-line rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-accent-primary text-white"
                : "text-ink-600 hover:bg-slate-50"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium transition-colors border-l border-line ${
              viewMode === "list"
                ? "bg-accent-primary text-white"
                : "text-ink-600 hover:bg-slate-50"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "at_risk", label: "⚠ At risk" },
            ...CAT_ORDER.map((k) => ({ key: k, label: CAT[k].label })),
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterCat(key)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                filterCat === key
                  ? key === "at_risk"
                    ? "bg-red-600 text-white border-red-600"
                    : key === "production"
                    ? "bg-red-500 text-white border-red-500"
                    : key === "execution"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : key === "budget"
                    ? "bg-amber-500 text-white border-amber-500"
                    : key === "kpi"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-accent-primary text-white border-accent-primary"
                  : "border-line text-ink-600 hover:border-ink-300 hover:text-ink-800"
              }`}
            >
              {label}
              <span className="ml-1 opacity-70 text-[10px]">{catCounts[key]}</span>
            </button>
          ))}
        </div>

        {/* Month nav (calendar mode only) */}
        {viewMode === "calendar" && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-slate-100 text-ink-500 hover:text-ink-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12.5px] font-semibold text-ink-800 min-w-[130px] text-center">
              {monthLabel(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-slate-100 text-ink-500 hover:text-ink-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10.5px] text-ink-600">
        <span className="font-semibold text-[9.5px] uppercase tracking-wider text-ink-400">
          Category:
        </span>
        {CAT_ORDER.map((cat) => (
          <span key={cat} className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${CAT[cat].chipSolid}`}
            />
            {CAT[cat].label}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-2">
          <span className="text-[9px] font-bold text-red-500">⚠</span>
          At risk / blocked
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent-primary" />
          Today
        </span>
      </div>

      {/* Main view */}
      {viewMode === "calendar" ? (
        <>
          {monthTasks.length === 0 && filteredTasks.length > 0 && (
            <div className="panel p-6 text-center text-[12.5px] text-ink-500">
              No tasks starting in {monthLabel(viewYear, viewMonth)}.{" "}
              <button
                type="button"
                className="text-accent-primary hover:underline"
                onClick={() => setViewMode("list")}
              >
                Switch to list view
              </button>{" "}
              to see all {filteredTasks.length} tasks.
            </div>
          )}
          <CalendarGrid
            tasks={filteredTasks}
            year={viewYear}
            month={viewMonth}
            onSelectTask={setSelectedTask}
          />
        </>
      ) : (
        <ListView tasks={filteredTasks} onSelectTask={setSelectedTask} />
      )}

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          beat={detailBeat}
          linkedTickets={detailTickets}
          linkedInvoices={detailInvoices}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
