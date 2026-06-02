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
  GitBranch,
  ArrowRight,
} from "lucide-react";
import { fmtDate, fmtMoney, DEMO_TODAY_ISO } from "@/lib/data";

// ─── Operational category taxonomy ────────────────────────────────────────────

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
  decision_prep: "kpi",
  owned_content: "kpi",
};

const CAT = {
  production: { label: "Production", Icon: Wrench,      chip: "bg-red-50 text-red-700 border border-red-200",     solid: "bg-red-500",     bar: "border-l-red-500",     header: "text-red-700",     section: "border-red-200 bg-red-50/20" },
  execution:  { label: "Execution",  Icon: Zap,         chip: "bg-emerald-50 text-emerald-700 border border-emerald-200", solid: "bg-emerald-500", bar: "border-l-emerald-500", header: "text-emerald-700", section: "border-emerald-200 bg-emerald-50/20" },
  budget:     { label: "Budget",     Icon: DollarSign,  chip: "bg-amber-50 text-amber-700 border border-amber-200",   solid: "bg-amber-500",   bar: "border-l-amber-500",   header: "text-amber-700",   section: "border-amber-200 bg-amber-50/20" },
  kpi:        { label: "KPI",        Icon: TrendingDown, chip: "bg-indigo-50 text-indigo-700 border border-indigo-200", solid: "bg-indigo-500",  bar: "border-l-indigo-500",  header: "text-indigo-700",  section: "border-indigo-200 bg-indigo-50/20" },
};

const CAT_ORDER = ["production", "execution", "budget", "kpi"];

const STATUS_STYLE = {
  active:      "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  scheduled:   "bg-slate-50 text-slate-600 border-slate-200",
  at_risk:     "bg-amber-50 text-amber-700 border-amber-200",
  blocked:     "bg-red-50 text-red-700 border-red-200",
  delayed:     "bg-red-50 text-red-700 border-red-200",
  planning:    "bg-slate-50 text-slate-500 border-slate-200",
  completed:   "bg-green-50 text-green-700 border-green-200",
  due:         "bg-amber-50 text-amber-700 border-amber-200",
  past_due:    "bg-red-50 text-red-700 border-red-200",
};

const PRIORITY_STYLE = {
  P0: "text-red-600 bg-red-50 border-red-200",
  P1: "text-amber-600 bg-amber-50 border-amber-200",
  P2: "text-slate-500 bg-slate-50 border-slate-200",
};

const TASK_TYPE_LABEL = {
  creator_activation: "Creator activation", asset_delivery: "Asset delivery",
  asset_publish: "Asset publish", creator_brief_revision: "Brief revision",
  vendor_activation: "Vendor activation", vendor_brief: "Vendor brief",
  creative_dev: "Creative dev", comms_draft: "Comms draft",
  product_launch: "Product launch", event_prep: "Event prep",
  external_dependency: "External dep", creator_quest: "Creator quest",
  vendor_deliverable: "Vendor deliverable", earned_media: "Earned media",
  platform_update: "Platform update", platform_event: "Platform event",
  community_event: "Community event", creator_seeding: "Creator seeding",
  planning_sync: "Planning sync", internal_meeting: "Internal meeting",
  process_audit: "Process audit", decision_gate: "Decision gate",
  review_gate: "Review gate", paid_media: "Paid media",
  paid_media_replan: "Paid replan", legal_gate: "Legal gate",
  measurement: "Measurement", reporting: "Reporting", analysis: "Analysis",
  seo_milestone: "SEO milestone", planning_doc: "Planning doc",
  decision_prep: "Decision prep", owned_content: "Owned content",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DEMO_TODAY = new Date(DEMO_TODAY_ISO + "T00:00:00Z");
const TODAY_ISO = DEMO_TODAY_ISO;

function parseISO(iso) { return new Date(iso + "T00:00:00Z"); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }

function generateCalendarWeeks(year, month) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startDow = firstDay.getUTCDay();
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
    const next = new Date(last); next.setUTCDate(next.getUTCDate() + 1);
    days.push({ date: next, iso: next.toISOString().slice(0, 10), inMonth: false });
  }
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function monthLabel(year, month) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

// Get Mon–Fri for a week offset (0 = week containing TODAY)
function getWeekDays(weekOffset) {
  const today = parseISO(TODAY_ISO);
  const dow = today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return { date: d, iso: d.toISOString().slice(0, 10) };
  });
}

function weekRangeLabel(days) {
  const s = days[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const e = days[4].date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${s} – ${e}`;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function taskCat(task) { return TASK_TYPE_CAT[task.task_type] || "execution"; }
function isAtRisk(task) { return task.status === "at_risk" || task.status === "blocked" || task.status === "delayed"; }
function jiraUrl(id) { return `https://2kgames.atlassian.net/browse/${id}`; }

function sortedByPriority(arr) {
  return [...arr].sort((a, b) => {
    const rA = isAtRisk(a) ? 0 : 1, rB = isAtRisk(b) ? 0 : 1;
    if (rA !== rB) return rA - rB;
    const pA = a.priority === "P0" ? 0 : a.priority === "P1" ? 1 : 2;
    const pB = b.priority === "P0" ? 0 : b.priority === "P1" ? 1 : 2;
    if (pA !== pB) return pA - pB;
    return CAT_ORDER.indexOf(taskCat(a)) - CAT_ORDER.indexOf(taskCat(b));
  });
}

function buildDayIndex(tasks) {
  const idx = {};
  for (const t of tasks) {
    if (!idx[t.start_date]) idx[t.start_date] = [];
    idx[t.start_date].push(t);
  }
  for (const k of Object.keys(idx)) idx[k] = sortedByPriority(idx[k]);
  return idx;
}

// Build invoice index by due_date — skip paid
function buildInvoiceDayIndex(invoices) {
  const idx = {};
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    if (!idx[inv.due_date]) idx[inv.due_date] = [];
    idx[inv.due_date].push(inv);
  }
  return idx;
}

// ─── Critical path computation ────────────────────────────────────────────────
// Returns Set<task_id> of every task whose delay could block a P0 outcome.
// Algorithm: BFS backward from all P0 tasks through depends_on edges.

function computeCriticalPath(tasks) {
  const taskMap = new Map(tasks.map(t => [t.task_id, t]));
  const criticalIds = new Set();
  const queue = [];

  for (const t of tasks) {
    if (t.priority === "P0") {
      criticalIds.add(t.task_id);
      queue.push(t.task_id);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    const task = taskMap.get(curr);
    if (!task) continue;
    for (const dep of (task.depends_on || [])) {
      if (!criticalIds.has(dep)) {
        criticalIds.add(dep);
        queue.push(dep);
      }
    }
  }
  return criticalIds;
}

// Returns chains [ [task, task, ...P0task] ] for visualisation
// Each chain traces from a root (no deps) to a P0 end node
function buildCriticalChains(tasks, criticalIds) {
  const taskMap = new Map(tasks.map(t => [t.task_id, t]));
  // Build forward edges within critical path
  const successors = new Map(); // task_id → [task_id...]
  for (const t of tasks) {
    if (!criticalIds.has(t.task_id)) continue;
    for (const dep of (t.depends_on || [])) {
      if (!criticalIds.has(dep)) continue;
      if (!successors.has(dep)) successors.set(dep, []);
      successors.get(dep).push(t.task_id);
    }
  }
  // Find roots: critical tasks with no critical predecessors
  const hasCriticalPredecessor = new Set();
  for (const t of tasks) {
    if (!criticalIds.has(t.task_id)) continue;
    for (const dep of (t.depends_on || [])) {
      if (criticalIds.has(dep)) hasCriticalPredecessor.add(t.task_id);
    }
  }

  const chains = [];
  function dfs(id, chain) {
    const next = successors.get(id) || [];
    if (next.length === 0) {
      chains.push([...chain]);
    } else {
      for (const nid of next) dfs(nid, [...chain, taskMap.get(nid)]);
    }
  }

  for (const t of tasks) {
    if (criticalIds.has(t.task_id) && !hasCriticalPredecessor.has(t.task_id)) {
      dfs(t.task_id, [t]);
    }
  }

  // Only return chains with >= 2 nodes
  return chains.filter(c => c.length >= 2).sort((a, b) => {
    const pA = a.some(t => t.priority === "P0") ? 0 : 1;
    const pB = b.some(t => t.priority === "P0") ? 0 : 1;
    return pA - pB;
  });
}

// ─── Micro components ─────────────────────────────────────────────────────────

function CatChip({ cat, size = "sm" }) {
  const c = CAT[cat]; if (!c) return null;
  const Icon = c.Icon;
  const sz = size === "xs" ? "text-[9px] px-1 py-0.5 gap-0.5" : "text-[10px] px-1.5 py-0.5 gap-1";
  const ic = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span className={`inline-flex items-center rounded font-semibold shrink-0 ${c.chip} ${sz}`}>
      <Icon className={ic} />{c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.scheduled;
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9.5px] font-medium ${s}`}>{status.replace(/_/g, " ")}</span>;
}

function PriBadge({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.P2;
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9.5px] font-bold ${s}`}>{priority}</span>;
}

// ─── Event chip (calendar cell) ───────────────────────────────────────────────

function EventChip({ task, isOnCP, onClick }) {
  const cat = taskCat(task);
  const c = CAT[cat];
  const risk = isAtRisk(task);
  return (
    <button type="button" onClick={() => onClick({ kind: "task", item: task })}
      className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate transition-all hover:opacity-80 hover:shadow-sm border ${c.chip} ${risk ? "ring-1 ring-red-400" : ""} ${isOnCP ? "ring-1 ring-amber-400" : ""} ${task.priority === "P0" ? "font-bold" : "font-medium"}`}
      title={task.task_name}>
      {risk && <span className="mr-0.5 text-red-500 text-[9px]">⚠ </span>}
      {isOnCP && !risk && <span className="mr-0.5 text-amber-500 text-[9px]">◆ </span>}
      {task.task_name}
    </button>
  );
}

// ─── Invoice chip (calendar cell) ─────────────────────────────────────────────

function InvoiceChip({ inv, onClick }) {
  const isPastDue = inv.status === "past_due";
  const isDue = inv.status === "due";
  const cls = isPastDue
    ? "bg-red-50 text-red-700 border-red-300 ring-1 ring-red-300"
    : isDue
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <button type="button" onClick={() => onClick({ kind: "invoice", item: inv })}
      className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate border font-medium flex items-center gap-0.5 transition-all hover:opacity-80 ${cls}`}
      title={`${inv.invoice_id} · ${inv.vendor} · ${fmtMoney(inv.amount_usd)} · ${inv.status}`}>
      <DollarSign className="h-2.5 w-2.5 shrink-0" />
      <span className="truncate">{inv.vendor} · {fmtMoney(inv.amount_usd)}</span>
    </button>
  );
}

// ─── Beat timeline ────────────────────────────────────────────────────────────

function BeatTimeline({ beats, viewStart, viewEnd, brandColor }) {
  if (!beats.length || viewEnd <= viewStart) return null;
  const totalMs = viewEnd - viewStart;
  function pct(iso) { return Math.max(0, Math.min(100, ((parseISO(iso).getTime() - viewStart) / totalMs) * 100)); }
  const todayPct = pct(TODAY_ISO);

  return (
    <div className="panel p-3 overflow-hidden">
      <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-2 px-1">
        Beat timeline · {fmtDate(new Date(viewStart).toISOString().slice(0, 10))} → {fmtDate(new Date(viewEnd).toISOString().slice(0, 10))}
      </div>
      <div className="relative space-y-1.5">
        <div className="absolute top-0 bottom-0 w-px bg-accent-red/50 z-10 pointer-events-none" style={{ left: `${todayPct}%` }} />
        {beats.map(b => {
          const left = pct(b.start_date), right = 100 - pct(b.end_date);
          const color = b.status === "active" || b.status === "on_track" ? "#16A34A" : b.status === "at_risk" ? "#D97706" : b.status === "blocked" || b.status === "delayed" ? "#DC2626" : b.status === "planning" ? "#94A3B8" : brandColor || "#1F4FDB";
          return (
            <div key={b.beat_id} className="relative h-6">
              <div className="absolute top-0 h-full rounded text-[10px] font-medium text-white flex items-center px-1.5 overflow-hidden whitespace-nowrap"
                style={{ left: `${left}%`, right: `${right}%`, backgroundColor: color, minWidth: 4, opacity: 0.85 }}
                title={`${b.beat_name} · ${b.lifecycle_stage || b.status} · ${fmtDate(b.start_date)} → ${fmtDate(b.end_date)}`}>
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

function AlertStrip({ tasks, pastDueInvoices, onSelect }) {
  const risks = sortedByPriority(tasks.filter(isAtRisk));
  if (!risks.length && !pastDueInvoices.length) return null;
  return (
    <div className="panel border-red-200 p-3 space-y-1.5">
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
        <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
          Needs attention · {risks.length} task{risks.length !== 1 ? "s" : ""} at risk{pastDueInvoices.length > 0 ? ` · ${pastDueInvoices.length} invoice${pastDueInvoices.length !== 1 ? "s" : ""} overdue` : ""}
        </span>
      </div>
      {risks.map(t => (
        <button key={t.task_id} type="button" onClick={() => onSelect({ kind: "task", item: t })}
          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded border border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 transition-colors">
          <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${t.status === "blocked" ? "bg-red-500" : "bg-amber-500"}`} />
          <span className="text-[11.5px] font-medium text-ink-900 truncate flex-1">{t.task_name}</span>
          <CatChip cat={taskCat(t)} size="xs" /><PriBadge priority={t.priority} /><StatusBadge status={t.status} />
          <span className="text-[10.5px] text-ink-500 shrink-0">{fmtDate(t.start_date)}</span>
        </button>
      ))}
      {pastDueInvoices.map(inv => (
        <button key={inv.invoice_id} type="button" onClick={() => onSelect({ kind: "invoice", item: inv })}
          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded border border-red-200 bg-red-50 hover:border-red-300 transition-colors">
          <DollarSign className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-[11.5px] font-medium text-red-800 truncate flex-1">{inv.invoice_id} · {inv.vendor} · {fmtMoney(inv.amount_usd)}</span>
          <span className="text-[10.5px] text-red-600 font-semibold">Overdue {fmtDate(inv.due_date)}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Critical path panel ──────────────────────────────────────────────────────

function CriticalPathPanel({ tasks, criticalIds }) {
  const chains = useMemo(() => buildCriticalChains(tasks, criticalIds), [tasks, criticalIds]);
  if (!chains.length) return (
    <div className="panel p-4 text-center text-[12px] text-ink-500 italic">
      No multi-task dependency chains found for this title.
    </div>
  );

  return (
    <div className="panel p-4 space-y-4">
      <div className="flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
          Critical chains — {chains.length} path{chains.length !== 1 ? "s" : ""} to P0 outcomes
        </span>
      </div>
      <p className="text-[11.5px] text-ink-500 -mt-2">
        These dependency sequences must land on-time to protect P0 deliverables. ◆ = on chain. Red = at risk now.
      </p>
      <div className="space-y-3">
        {chains.map((chain, ci) => {
          const hasRisk = chain.some(t => isAtRisk(t));
          const p0task = chain.find(t => t.priority === "P0");
          return (
            <div key={ci} className={`rounded-md border p-3 ${hasRisk ? "border-red-200 bg-red-50/30" : "border-amber-100 bg-amber-50/30"}`}>
              {p0task && (
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${hasRisk ? "text-red-600" : "text-amber-700"}`}>
                  {hasRisk ? "⚠ AT RISK — " : "◆ "}Path to: {p0task.task_name.slice(0, 60)}{p0task.task_name.length > 60 ? "…" : ""}
                </div>
              )}
              <div className="flex items-center gap-1 flex-wrap">
                {chain.map((t, ti) => {
                  const risk = isAtRisk(t);
                  const isLast = ti === chain.length - 1;
                  return (
                    <div key={t.task_id} className="flex items-center gap-1">
                      <div className={`rounded px-2 py-1 text-[10.5px] font-medium border max-w-[200px] ${
                        risk ? "bg-red-50 border-red-300 text-red-800" :
                        t.status === "completed" ? "bg-green-50 border-green-200 text-green-700 line-through opacity-60" :
                        t.priority === "P0" ? "bg-amber-50 border-amber-300 text-amber-900 font-bold" :
                        "bg-white border-line text-ink-800"
                      }`}>
                        <div className="flex items-center gap-1">
                          {t.status === "completed" ? <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-green-500" /> :
                           risk ? <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-red-500" /> :
                           <Circle className="h-2.5 w-2.5 shrink-0 text-ink-300" />}
                          <span className="truncate">{t.task_name.length > 35 ? t.task_name.slice(0, 35) + "…" : t.task_name}</span>
                        </div>
                        <div className="text-[9px] text-ink-400 mt-0.5 flex gap-1">
                          <span>{fmtDate(t.start_date)}</span>
                          <span>·</span>
                          <span>{t.owner.split(" ")[0]}</span>
                          {t.priority === "P0" && <span className="text-amber-600 font-bold">P0</span>}
                        </div>
                      </div>
                      {!isLast && <ArrowRight className="h-3 w-3 text-ink-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ detailItem, allBeats, allTickets, allInvoices, tasks, criticalIds, onClose }) {
  if (!detailItem) return null;

  // Invoice detail
  if (detailItem.kind === "invoice") {
    const inv = detailItem.item;
    const isPastDue = inv.status === "past_due";
    const isDue = inv.status === "due";
    const headerCls = isPastDue ? "bg-red-50/60 border-red-100" : isDue ? "bg-amber-50/60 border-amber-100" : "bg-slate-50/60";
    return (
      <>
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
        <div className="fixed inset-y-0 right-0 w-full max-w-[440px] bg-white border-l border-line shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className={`p-4 border-b ${headerCls} shrink-0`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold bg-amber-50 text-amber-700 border-amber-200">
                    <DollarSign className="h-3 w-3" />Invoice
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
                <h2 className="text-[13.5px] font-semibold text-ink-900">{inv.invoice_id}</h2>
                <p className="text-[12px] text-ink-500 mt-0.5">{inv.description || inv.campaign_name}</p>
              </div>
              <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700 shrink-0"><X className="h-4 w-4" /></button>
            </div>
            {isPastDue && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />Past due — escalate to AP immediately
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div><div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Vendor</div><div className="font-medium text-ink-900">{inv.vendor}</div></div>
              <div><div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Amount</div><div className={`font-bold text-[15px] ${isPastDue ? "text-red-700" : isDue ? "text-amber-700" : "text-ink-900"}`}>{fmtMoney(inv.amount_usd)}</div></div>
              <div><div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Due date</div><div className="font-medium text-ink-900">{fmtDate(inv.due_date)}</div></div>
              <div><div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Net terms</div><div className="font-medium text-ink-900">Net-{inv.net_terms}</div></div>
            </div>
            {inv.po_number && <div><div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">PO Number</div><div className="mono text-[12px] text-ink-800">{inv.po_number}</div></div>}
            {inv.notes && <div className="p-3 rounded-md bg-slate-50 border border-line text-[11.5px] text-ink-700 leading-relaxed">{inv.notes}</div>}
          </div>
        </div>
      </>
    );
  }

  // Task detail
  const task = detailItem.item;
  const cat = taskCat(task);
  const c = CAT[cat];
  const risk = isAtRisk(task);
  const isOnCP = criticalIds.has(task.task_id);
  const isMultiDay = task.start_date !== task.end_date;
  const durationDays = isMultiDay ? daysBetween(task.start_date, task.end_date) + 1 : null;

  const beat = task.beat_id ? allBeats.find(b => b.beat_id === task.beat_id) : null;
  const linkedTickets = task.beat_id ? allTickets.filter(tk => tk.beat_id === task.beat_id && tk.status !== "completed") : [];
  const linkedInvoices = task.beat_id ? allInvoices.filter(inv => inv.beat_id === task.beat_id) : [];

  // Direct successors/predecessors
  const directSuccessors = tasks.filter(t => (t.depends_on || []).includes(task.task_id));
  const directPredecessors = (task.depends_on || []).map(id => tasks.find(t => t.task_id === id)).filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-[440px] bg-white border-l border-line shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line bg-slate-50/60 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <CatChip cat={cat} /><PriBadge priority={task.priority} /><StatusBadge status={task.status} />
                {isOnCP && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9.5px] font-bold bg-amber-50 text-amber-700 border-amber-200"><GitBranch className="h-2.5 w-2.5" />Critical path</span>}
              </div>
              <h2 className="text-[13.5px] font-semibold leading-snug text-ink-900">{task.task_name}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-700 shrink-0"><X className="h-4 w-4" /></button>
          </div>
          {risk && <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{task.status === "blocked" ? "Blocked — unblock before this slips the beat" : "At risk — flag to Davide if unresolved 48h"}</div>}
          {isOnCP && !risk && <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5"><GitBranch className="h-3.5 w-3.5 shrink-0" />On critical path — slip here delays a P0 outcome</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Date + owner */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Date</div>
              <div className="text-[12.5px] font-medium text-ink-900">{fmtDate(task.start_date)}{isMultiDay && <><span className="text-ink-400"> → </span>{fmtDate(task.end_date)}</>}</div>
              {durationDays && <div className="text-[10.5px] text-ink-500">{durationDays}-day flight</div>}
            </div>
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1 flex items-center gap-1"><User className="h-2.5 w-2.5" />Owner</div>
              <div className="text-[12.5px] font-medium text-ink-900">{task.owner}</div>
            </div>
          </div>

          {/* Task type */}
          <div>
            <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Task type</div>
            <div className="text-[12px] text-ink-700">{TASK_TYPE_LABEL[task.task_type] || task.task_type}</div>
          </div>

          {/* Dependencies */}
          {(directPredecessors.length > 0 || directSuccessors.length > 0) && (
            <div className="space-y-2">
              {directPredecessors.length > 0 && (
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5 flex items-center gap-1"><ArrowRight className="h-2.5 w-2.5 rotate-180" />Depends on</div>
                  <div className="space-y-1">
                    {directPredecessors.map(dep => (
                      <div key={dep.task_id} className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border ${isAtRisk(dep) ? "bg-red-50 border-red-200 text-red-800" : dep.status === "completed" ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-line text-ink-700"}`}>
                        {dep.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : isAtRisk(dep) ? <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" /> : <Circle className="h-3 w-3 text-ink-300 shrink-0" />}
                        <span className="flex-1 truncate">{dep.task_name}</span>
                        <StatusBadge status={dep.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {directSuccessors.length > 0 && (
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5 flex items-center gap-1"><ArrowRight className="h-2.5 w-2.5" />Unlocks</div>
                  <div className="space-y-1">
                    {directSuccessors.map(suc => (
                      <div key={suc.task_id} className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border ${suc.priority === "P0" ? "bg-amber-50 border-amber-200 text-amber-900 font-semibold" : "bg-slate-50 border-line text-ink-600"}`}>
                        <ArrowRight className="h-3 w-3 shrink-0 text-ink-300" />
                        <span className="flex-1 truncate">{suc.task_name}</span>
                        <PriBadge priority={suc.priority} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Beat context */}
          {beat && (
            <div className="border border-line rounded-md p-3 bg-slate-50/50">
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5 flex items-center gap-1"><Flag className="h-2.5 w-2.5" />Beat context</div>
              <div className="text-[12.5px] font-medium text-ink-900 leading-snug">{beat.beat_name}</div>
              <div className="text-[11px] text-ink-500 mt-1 flex flex-wrap items-center gap-1.5">
                {beat.lifecycle_stage && (
                  <span className={`inline-flex items-center text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${beat.lifecycle_stage === "Asset Lock" ? "bg-red-50 text-red-700 border-red-200" : beat.lifecycle_stage === "Live" ? "bg-green-50 text-green-700 border-green-200" : beat.lifecycle_stage === "QA" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{beat.lifecycle_stage}</span>
                )}
                <span>{fmtDate(beat.start_date)} → {fmtDate(beat.end_date)}</span>
                {beat.budget_usd && <><span className="text-ink-300">·</span><span>{fmtMoney(beat.budget_usd)} budget</span></>}
              </div>
            </div>
          )}

          {/* Jira tickets */}
          {linkedTickets.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2 flex items-center gap-1">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.022-1.001zM23.013 0H11.442a5.212 5.212 0 0 0 5.213 5.213h2.13v2.058A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0z"/></svg>
                Jira tickets ({linkedTickets.length})
              </div>
              <div className="space-y-2">
                {linkedTickets.map(tk => (
                  <a key={tk.ticket_id} href={jiraUrl(tk.ticket_id)} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2.5 rounded-md border border-line hover:border-ink-300 hover:shadow-sm transition-all group bg-white">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="mono text-[9.5px] text-ink-500">{tk.ticket_id}</span>
                        <PriBadge priority={tk.priority} /><StatusBadge status={tk.status} />
                      </div>
                      <div className="text-[11.5px] font-medium text-ink-900 leading-snug group-hover:text-accent-primary">{tk.summary}</div>
                      <div className="text-[10.5px] text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{tk.owner}</span>
                        {tk.due_date && <><span className="text-ink-300">·</span><span>Due {fmtDate(tk.due_date)}</span></>}
                      </div>
                      {tk.attachments && tk.attachments.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {tk.attachments.map(att => (
                            <span key={att.attachment_id} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-ink-600 bg-slate-50 border border-slate-200 rounded" title={att.notes || att.filename}>
                              <Paperclip className="h-2 w-2" />{att.type.replace(/_/g, " ")}{att.amount_usd ? ` · ${fmtMoney(att.amount_usd)}` : ""}
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

          {/* Invoices */}
          {linkedInvoices.length > 0 && (
            <div>
              <div className="text-[9.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2 flex items-center gap-1"><DollarSign className="h-2.5 w-2.5" />Invoices ({linkedInvoices.length})</div>
              <div className="space-y-1.5">
                {linkedInvoices.map(inv => {
                  const cls = inv.status === "past_due" ? "border-red-200 bg-red-50" : inv.status === "due" ? "border-amber-200 bg-amber-50" : "border-line bg-white";
                  const amtCls = inv.status === "past_due" ? "text-red-700" : inv.status === "due" ? "text-amber-700" : "text-ink-800";
                  return (
                    <div key={inv.invoice_id} className={`p-2.5 rounded-md border text-[11px] ${cls}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="mono text-[9.5px] text-ink-500">{inv.invoice_id}</span>
                        <span className={`font-bold text-[12.5px] ${amtCls}`}>{fmtMoney(inv.amount_usd)}</span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-ink-900">{inv.vendor}</div>
                      <div className="text-ink-500 text-[10.5px] mt-0.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={inv.status} />
                        <span>Due {fmtDate(inv.due_date)}</span>
                        {inv.po_number && <><span className="text-ink-300">·</span><span className="mono">{inv.po_number}</span></>}
                      </div>
                      {inv.notes && <div className="text-ink-500 text-[10px] mt-1 italic leading-relaxed">{inv.notes}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {linkedTickets.length === 0 && linkedInvoices.length === 0 && task.kind !== "invoice" && (
            <div className="text-[11.5px] text-ink-400 italic">No linked Jira tickets or invoices.</div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Month calendar grid ──────────────────────────────────────────────────────

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarGrid({ tasks, invoices, year, month, criticalIds, onSelect }) {
  const weeks = useMemo(() => generateCalendarWeeks(year, month), [year, month]);
  const dayIndex = useMemo(() => buildDayIndex(tasks), [tasks]);
  const invDayIndex = useMemo(() => buildInvoiceDayIndex(invoices), [invoices]);
  const [expandedDay, setExpandedDay] = useState(null);

  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {DOW_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-line last:border-b-0" style={{ minHeight: 96 }}>
          {week.map(({ iso, inMonth }) => {
            const isToday = iso === TODAY_ISO;
            const isPast = iso < TODAY_ISO;
            const dayTasks = dayIndex[iso] || [];
            const dayInvs = invDayIndex[iso] || [];
            const allItems = [...dayInvs.map(i => ({ kind: "inv", item: i })), ...dayTasks.map(t => ({ kind: "task", item: t }))];
            const visible = allItems.slice(0, 3);
            const overflow = allItems.length - visible.length;
            const showAll = expandedDay === iso;
            const displayed = showAll ? allItems : visible;

            return (
              <div key={iso} className={`border-r border-line last:border-r-0 p-1 flex flex-col gap-0.5 min-h-[96px] ${!inMonth ? "bg-slate-50/50" : ""} ${isPast && inMonth ? "opacity-70" : ""}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-accent-primary text-white" : inMonth ? "text-ink-800" : "text-ink-300"}`}>
                    {parseInt(iso.slice(8), 10)}
                  </span>
                </div>
                {displayed.map(({ kind, item }) =>
                  kind === "inv"
                    ? <InvoiceChip key={item.invoice_id} inv={item} onClick={sel => onSelect(sel)} />
                    : <EventChip key={item.task_id} task={item} isOnCP={criticalIds.has(item.task_id)} onClick={sel => onSelect(sel)} />
                )}
                {overflow > 0 && !showAll && (
                  <button type="button" onClick={() => setExpandedDay(iso)} className="text-[9.5px] text-ink-500 hover:text-ink-800 font-medium text-left px-1">+{overflow} more</button>
                )}
                {showAll && allItems.length > 3 && (
                  <button type="button" onClick={() => setExpandedDay(null)} className="text-[9.5px] text-ink-500 hover:text-ink-800 font-medium text-left px-1">Show less</button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekTaskCard({ task, isOnCP, onClick }) {
  const cat = taskCat(task);
  const c = CAT[cat];
  const risk = isAtRisk(task);
  return (
    <button type="button" onClick={() => onClick({ kind: "task", item: task })}
      className={`w-full text-left rounded-md border-l-2 border border-line bg-white p-2 transition-all hover:shadow-sm hover:border-ink-300 ${c.bar} ${risk ? "border-line border-l-red-500 bg-red-50/30" : ""} ${isOnCP ? "ring-1 ring-amber-300" : ""}`}>
      <div className={`text-[11px] font-medium leading-snug text-ink-900 ${task.priority === "P0" ? "font-bold" : ""}`}>
        {risk && <span className="text-red-500 mr-0.5 text-[9px]">⚠ </span>}
        {isOnCP && !risk && <span className="text-amber-500 mr-0.5 text-[9px]">◆ </span>}
        {task.task_name}
      </div>
      <div className="text-[9.5px] text-ink-500 mt-0.5 truncate">{task.owner}</div>
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        <CatChip cat={cat} size="xs" />
        <PriBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
    </button>
  );
}

function WeekInvoiceCard({ inv, onClick }) {
  const isPastDue = inv.status === "past_due";
  const isDue = inv.status === "due";
  const cls = isPastDue ? "border-l-red-500 bg-red-50/40 border-red-200" : isDue ? "border-l-amber-400 bg-amber-50/30 border-amber-200" : "border-l-slate-300 bg-slate-50/30 border-line";
  return (
    <button type="button" onClick={() => onClick({ kind: "invoice", item: inv })}
      className={`w-full text-left rounded-md border-l-2 border p-2 transition-all hover:shadow-sm ${cls}`}>
      <div className="flex items-center gap-1">
        <DollarSign className={`h-3 w-3 shrink-0 ${isPastDue ? "text-red-500" : isDue ? "text-amber-500" : "text-slate-500"}`} />
        <span className={`text-[11px] font-semibold ${isPastDue ? "text-red-800" : isDue ? "text-amber-800" : "text-slate-700"}`}>{fmtMoney(inv.amount_usd)}</span>
      </div>
      <div className="text-[10px] text-ink-600 mt-0.5 truncate">{inv.vendor}</div>
      <div className="text-[9.5px] mt-0.5">
        <StatusBadge status={inv.status} />
      </div>
    </button>
  );
}

function WeekView({ tasks, invoices, weekOffset, criticalIds, onSelect }) {
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const dayIndex = useMemo(() => buildDayIndex(tasks), [tasks]);
  const invDayIndex = useMemo(() => buildInvoiceDayIndex(invoices), [invoices]);

  return (
    <div className="panel overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-5 border-b border-line">
        {days.map(({ date, iso }) => {
          const isToday = iso === TODAY_ISO;
          const isPast = iso < TODAY_ISO;
          return (
            <div key={iso} className={`px-2 py-2.5 border-r border-line last:border-r-0 ${isToday ? "bg-blue-50/40" : ""} ${isPast ? "opacity-60" : ""}`}>
              <div className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? "text-accent-primary" : "text-ink-500"}`}>
                {date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
              </div>
              <div className={`text-[22px] font-bold leading-tight ${isToday ? "text-accent-primary" : "text-ink-900"}`}>
                {date.getUTCDate()}
              </div>
              <div className="text-[9.5px] text-ink-400">
                {date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}
              </div>
            </div>
          );
        })}
      </div>
      {/* Content row */}
      <div className="grid grid-cols-5 min-h-[220px]">
        {days.map(({ iso }) => {
          const isToday = iso === TODAY_ISO;
          const dayTasks = dayIndex[iso] || [];
          const dayInvs = (invDayIndex[iso] || []);
          return (
            <div key={iso} className={`border-r border-line last:border-r-0 p-1.5 space-y-1.5 ${isToday ? "bg-blue-50/20" : ""}`}>
              {dayInvs.map(inv => (
                <WeekInvoiceCard key={inv.invoice_id} inv={inv} onClick={onSelect} />
              ))}
              {dayTasks.map(t => (
                <WeekTaskCard key={t.task_id} task={t} isOnCP={criticalIds.has(t.task_id)} onClick={onSelect} />
              ))}
              {dayTasks.length === 0 && dayInvs.length === 0 && (
                <div className="text-[9.5px] text-ink-300 text-center pt-4">—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ tasks, criticalIds, onSelect }) {
  const grouped = useMemo(() => {
    const g = {};
    for (const cat of CAT_ORDER) g[cat] = [];
    for (const t of tasks) { const cat = taskCat(t); if (g[cat]) g[cat].push(t); }
    for (const cat of CAT_ORDER) g[cat].sort((a, b) => {
      const pA = a.priority === "P0" ? 0 : a.priority === "P1" ? 1 : 2;
      const pB = b.priority === "P0" ? 0 : b.priority === "P1" ? 1 : 2;
      if (pA !== pB) return pA - pB;
      return a.start_date.localeCompare(b.start_date);
    });
    return g;
  }, [tasks]);

  return (
    <div className="space-y-3">
      {CAT_ORDER.map(cat => {
        const items = grouped[cat];
        if (!items.length) return null;
        const c = CAT[cat]; const Icon = c.Icon;
        return (
          <div key={cat} className={`panel border ${c.section}`}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
              <Icon className={`h-3.5 w-3.5 ${c.header}`} />
              <span className={`text-[11px] font-bold uppercase tracking-wider ${c.header}`}>{c.label}</span>
              <span className="text-[10.5px] text-ink-500 ml-1">{items.length} task{items.length !== 1 ? "s" : ""}</span>
              <span className="ml-auto text-[10px] text-ink-400">
                {items.filter(t => t.priority === "P0").length} P0 · {items.filter(isAtRisk).length} at risk · {items.filter(t => criticalIds.has(t.task_id)).length} on critical path
              </span>
            </div>
            <div className="divide-y divide-line">
              {items.map(t => {
                const risk = isAtRisk(t); const isOnCP = criticalIds.has(t.task_id);
                const isMultiDay = t.start_date !== t.end_date;
                return (
                  <button key={t.task_id} type="button" onClick={() => onSelect({ kind: "task", item: t })}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-white/70 transition-colors ${risk ? "bg-red-50/30" : ""}`}>
                    <span className={`shrink-0 mt-0.5 ${t.status === "completed" ? "text-green-500" : risk ? "text-red-400" : "text-ink-300"}`}>
                      {t.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[12px] font-medium truncate ${t.status === "completed" ? "line-through text-ink-400" : "text-ink-900"}`}>
                          {risk && <span className="text-red-500 mr-0.5">⚠ </span>}
                          {isOnCP && !risk && <span className="text-amber-500 mr-0.5">◆ </span>}
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
                      {isOnCP && <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">CP</span>}
                      <PriBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      <span className="text-[10.5px] text-ink-500 min-w-[52px] text-right">
                        {fmtDate(t.start_date)}{isMultiDay && <span className="text-ink-300"> →</span>}
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
  const [viewYear, setViewYear]   = useState(() => DEMO_TODAY.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(() => DEMO_TODAY.getUTCMonth());
  const [viewMode, setViewMode]   = useState("month"); // month | week | list
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterCat, setFilterCat] = useState("all");
  const [showCP, setShowCP]       = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const criticalIds = useMemo(() => computeCriticalPath(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    if (filterCat === "all") return tasks;
    if (filterCat === "at_risk") return tasks.filter(isAtRisk);
    if (filterCat === "critical_path") return tasks.filter(t => criticalIds.has(t.task_id));
    return tasks.filter(t => taskCat(t) === filterCat);
  }, [tasks, filterCat, criticalIds]);

  const pastDueInvoices = useMemo(() => invoices.filter(i => i.status === "past_due"), [invoices]);

  const { viewStart, viewEnd } = useMemo(() => {
    const allMs = [
      ...beats.flatMap(b => [parseISO(b.start_date).getTime(), parseISO(b.end_date).getTime()]),
      ...tasks.flatMap(t => [parseISO(t.start_date).getTime(), parseISO(t.end_date).getTime()]),
    ];
    if (!allMs.length) return { viewStart: DEMO_TODAY.getTime(), viewEnd: DEMO_TODAY.getTime() };
    return { viewStart: Math.min(...allMs), viewEnd: Math.max(...allMs) };
  }, [beats, tasks]);

  const catCounts = useMemo(() => {
    const c = { all: tasks.length, at_risk: tasks.filter(isAtRisk).length, critical_path: criticalIds.size };
    for (const cat of CAT_ORDER) c[cat] = tasks.filter(t => taskCat(t) === cat).length;
    return c;
  }, [tasks, criticalIds]);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }

  return (
    <div className="space-y-4">
      {/* Alert strip */}
      <AlertStrip tasks={tasks} pastDueInvoices={pastDueInvoices} onSelect={setDetailItem} />

      {/* Beat timeline */}
      <BeatTimeline beats={beats} viewStart={viewStart} viewEnd={viewEnd} brandColor={title.brand_color} />

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View mode */}
        <div className="flex items-center border border-line rounded-md overflow-hidden">
          {[{ key: "month", Icon: CalendarDays, label: "Month" }, { key: "week", Icon: CalendarDays, label: "Week" }, { key: "list", Icon: List, label: "List" }].map(({ key, Icon, label }) => (
            <button key={key} type="button" onClick={() => setViewMode(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium transition-colors border-r border-line last:border-r-0 ${viewMode === key ? "bg-accent-primary text-white" : "text-ink-600 hover:bg-slate-50"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Critical path toggle */}
        <button type="button" onClick={() => { setShowCP(s => !s); if (filterCat !== "critical_path") {} }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium rounded-md border transition-colors ${showCP ? "bg-amber-500 text-white border-amber-500" : "border-line text-ink-600 hover:border-amber-300 hover:text-amber-700"}`}>
          <GitBranch className="h-3.5 w-3.5" />Critical path
        </button>

        {/* Category filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "at_risk", label: "⚠ At risk" },
            { key: "critical_path", label: "◆ Critical path" },
            ...CAT_ORDER.map(k => ({ key: k, label: CAT[k].label })),
          ].map(({ key, label }) => {
            const active = filterCat === key;
            const activeClass = key === "at_risk" ? "bg-red-600 text-white border-red-600" : key === "critical_path" ? "bg-amber-500 text-white border-amber-500" : key === "production" ? "bg-red-500 text-white border-red-500" : key === "execution" ? "bg-emerald-600 text-white border-emerald-600" : key === "budget" ? "bg-amber-500 text-white border-amber-500" : key === "kpi" ? "bg-indigo-600 text-white border-indigo-600" : "bg-accent-primary text-white border-accent-primary";
            return (
              <button key={key} type="button" onClick={() => setFilterCat(key)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${active ? activeClass : "border-line text-ink-600 hover:border-ink-300 hover:text-ink-800"}`}>
                {label}<span className="ml-1 opacity-70 text-[10px]">{catCounts[key]}</span>
              </button>
            );
          })}
        </div>

        {/* Nav controls */}
        <div className="flex items-center gap-1 ml-auto">
          {viewMode === "month" && (
            <>
              <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-ink-500 hover:text-ink-800"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-[12.5px] font-semibold text-ink-800 min-w-[130px] text-center">{monthLabel(viewYear, viewMonth)}</span>
              <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-ink-500 hover:text-ink-800"><ChevronRight className="h-4 w-4" /></button>
            </>
          )}
          {viewMode === "week" && (
            <>
              <button type="button" onClick={() => setWeekOffset(0)} className="px-2 py-1 text-[11px] rounded border border-line text-ink-600 hover:bg-slate-50">This week</button>
              <button type="button" onClick={() => setWeekOffset(w => w - 1)} className="p-1 rounded hover:bg-slate-100 text-ink-500"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-[12px] font-semibold text-ink-800 min-w-[160px] text-center">{weekRangeLabel(weekDays)}</span>
              <button type="button" onClick={() => setWeekOffset(w => w + 1)} className="p-1 rounded hover:bg-slate-100 text-ink-500"><ChevronRight className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[10.5px] text-ink-600">
        <span className="font-semibold text-[9.5px] uppercase tracking-wider text-ink-400">Category:</span>
        {CAT_ORDER.map(cat => (
          <span key={cat} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${CAT[cat].solid}`} />{CAT[cat].label}</span>
        ))}
        <span className="flex items-center gap-1 ml-2"><span className="text-[9px] font-bold text-amber-500">◆</span>Critical path</span>
        <span className="flex items-center gap-1"><span className="text-[9px] font-bold text-red-500">⚠</span>At risk</span>
        <span className="flex items-center gap-1"><DollarSign className="h-2.5 w-2.5 text-amber-500" />Invoice due</span>
      </div>

      {/* Critical path panel */}
      {showCP && <CriticalPathPanel tasks={tasks} criticalIds={criticalIds} />}

      {/* Main views */}
      {viewMode === "month" && (
        <CalendarGrid tasks={filteredTasks} invoices={invoices} year={viewYear} month={viewMonth} criticalIds={criticalIds} onSelect={setDetailItem} />
      )}
      {viewMode === "week" && (
        <WeekView tasks={filteredTasks} invoices={invoices} weekOffset={weekOffset} criticalIds={criticalIds} onSelect={setDetailItem} />
      )}
      {viewMode === "list" && (
        <ListView tasks={filteredTasks} criticalIds={criticalIds} onSelect={setDetailItem} />
      )}

      {/* Detail panel */}
      {detailItem && (
        <DetailPanel
          detailItem={detailItem}
          allBeats={beats}
          allTickets={tickets}
          allInvoices={invoices}
          tasks={tasks}
          criticalIds={criticalIds}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
