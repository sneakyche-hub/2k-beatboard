"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  standup,
  titles,
  tickets,
  escalationDrafts,
  beats,
  fmtDate,
  DEMO_TODAY_ISO,
  buildInboxItems,
} from "@/lib/data";
import Badge from "./Badge";
import JiraLink from "./JiraLink";
import {
  Sparkles,
  AlertOctagon,
  Gauge,
  Phone,
  ListChecks,
  Copy,
  Printer,
  ArrowLeft,
  Check,
  Timer,
  FileText,
  RotateCcw,
  CheckCircle2,
  CornerDownRight,
  MapPin,
  Plus,
  X,
  Mail,
  ChevronDown,
  ExternalLink,
  Paperclip,
  Building2,
  UserCheck,
  User,
  Link2,
  Hammer,
  TrendingDown,
  Zap,
  DollarSign,
  Wrench,
  AlertTriangle,
  StickyNote,
  Edit3,
  ArrowUpRight,
} from "lucide-react";

// -------------------------------------------------------------------
// StandupAgenda
//
// Live-meeting view of the daily standup for the core GTM trio:
// Davide Detta (Sr Mgr) + Alex Akiyama (Mgr, NA) + Marketing Mgr II.
//
// Target: 15-20 min total. Four time-boxed sections (5+5+4+2 = 16 min
// inside an 18 min target), plus a Parking Lot capture below.
//
// Ticket drawer: every agenda item linked to a ticket shows a clickable
// chip that expands an inline detail panel — blocker type (exec sign-off /
// external vendor / internal team), owner, vendor, attachments, source
// provenance, and escalation draft link.
// -------------------------------------------------------------------

const TRIO = ["Davide Detta", "Alex Akiyama", "Marketing Mgr II", "Alex"];
const TRIO_OPTIONS = ["Alex", "Davide", "Mgr II"];

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

function isTrio(name) {
  if (!name) return false;
  return TRIO.some((n) => name.toLowerCase().includes(n.toLowerCase()));
}

const DECISION_STATUS_LABEL = {
  awaiting_decision: "Awaiting",
  held: "Held",
  decide_today: "Decide today",
};

const DECISION_STATUS_TONE = {
  awaiting_decision: "amber",
  held: "red",
  decide_today: "amber",
};

const DECISION_STATUS_RANK = {
  decide_today: 0,
  awaiting_decision: 1,
  held: 2,
};

const YESTERDAY_STATUS_LABEL = {
  done: "Done",
  carried_over: "Carrying over",
  dropped: "Dropped",
};

const YESTERDAY_STATUS_TONE = {
  done: "success",
  carried_over: "amber",
  dropped: "red",
};

const YESTERDAY_STATUS_RANK = {
  carried_over: 0,
  dropped: 1,
  done: 2,
};

// -------------------------------------------------------------------
// Ticket helpers
// -------------------------------------------------------------------

const PRIORITY_TONE = { P0: "red", P1: "amber", P2: "neutral" };

const STATUS_DISPLAY = {
  open:        { label: "Open",        tone: "neutral"  },
  in_progress: { label: "In progress", tone: "primary"  },
  at_risk:     { label: "At risk",     tone: "red"      },
  blocked:     { label: "Blocked",     tone: "red"      },
  completed:   { label: "Completed",   tone: "success"  },
  scheduled:   { label: "Scheduled",   tone: "neutral"  },
};

const ATTACHMENT_TYPE_LABEL = {
  sow:             "SOW",
  brief:           "Brief",
  deck:            "Deck",
  spreadsheet:     "Data",
  contract:        "Contract",
  vendor_invoice:  "Invoice",
  creative_master: "Creative",
  cohort_export:   "Export",
  screenshot:      "Screenshot",
};

// Blocker category: production/input issue vs KPI decision vs exec approval.
// Execution-first sort: production_input → exec_approval → kpi_decision → internal.
const BLOCKER_CATEGORY = {
  production_input: {
    label:     "Production block",
    icon:      Hammer,
    chipClass: "bg-red-50 text-red-700 border border-red-200",
  },
  exec_approval: {
    label:     "Exec sign-off",
    icon:      UserCheck,
    chipClass: "bg-violet-50 text-violet-700 border border-violet-200",
  },
  kpi_decision: {
    label:     "KPI decision",
    icon:      TrendingDown,
    chipClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  },
  internal: {
    label:     "Internal handoff",
    icon:      User,
    chipClass: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

const BLOCKER_CATEGORY_RANK = {
  production_input: 0,
  exec_approval:    1,
  kpi_decision:     2,
  internal:         3,
};

// Action item type: execution (operational, ships today) vs decision_prep (readying a decision).
// Execution sorts first.
const ACTION_CATEGORY_RANK = { execution: 0, decision_prep: 1 };
const ACTION_CATEGORY_LABEL = { execution: "Execution", decision_prep: "Decision prep" };

// Operational category for calls and outbound inbox items.
// Priority: production → execution → budget → kpi (deprioritized — awareness, not action).
const OP_CATEGORY = {
  production: {
    label:     "Production",
    icon:      Wrench,
    chipClass: "bg-red-50 text-red-700 border border-red-200",
    headerClass: "text-red-700",
  },
  execution: {
    label:     "Execution",
    icon:      Zap,
    chipClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    headerClass: "text-emerald-700",
  },
  budget: {
    label:     "Budget",
    icon:      DollarSign,
    chipClass: "bg-amber-50 text-amber-700 border border-amber-200",
    headerClass: "text-amber-700",
  },
  kpi: {
    label:     "KPI",
    icon:      TrendingDown,
    chipClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    headerClass: "text-indigo-600",
  },
};

const OP_CATEGORY_ORDER = ["production", "execution", "budget", "kpi"];
const OP_CATEGORY_RANK = { production: 0, execution: 1, budget: 2, kpi: 3 };

function getTicket(ticketId) {
  if (!ticketId) return null;
  return tickets.find((t) => t.ticket_id === ticketId) || null;
}

function getDraft(ticketId) {
  if (!ticketId) return null;
  return escalationDrafts.find((d) => d.related_ticket_id === ticketId) || null;
}

function getBeatName(beatId) {
  if (!beatId) return null;
  const beat = beats.find((b) => b.beat_id === beatId);
  return beat?.beat_name || null;
}

// Maps ticket.source field to a human label + inbox deep-link
function parseSource(source) {
  if (!source) return null;
  if (source.startsWith("slack:"))  return { label: "Slack",          href: "/inbox" };
  if (source.startsWith("zoom:"))   return { label: "Zoom call",       href: "/inbox" };
  if (source.startsWith("gmail:") || source === "from_heaven_email")
                                    return { label: "Gmail",           href: "/inbox" };
  if (source.startsWith("from_zoom_transcript"))
                                    return { label: "Zoom transcript", href: "/inbox" };
  return null;
}

function fmtFileSize(sizeKb) {
  if (!sizeKb) return "";
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${sizeKb} KB`;
}

function daysOpenLabel(createdDate) {
  if (!createdDate) return null;
  const today = new Date(DEMO_TODAY_ISO + "T00:00:00Z");
  const created = new Date(createdDate + "T00:00:00Z");
  const days = Math.floor((today - created) / 86400000);
  if (days === 0) return "opened today";
  if (days === 1) return "1d open";
  return `${days}d open`;
}

// -------------------------------------------------------------------
// useMeetingState — client-only meeting state (resolved items +
// parking lot). Persisted to localStorage by standup_date so a
// refresh mid-meeting doesn't lose state. Safe SSR: initial render
// is empty state; localStorage loads on mount via useEffect.
// -------------------------------------------------------------------
function useMeetingState(standupDate) {
  const storageKey = `beatboard:standup:${standupDate}`;
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState({
    resolved: {},
    parked: [],
    notes: {},
    followUps: [],
  });

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({
          resolved:   parsed.resolved   || {},
          parked:     parsed.parked     || [],
          notes:      parsed.notes      || {},
          followUps:  parsed.followUps  || [],
        });
      }
    } catch (e) {
      // localStorage unavailable / parse fail — fall through to empty
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      // quota / privacy mode — swallow
    }
  }, [state, storageKey, hydrated]);

  const toggleResolved = (id) =>
    setState((s) => ({
      ...s,
      resolved: { ...s.resolved, [id]: !s.resolved[id] },
    }));

  const addParked = (text, raisedBy) => {
    if (!text || !text.trim()) return;
    const item = {
      id: `park_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      raised_by: raisedBy || "Alex",
      raised_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, parked: [...s.parked, item] }));
  };

  const removeParked = (id) =>
    setState((s) => ({ ...s, parked: s.parked.filter((p) => p.id !== id) }));

  // --- Notes ---
  const setNote = (itemId, text) =>
    setState((s) => ({
      ...s,
      notes: text ? { ...s.notes, [itemId]: text } : Object.fromEntries(
        Object.entries(s.notes).filter(([k]) => k !== itemId)
      ),
    }));

  const getNote = (itemId) => state.notes[itemId] || "";

  // --- Follow-ups ---
  const addFollowUp = (text, source, assignee) => {
    if (!text?.trim()) return;
    const item = {
      id: `fu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      source: source || null,
      assignee: assignee || "Alex",
      done: false,
      created_at: new Date().toISOString(),
    };
    setState((s) => ({ ...s, followUps: [...s.followUps, item] }));
  };

  const toggleFollowUp = (id) =>
    setState((s) => ({
      ...s,
      followUps: s.followUps.map((f) =>
        f.id === id ? { ...f, done: !f.done } : f
      ),
    }));

  const removeFollowUp = (id) =>
    setState((s) => ({
      ...s,
      followUps: s.followUps.filter((f) => f.id !== id),
    }));

  const updateFollowUp = (id, text) =>
    setState((s) => ({
      ...s,
      followUps: s.followUps.map((f) =>
        f.id === id ? { ...f, text } : f
      ),
    }));

  const updateFollowUpAssignee = (id, assignee) =>
    setState((s) => ({
      ...s,
      followUps: s.followUps.map((f) =>
        f.id === id ? { ...f, assignee } : f
      ),
    }));

  const resetAll = () =>
    setState({ resolved: {}, parked: [], notes: {}, followUps: [] });

  return {
    hydrated,
    isResolved: (id) => !!state.resolved[id],
    resolvedCount: (ids) => ids.filter((id) => state.resolved[id]).length,
    toggleResolved,
    parked: state.parked,
    addParked,
    removeParked,
    getNote,
    setNote,
    followUps: state.followUps,
    addFollowUp,
    toggleFollowUp,
    removeFollowUp,
    updateFollowUp,
    updateFollowUpAssignee,
    resetAll,
  };
}

export default function StandupAgenda() {
  const [copied, setCopied] = useState(false);

  // All sections collapsed by default — overview strip shows the full
  // agenda at a glance; expand each section as you reach it.
  const [sectionOpen, setSectionOpen] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false, // follow-ups
    6: false, // parking lot
  });

  // Tracks which ticket drawer is open: "b:{ticket_id}", "c:{idx}",
  // "a:{ticket_id}". One open at a time; clicking same key closes it.
  const [openDrawerKey, setOpenDrawerKey] = useState(null);
  const toggleDrawer = (key) =>
    setOpenDrawerKey((prev) => (prev === key ? null : key));

  const meeting = useMeetingState(standup.standup_date);

  const brief = standup.standup_brief;
  const blockers = brief.blockers || [];

  // Sort execution-first: production blocks → exec approvals → KPI decisions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedBlockers = useMemo(
    () =>
      [...blockers].sort(
        (a, b) =>
          (BLOCKER_CATEGORY_RANK[a.blocker_category] ?? 9) -
          (BLOCKER_CATEGORY_RANK[b.blocker_category] ?? 9)
      ),
    [] // blockers is from a static JSON import — never changes at runtime
  );

  const decisions = useMemo(() => {
    return [...(standup.pending_decisions || [])]
      .filter(
        (d) =>
          d.status === "awaiting_decision" ||
          d.status === "decide_today" ||
          d.status === "held"
      )
      .sort((a, b) => {
        const r =
          (DECISION_STATUS_RANK[a.status] ?? 9) -
          (DECISION_STATUS_RANK[b.status] ?? 9);
        if (r !== 0) return r;
        return (a.decision_date || "").localeCompare(b.decision_date || "");
      });
  }, []);

  const calls = brief.today_calls || [];

  const p0Inbox = useMemo(() => {
    return buildInboxItems()
      .filter((it) => it.priority === "P0")
      .sort((a, b) => {
        // Primary: op category (production → execution → budget → kpi)
        const rCat = (OP_CATEGORY_RANK[a.opCategory] ?? 9) - (OP_CATEGORY_RANK[b.opCategory] ?? 9);
        if (rCat !== 0) return rCat;
        // Secondary: channel type (draft → gmail → slack)
        const order = { draft: 0, gmail: 1, slack: 2, transcript: 3, activity: 4 };
        return (order[a.type] ?? 9) - (order[b.type] ?? 9);
      });
  }, []);

  // Sort execution actions before decision-prep actions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const actionItems = useMemo(
    () =>
      [...(brief.today_priorities || [])].sort(
        (a, b) =>
          (ACTION_CATEGORY_RANK[a.action_category] ?? 9) -
          (ACTION_CATEGORY_RANK[b.action_category] ?? 9)
      ),
    [] // brief is from a static JSON import — never changes at runtime
  );

  const yesterdayItems = useMemo(() => {
    return [...(standup.yesterday_action_items || [])].sort(
      (a, b) =>
        (YESTERDAY_STATUS_RANK[a.status] ?? 9) -
        (YESTERDAY_STATUS_RANK[b.status] ?? 9)
    );
  }, []);

  const yesterdayCounts = useMemo(() => {
    const c = { done: 0, carried_over: 0, dropped: 0 };
    for (const it of yesterdayItems) c[it.status] = (c[it.status] || 0) + 1;
    return c;
  }, [yesterdayItems]);

  // Stable item IDs for resolve state — keyed by ticket ID so sort order
  // changes don't reset checkmarks mid-meeting.
  const blockerIds = blockers.map((b, i) => `blocker:${b.linked_ticket_id || i}`);
  const decisionIds = decisions.map((d) => `decision:${d.decision_id}`);
  const callIds = calls.map((_, i) => `call:${i}`);
  const inboxIds = p0Inbox.map((it) => `inbox:${it.id}`);
  const actionIds = actionItems.map((a, i) => `action:${a.linked_ticket_id || i}`);

  // Section definitions used for the overview strip
  const sectionDefs = [
    {
      n: 1,
      label: "Blockers needing the room",
      shortLabel: "Blockers",
      time: 5,
      count: blockers.length,
      tone: "red",
      resolvedCount: meeting.resolvedCount(blockerIds),
    },
    {
      n: 2,
      label: "Decisions on the table",
      shortLabel: "Decisions",
      time: 5,
      count: decisions.length,
      tone: "amber",
      resolvedCount: meeting.resolvedCount(decisionIds),
    },
    {
      n: 3,
      label: "External touchpoints",
      shortLabel: "Touchpoints",
      time: 4,
      count: calls.length + p0Inbox.length,
      tone: "primary",
      resolvedCount: meeting.resolvedCount([...callIds, ...inboxIds]),
    },
    {
      n: 4,
      label: "Action items out",
      shortLabel: "Actions",
      time: 2,
      count: actionItems.length,
      tone: "success",
      resolvedCount: meeting.resolvedCount(actionIds),
    },
  ];

  const totalMinutes = sectionDefs.reduce((sum, s) => sum + s.time, 0);

  const toggleSection = (n) =>
    setSectionOpen((s) => ({ ...s, [n]: !s[n] }));

  const mainSectionsOpen = [1, 2, 3, 4].every((n) => sectionOpen[n]);
  const toggleAll = () => {
    const next = !mainSectionsOpen;
    setSectionOpen((s) => ({ ...s, 1: next, 2: next, 3: next, 4: next, 5: next }));
  };

  const handleCopy = async () => {
    const md = buildAgendaDigest({
      standup,
      blockers,
      decisions,
      calls,
      p0Inbox,
      actionItems,
      yesterdayCounts,
      followUps: meeting.followUps,
    });
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
      document.body.removeChild(ta);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleReset = () => {
    if (typeof window === "undefined") return;
    if (window.confirm("Clear today's resolved items and parking lot?")) {
      meeting.resetAll();
    }
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1100px] mx-auto space-y-5 agenda-root">
      <style jsx global>{`
        @media print {
          aside, nav, .agenda-actions, .agenda-back, .resolve-btn, .park-form { display: none !important; }
          .agenda-root { padding: 0 !important; max-width: 100% !important; }
          .panel { box-shadow: none !important; border-color: #d1d5db !important; break-inside: avoid; }
          section { break-inside: avoid; }
          body { background: white !important; }
        }
      `}</style>

      <Link
        href="/"
        className="agenda-back inline-flex items-center gap-1.5 text-[11.5px] text-ink-500 hover:text-accent-primary"
      >
        <ArrowLeft className="h-3 w-3" /> Back to full standup
      </Link>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-accent-primary" />
            Daily standup agenda · NA Integrated Marketing
          </div>
          <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1 leading-tight">
            {fmtDate(standup.standup_date, { year: true })}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] mono font-semibold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
              <Timer className="h-3 w-3" /> 18 min target
            </span>
            <span className="text-[12px] text-ink-500">
              Trio: Davide · Alex · Marketing Mgr II
            </span>
          </div>
        </div>
        <div className="agenda-actions flex items-center gap-2 shrink-0">
          <Link
            href="/brief/digest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Full digest
          </Link>
          <Link
            href="/brief/weekly"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Weekly update
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-accent-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy agenda
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Clear today's resolved items + parking lot"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-500 hover:border-accent-red hover:text-accent-red transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Yesterday's commitments */}
      {yesterdayItems.length > 0 && (
        <YesterdayPanel items={yesterdayItems} counts={yesterdayCounts} />
      )}

      {/* Context strip */}
      <section className="panel p-4">
        <p className="text-[13px] leading-relaxed text-ink-700">
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mr-1.5">
            Context
          </span>
          {standup.portfolio_health_summary}
        </p>
      </section>

      {/* Agenda overview */}
      <section className="panel p-4">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
              Agenda
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] mono font-semibold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
              <Timer className="h-3 w-3" /> {totalMinutes} min
            </span>
          </div>
          <button
            type="button"
            onClick={toggleAll}
            className="text-[11.5px] text-accent-primary hover:underline font-medium"
          >
            {mainSectionsOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
        <div className="divide-y divide-line">
          {sectionDefs.map((s) => {
            const toneColor = {
              red: "text-accent-red",
              amber: "text-accent-amber",
              primary: "text-accent-primary",
              success: "text-accent-success",
            }[s.tone] || "text-ink-700";

            const isOpen = sectionOpen[s.n];
            const allResolved = s.count > 0 && s.resolvedCount === s.count;
            const someResolved = s.resolvedCount > 0 && s.resolvedCount < s.count;

            return (
              <button
                key={s.n}
                type="button"
                onClick={() => toggleSection(s.n)}
                className={`w-full flex items-center gap-3 py-2.5 px-1 text-left transition-colors group hover:bg-ink-100/30 rounded-md ${
                  isOpen ? "bg-ink-100/20" : ""
                }`}
              >
                <span className="mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700 shrink-0 w-5 text-center">
                  {s.n}
                </span>
                <span className={`text-[13px] font-medium flex-1 min-w-0 ${isOpen ? toneColor : "text-ink-700"}`}>
                  {s.label}
                </span>
                {allResolved ? (
                  <span className="text-[11px] mono text-accent-success font-semibold shrink-0">
                    All resolved
                  </span>
                ) : someResolved ? (
                  <span className="text-[11px] mono text-ink-500 shrink-0">
                    {s.resolvedCount}/{s.count}
                  </span>
                ) : (
                  <span className="text-[11px] mono text-ink-500 shrink-0">
                    {s.count} {s.count === 1 ? "item" : "items"}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] mono font-semibold text-ink-500 shrink-0 w-14 justify-end">
                  <Timer className="h-3 w-3" /> {s.time} min
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-400 transition-transform shrink-0 ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* 1. Blockers needing the room — 5 min */}
      {blockers.length > 0 && (
        <AgendaSection
          number={1}
          title="Blockers needing the room"
          timeBox="5 min"
          tone="red"
          Icon={AlertOctagon}
          totalCount={blockers.length}
          resolvedCount={meeting.resolvedCount(blockerIds)}
          open={sectionOpen[1]}
          onToggle={() => toggleSection(1)}
        >
          {/* Category breakdown — quick scan of what type of blockers the room faces */}
          <BlockerBreakdown blockers={blockers} />

          <ul className="space-y-2.5">
            {sortedBlockers.map((b, i) => {
              const id = `blocker:${b.linked_ticket_id || i}`;
              const resolved = meeting.isResolved(id);
              const t = titleForId(b.title_id);
              const inRoom = isTrio(b.needed_from);
              const ticket = getTicket(b.linked_ticket_id);
              const drawerKey = `b:${b.linked_ticket_id || i}`;
              const isDrawerOpen = openDrawerKey === drawerKey;

              return (
                <ResolvableRow
                  key={b.linked_ticket_id || i}
                  id={id}
                  resolved={resolved}
                  onToggle={meeting.toggleResolved}
                  bulletColor="text-accent-red"
                  drawer={
                    ticket && isDrawerOpen ? (
                      <TicketDrawer ticket={ticket} blockerCategory={b.blocker_category} />
                    ) : undefined
                  }
                  noteSlot={
                    <ItemNote
                      itemId={id}
                      itemLabel={`${t?.title_name || b.title_id} blocker${b.linked_ticket_id ? ` · ${b.linked_ticket_id}` : ""}`}
                      meeting={meeting}
                    />
                  }
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {t && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold"
                        style={{ color: t.brand_color }}
                      >
                        {t.title_name}
                      </span>
                    )}
                    <span className={resolved ? "text-ink-700 line-through" : "text-ink-900"}>
                      {b.blocker}
                    </span>
                    {resolved ? (
                      <Badge tone="success" size="xs">Resolved</Badge>
                    ) : inRoom ? (
                      <Badge tone="red" size="xs">Unblock in room</Badge>
                    ) : (
                      <Badge tone="amber" size="xs">Escalation path</Badge>
                    )}
                  </div>
                  <div className="text-[11.5px] text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    {b.blocker_category && (
                      <BlockerCategoryChip category={b.blocker_category} />
                    )}
                    <span>
                      Owner: <span className="text-ink-700">{b.owner}</span>
                    </span>
                    <span>
                      Needs <span className="text-ink-700">{b.needed_from}</span>{" "}
                      by <span className="text-ink-700 mono">{fmtDate(b.by)}</span>
                    </span>
                    {ticket && (
                      <TicketChip
                        ticketId={b.linked_ticket_id}
                        isOpen={isDrawerOpen}
                        onToggle={() => toggleDrawer(drawerKey)}
                      />
                    )}
                  </div>
                </ResolvableRow>
              );
            })}
          </ul>
        </AgendaSection>
      )}

      {/* 2. Decisions on the table — 5 min */}
      {decisions.length > 0 && (
        <AgendaSection
          number={2}
          title="Decisions on the table"
          timeBox="5 min"
          tone="amber"
          Icon={Gauge}
          totalCount={decisions.length}
          resolvedCount={meeting.resolvedCount(decisionIds)}
          open={sectionOpen[2]}
          onToggle={() => toggleSection(2)}
        >
          <ul className="space-y-2.5">
            {decisions.map((d) => {
              const id = `decision:${d.decision_id}`;
              const resolved = meeting.isResolved(id);
              const t = titleForId(d.title_id);
              const tone = DECISION_STATUS_TONE[d.status] || "neutral";
              const needsDavide = d.decision_owner === "Davide Detta";
              return (
                <ResolvableRow
                  key={d.decision_id}
                  id={id}
                  resolved={resolved}
                  onToggle={meeting.toggleResolved}
                  bulletColor="text-accent-amber"
                  noteSlot={
                    <ItemNote
                      itemId={id}
                      itemLabel={`Decision: ${d.decision.slice(0, 60)}${d.decision.length > 60 ? "…" : ""}`}
                      meeting={meeting}
                    />
                  }
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {t && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold"
                        style={{ color: t.brand_color }}
                      >
                        {t.title_name}
                      </span>
                    )}
                    <span className={resolved ? "font-semibold text-ink-700 line-through" : "font-semibold text-ink-900"}>
                      {d.decision}
                    </span>
                    {resolved ? (
                      <Badge tone="success" size="xs">Discussed</Badge>
                    ) : (
                      <>
                        <Badge tone={tone} size="xs">
                          {DECISION_STATUS_LABEL[d.status] || d.status}
                        </Badge>
                        {needsDavide && (
                          <Badge tone="violet" size="xs">Needs Davide GO/NO-GO</Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-[11.5px] text-ink-500 mt-0.5">
                    Owner: <span className="text-ink-700">{d.decision_owner}</span>{" "}
                    · By <span className="text-ink-700 mono">{fmtDate(d.decision_date)}</span>
                    {d.tranche_amount_usd > 0 && (
                      <>
                        {" "}
                        · Tranche{" "}
                        <span className="text-ink-700 mono">
                          ${(d.tranche_amount_usd / 1000).toFixed(0)}K
                        </span>
                      </>
                    )}
                  </div>
                </ResolvableRow>
              );
            })}
          </ul>
        </AgendaSection>
      )}

      {/* 3. Today's external touchpoints — 4 min */}
      {(calls.length > 0 || p0Inbox.length > 0) && (
        <AgendaSection
          number={3}
          title="Today's external touchpoints"
          timeBox="4 min"
          tone="primary"
          Icon={Phone}
          totalCount={calls.length + p0Inbox.length}
          resolvedCount={meeting.resolvedCount([...callIds, ...inboxIds])}
          open={sectionOpen[3]}
          onToggle={() => toggleSection(3)}
        >
          {/* Category breakdown across calls + outbound actions */}
          <TouchpointBreakdown calls={calls} p0Inbox={p0Inbox} />

          {/* Calls — kept in time order since they're calendar-anchored */}
          {calls.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
                Calls ({calls.length})
              </div>
              <ul className="space-y-2">
                {calls.map((c, i) => {
                  const id = `call:${i}`;
                  const resolved = meeting.isResolved(id);
                  const ticket = getTicket(c.linked_ticket_id);
                  const drawerKey = `c:${c.linked_ticket_id || i}`;
                  const isDrawerOpen = openDrawerKey === drawerKey;
                  const catDef = c.call_category ? OP_CATEGORY[c.call_category] : null;
                  const prepOutstanding = c.prep_status === "outstanding";

                  return (
                    <ResolvableRow
                      key={i}
                      id={id}
                      resolved={resolved}
                      onToggle={meeting.toggleResolved}
                      bullet={
                        <span className="mono text-[12px] font-semibold text-ink-900 shrink-0 w-16">
                          {c.time_label}
                        </span>
                      }
                      tight
                      drawer={
                        ticket && isDrawerOpen ? (
                          <TicketDrawer ticket={ticket} blockerCategory={null} />
                        ) : undefined
                      }
                      noteSlot={
                        <ItemNote
                          itemId={id}
                          itemLabel={`${c.time_label} ${c.title}`}
                          meeting={meeting}
                        />
                      }
                    >
                      <div className={resolved ? "text-ink-500" : ""}>
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {catDef && (
                            <OpCategoryChip category={c.call_category} />
                          )}
                          <span className={resolved ? "text-ink-500 line-through text-[13px] font-medium" : "text-ink-900 font-medium text-[13px]"}>
                            {c.title}
                          </span>
                          {prepOutstanding && !resolved && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Prep outstanding
                            </span>
                          )}
                        </div>
                        {c.topic && (
                          <div className={resolved ? "text-ink-400 text-[12px] line-through" : "text-ink-500 text-[12px]"}>
                            {c.topic}
                          </div>
                        )}
                        {c.prep_note && prepOutstanding && !resolved && (
                          <div className="text-[11px] text-amber-700 mt-0.5">{c.prep_note}</div>
                        )}
                        {ticket && (
                          <div className="mt-1">
                            <TicketChip
                              ticketId={c.linked_ticket_id}
                              isOpen={isDrawerOpen}
                              onToggle={() => toggleDrawer(drawerKey)}
                            />
                          </div>
                        )}
                      </div>
                    </ResolvableRow>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Outbound actions grouped by category: production → execution → budget → KPI */}
          {p0Inbox.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
                Outbound actions ({p0Inbox.length})
              </div>
              {OP_CATEGORY_ORDER.map((cat) => {
                const catItems = p0Inbox.filter((it) => it.opCategory === cat);
                if (catItems.length === 0) return null;
                const catDef = OP_CATEGORY[cat];
                const CatIcon = catDef.icon;
                const isKpi = cat === "kpi";

                return (
                  <div key={cat} className={`mb-3 ${isKpi ? "opacity-80" : ""}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${catDef.chipClass}`}>
                        <CatIcon className="h-3 w-3" />
                        {catDef.label}
                      </span>
                      {isKpi && (
                        <span className="text-[10px] text-ink-400">awareness · no action needed</span>
                      )}
                    </div>
                    <ul className="space-y-1.5 pl-1">
                      {catItems.map((it) => {
                        const id = `inbox:${it.id}`;
                        const resolved = meeting.isResolved(id);
                        const t = titleForId(it.titleId);
                        const channelLabel = it.type === "draft" ? "Draft" : it.type === "gmail" ? "Gmail" : it.type === "slack" ? "Slack" : it.type;
                        return (
                          <ResolvableRow
                            key={it.id}
                            id={id}
                            resolved={resolved}
                            onToggle={meeting.toggleResolved}
                            bulletColor={isKpi ? "text-ink-300" : "text-accent-primary"}
                            tight
                            noteSlot={
                              !isKpi ? (
                                <ItemNote
                                  itemId={id}
                                  itemLabel={it.headline.slice(0, 60) + (it.headline.length > 60 ? "…" : "")}
                                  meeting={meeting}
                                />
                              ) : undefined
                            }
                          >
                            <span className={resolved ? "opacity-60" : ""}>
                              {t && (
                                <span
                                  className="text-[10px] uppercase tracking-wider font-bold mr-1.5"
                                  style={{ color: t.brand_color }}
                                >
                                  {t.title_name}
                                </span>
                              )}
                              <span className={`text-[10px] mono font-medium mr-1.5 ${isKpi ? "text-ink-400" : "text-ink-500"}`}>
                                {channelLabel}
                              </span>
                              <span className={resolved ? "text-ink-700 line-through" : isKpi ? "text-ink-600" : "text-ink-900"}>
                                {it.headline}
                              </span>
                            </span>
                          </ResolvableRow>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </AgendaSection>
      )}

      {/* 4. Action items out — 2 min */}
      {actionItems.length > 0 && (
        <AgendaSection
          number={4}
          title="Action items out"
          timeBox="2 min"
          tone="success"
          Icon={ListChecks}
          totalCount={actionItems.length}
          resolvedCount={meeting.resolvedCount(actionIds)}
          open={sectionOpen[4]}
          onToggle={() => toggleSection(4)}
        >
          <ul className="space-y-2">
            {actionItems.map((a, i) => {
              const id = `action:${a.linked_ticket_id || i}`;
              const resolved = meeting.isResolved(id);
              const t = titleForId(inferTitleIdFromTicket(a.linked_ticket_id));
              const ticket = getTicket(a.linked_ticket_id);
              const drawerKey = `a:${a.linked_ticket_id || i}`;
              const isDrawerOpen = openDrawerKey === drawerKey;

              return (
                <li key={i} className="text-[13px] leading-relaxed group">
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => meeting.toggleResolved(id)}
                      className={`mt-0.5 shrink-0 transition-colors ${resolved ? "text-accent-success" : "text-ink-500 hover:text-accent-success"}`}
                      aria-label={resolved ? "Mark as not done" : "Mark as done"}
                    >
                      {resolved ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="inline-block h-4 w-4 border-2 border-current rounded-sm" />
                      )}
                    </button>
                    <div className={`min-w-0 flex-1 ${resolved ? "opacity-60" : ""}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.action_category && (
                          <span
                            className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                              a.action_category === "execution"
                                ? "bg-accent-success/10 text-accent-success border border-accent-success/20"
                                : "bg-ink-300/20 text-ink-500 border border-line"
                            }`}
                          >
                            {ACTION_CATEGORY_LABEL[a.action_category] || a.action_category}
                          </span>
                        )}
                        <span className="text-[11px] mono font-semibold text-ink-900 px-1.5 py-0.5 rounded bg-ink-300/20">
                          {a.owner}
                        </span>
                        {t && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold"
                            style={{ color: t.brand_color }}
                          >
                            {t.title_name}
                          </span>
                        )}
                        {a.linked_ticket_id && ticket && (
                          <TicketChip
                            ticketId={a.linked_ticket_id}
                            isOpen={isDrawerOpen}
                            onToggle={() => !resolved && toggleDrawer(drawerKey)}
                          />
                        )}
                        {a.linked_ticket_id && !ticket && (
                          <span className="text-[11px] mono text-ink-500">
                            {a.linked_ticket_id}
                          </span>
                        )}
                      </div>
                      <p className={resolved ? "text-ink-700 mt-0.5 line-through" : "text-ink-700 mt-0.5"}>
                        {a.task}
                      </p>
                      <ItemNote
                        itemId={id}
                        itemLabel={`${a.owner}: ${a.task.slice(0, 60)}${a.task.length > 60 ? "…" : ""}`}
                        meeting={meeting}
                      />
                    </div>
                  </div>
                  {ticket && isDrawerOpen && (
                    <div className="ml-7 mt-2">
                      <TicketDrawer ticket={ticket} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </AgendaSection>
      )}

      {/* 5. Follow-ups from this standup */}
      <FollowUpSection
        followUps={meeting.followUps}
        onAdd={meeting.addFollowUp}
        onToggle={meeting.toggleFollowUp}
        onRemove={meeting.removeFollowUp}
        onUpdate={meeting.updateFollowUp}
        onUpdateAssignee={meeting.updateFollowUpAssignee}
        open={sectionOpen[5]}
        onSectionToggle={() => toggleSection(5)}
      />

      {/* 6. Parking lot */}
      <ParkingLot
        parked={meeting.parked}
        onAdd={meeting.addParked}
        onRemove={meeting.removeParked}
        open={sectionOpen[6]}
        onToggle={() => toggleSection(6)}
      />

      {/* Footer */}
      <footer className="text-[11px] text-ink-500 pt-4 pb-2 text-center border-t border-line">
        Live meeting view ·{" "}
        <Link href="/brief/digest" className="text-accent-primary hover:underline">
          Switch to full digest
        </Link>{" "}
        for the shareable roll-up (TL;DR, risks, yesterday's closeout, tracking).
      </footer>
    </div>
  );
}

// -------------------------------------------------------------------
// BlockerCategoryChip — inline chip showing blocker type in the meta row.
// -------------------------------------------------------------------
function BlockerCategoryChip({ category }) {
  const def = BLOCKER_CATEGORY[category];
  if (!def) return null;
  const Icon = def.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-full font-medium ${def.chipClass}`}
    >
      <Icon className="h-3 w-3" />
      {def.label}
    </span>
  );
}

// -------------------------------------------------------------------
// BlockerBreakdown — compact category summary shown at the top of the
// blockers section. Lets the room see at a glance whether they're
// dealing with production blocks, exec decisions, or KPI gates.
// -------------------------------------------------------------------
function BlockerBreakdown({ blockers }) {
  if (!blockers || blockers.length === 0) return null;

  // Count by category in execution-priority order
  const order = ["production_input", "exec_approval", "kpi_decision", "internal"];
  const counts = blockers.reduce((acc, b) => {
    const cat = b.blocker_category || "internal";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const chips = order.filter((k) => counts[k]).map((k) => ({ key: k, count: counts[k] }));
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3">
      <span className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold shrink-0">
        In this room:
      </span>
      {chips.map(({ key, count }) => {
        const def = BLOCKER_CATEGORY[key];
        if (!def) return null;
        const Icon = def.icon;
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full font-medium ${def.chipClass}`}
          >
            <Icon className="h-3 w-3" />
            {count} {def.label}{count > 1 ? "s" : ""}
          </span>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// OpCategoryChip — shows the operational category (production / execution /
// budget / KPI) on calls and outbound inbox items.
// -------------------------------------------------------------------
function OpCategoryChip({ category }) {
  const def = OP_CATEGORY[category];
  if (!def) return null;
  const Icon = def.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full ${def.chipClass}`}
    >
      <Icon className="h-3 w-3" />
      {def.label}
    </span>
  );
}

// -------------------------------------------------------------------
// TouchpointBreakdown — category mix summary for Section 3.
// Shows counts across both calls and outbound items so the room can
// see at a glance whether today is a production day, a budget day, etc.
// -------------------------------------------------------------------
function TouchpointBreakdown({ calls, p0Inbox }) {
  const totals = {};
  for (const c of calls) {
    if (c.call_category) totals[c.call_category] = (totals[c.call_category] || 0) + 1;
  }
  for (const it of p0Inbox) {
    if (it.opCategory) totals[it.opCategory] = (totals[it.opCategory] || 0) + 1;
  }

  const chips = OP_CATEGORY_ORDER.filter((k) => totals[k]);
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      <span className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold shrink-0">
        Today:
      </span>
      {chips.map((key) => {
        const def = OP_CATEGORY[key];
        const Icon = def.icon;
        const count = totals[key];
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full font-medium ${def.chipClass}`}
          >
            <Icon className="h-3 w-3" />
            {count} {def.label}
          </span>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// TicketChip — small clickable badge that opens the ticket drawer.
// Active state (blue tint + rotated chevron) shows when drawer is open.
// -------------------------------------------------------------------
function TicketChip({ ticketId, isOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`inline-flex items-center gap-1 text-[11px] mono font-semibold px-1.5 py-0.5 rounded transition-colors ${
        isOpen
          ? "bg-accent-primary/15 text-accent-primary"
          : "bg-ink-300/20 text-ink-600 hover:bg-accent-primary/10 hover:text-accent-primary"
      }`}
    >
      {ticketId}
      <ChevronDown
        className={`h-3 w-3 transition-transform ${isOpen ? "" : "-rotate-90"}`}
      />
    </button>
  );
}

// -------------------------------------------------------------------
// TicketDrawer — inline detail panel that expands below an agenda item.
// Shows: ticket ID + Jira link, priority, status, blocker type chip,
// owner/vendor meta, days open, source provenance link, beat name,
// attachments with notes, and escalation draft button.
// -------------------------------------------------------------------
function TicketDrawer({ ticket, blockerCategory }) {
  if (!ticket) return null;

  const draft = getDraft(ticket.ticket_id);
  const openLabel = daysOpenLabel(ticket.created_date);
  const source = parseSource(ticket.source);
  const attachments = ticket.attachments || [];
  const beatName = getBeatName(ticket.beat_id);
  const jiraUrl = `https://2kgames.atlassian.net/browse/${ticket.ticket_id}`;

  const priorityTone = PRIORITY_TONE[ticket.priority] || "neutral";
  const statusDisplay = STATUS_DISPLAY[ticket.status] || {
    label: ticket.status?.replace(/_/g, " ") || "unknown",
    tone: "neutral",
  };
  const catDef = blockerCategory ? BLOCKER_CATEGORY[blockerCategory] : null;

  return (
    <div className="border border-line rounded-lg overflow-hidden bg-white shadow-sm text-[12.5px]">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-100/40 border-b border-line flex-wrap">
        <a
          href={jiraUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mono text-[11.5px] font-bold px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {ticket.ticket_id}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
        <Badge tone={priorityTone} size="xs">{ticket.priority}</Badge>
        <Badge tone={statusDisplay.tone} size="xs">{statusDisplay.label}</Badge>
        {catDef && (
          <span className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full font-medium ${catDef.chipClass}`}>
            <catDef.icon className="h-3 w-3" />
            {catDef.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-3 space-y-2.5">
        {/* Summary */}
        <p className="text-[13px] font-medium text-ink-900 leading-snug">
          {ticket.summary}
        </p>

        {/* Owner / vendor / due / age */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
          <span>
            Owner:{" "}
            <span className="text-ink-700 font-medium">{ticket.owner}</span>
          </span>
          {ticket.vendor_owner && (
            <span>
              Vendor:{" "}
              <span className="text-ink-700 font-medium">{ticket.vendor_owner}</span>
            </span>
          )}
          {ticket.due_date && (
            <span>
              Due:{" "}
              <span className="text-ink-700 font-medium mono">
                {fmtDate(ticket.due_date)}
              </span>
            </span>
          )}
          {openLabel && (
            <span className="mono text-ink-400">{openLabel}</span>
          )}
        </div>

        {/* Source + beat */}
        {(source || beatName) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
            {source && (
              <Link
                href={source.href}
                className="inline-flex items-center gap-1 text-accent-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Link2 className="h-3 w-3" />
                From {source.label}
              </Link>
            )}
            {beatName && (
              <span>
                Beat:{" "}
                <span className="text-ink-600 font-medium">{beatName}</span>
              </span>
            )}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
              <Paperclip className="h-3 w-3" />
              Attachments ({attachments.length})
            </div>
            {attachments.map((att) => (
              <AttachmentRow key={att.attachment_id} att={att} />
            ))}
          </div>
        )}

        {/* Escalation draft */}
        {draft && (
          <div className="pt-2 border-t border-line">
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1.5 text-[12px] text-accent-primary font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Sparkles className="h-3.5 w-3.5" />
              View Claude-drafted {draft.channel} to {draft.recipient}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// AttachmentRow — one line per ticket attachment. Shows type badge,
// uploader, date, size, linked invoice if present, and AP notes.
// -------------------------------------------------------------------
function AttachmentRow({ att }) {
  const typeLabel = ATTACHMENT_TYPE_LABEL[att.type] || att.type;
  const sizeFmt = fmtFileSize(att.size_kb);

  return (
    <div className="flex items-start gap-2">
      <FileText className="h-3.5 w-3.5 text-ink-400 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-ink-700 font-medium break-all leading-snug">
            {att.filename}
          </span>
          <Badge tone="neutral" size="xs">{typeLabel}</Badge>
          {att.po_number && (
            <span className="text-[10.5px] mono text-ink-500">{att.po_number}</span>
          )}
          {att.linked_invoice_id && (
            <span className="text-[10.5px] mono text-accent-primary font-semibold">
              {att.linked_invoice_id}
            </span>
          )}
          {att.amount_usd && (
            <span className="text-[10.5px] mono text-ink-700">
              {att.amount_usd < 0
                ? `-$${(Math.abs(att.amount_usd) / 1000).toFixed(0)}K credit`
                : `$${(att.amount_usd / 1000).toFixed(0)}K`}
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-400 mt-0.5">
          {att.uploaded_by}
          {att.uploaded_at && ` · ${fmtDate(att.uploaded_at)}`}
          {sizeFmt && ` · ${sizeFmt}`}
        </div>
        {att.notes && (
          <div className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1 leading-relaxed border border-amber-100">
            {att.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// YesterdayPanel
// -------------------------------------------------------------------
function YesterdayPanel({ items, counts }) {
  const [open, setOpen] = useState(false);
  const total = items.length;
  const done = counts.done || 0;
  const carrying = counts.carried_over || 0;

  return (
    <section className="panel border-l-4 border-l-ink-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 gap-3 text-left"
      >
        <h2 className="text-[13px] font-bold flex items-center gap-2 text-ink-700">
          <CornerDownRight className="h-4 w-4 text-ink-500" />
          Yesterday's commitments
          <span className="text-[11.5px] text-ink-500 font-normal ml-1">
            <span className="text-accent-success font-semibold">{done}</span> of {total} closed
            {carrying > 0 && (
              <>
                {" · "}
                <span className="text-accent-amber font-semibold">{carrying}</span> carrying over
              </>
            )}
          </span>
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] mono text-ink-500">Mon May 25</span>
          <ChevronDown
            className={`h-4 w-4 text-ink-400 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-line">
          <ul className="space-y-2 pt-3">
            {items.map((it, i) => {
              const t = titleForId(it.title_id);
              const isDone = it.status === "done";
              return (
                <li key={i} className="text-[13px] leading-relaxed flex gap-2.5">
                  <span className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-accent-success" />
                    ) : (
                      <CornerDownRight className="h-4 w-4 text-accent-amber" />
                    )}
                  </span>
                  <div className={`min-w-0 flex-1 ${isDone ? "opacity-70" : ""}`}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[11px] mono font-semibold text-ink-900 px-1.5 py-0.5 rounded bg-ink-300/20">
                        {it.owner}
                      </span>
                      {t && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold"
                          style={{ color: t.brand_color }}
                        >
                          {t.title_name}
                        </span>
                      )}
                      <span className={isDone ? "text-ink-700 line-through" : "text-ink-900"}>
                        {it.task}
                      </span>
                      <Badge tone={YESTERDAY_STATUS_TONE[it.status]} size="xs">
                        {YESTERDAY_STATUS_LABEL[it.status]}
                      </Badge>
                      {it.linked_ticket_id && (
                        <JiraLink
                          ticketId={it.linked_ticket_id}
                          className="text-[11px] mono text-accent-primary hover:underline"
                          fallbackClassName="text-[11px] mono text-ink-500"
                        />
                      )}
                    </div>
                    {it.closeout_note && (
                      <div className="text-[11.5px] text-ink-500 mt-0.5">
                        {it.closeout_note}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------------
// ResolvableRow — wraps a row with a hover-revealed resolve button.
// Optionally renders a ticket drawer below the main flex row.
// -------------------------------------------------------------------
function ResolvableRow({ id, resolved, onToggle, bulletColor, bullet, tight, drawer, noteSlot, children }) {
  return (
    <li className={`text-[13px] leading-relaxed group relative ${resolved ? "opacity-70" : ""}`}>
      <div className="flex gap-2.5 items-start">
        {bullet ? (
          bullet
        ) : (
          <span className={`mt-0.5 shrink-0 ${bulletColor || "text-ink-500"}`}>•</span>
        )}
        <div className="min-w-0 flex-1 pr-7">{children}</div>
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={`resolve-btn absolute top-0 right-0 h-6 w-6 rounded-md flex items-center justify-center transition-all ${
            resolved
              ? "text-accent-success opacity-100"
              : "text-ink-500 opacity-0 group-hover:opacity-100 hover:text-accent-success hover:bg-accent-success/10"
          }`}
          aria-label={resolved ? "Mark unresolved" : "Mark resolved"}
          title={resolved ? "Mark unresolved" : "Mark resolved"}
        >
          {resolved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {drawer && (
        <div className="ml-5 mt-2 mb-0.5">
          {drawer}
        </div>
      )}
      {noteSlot && (
        <div className="ml-5 mt-1">
          {noteSlot}
        </div>
      )}
    </li>
  );
}

// -------------------------------------------------------------------
// ParkingLot
// -------------------------------------------------------------------
function ParkingLot({ parked, onAdd, onRemove, open, onToggle }) {
  const [text, setText] = useState("");
  const [raisedBy, setRaisedBy] = useState("Alex");

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text, raisedBy);
    setText("");
  };

  return (
    <section className="panel border-l-4 border-l-ink-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 gap-3 text-left"
      >
        <h2 className="text-[13px] font-bold flex items-center gap-2 text-ink-700">
          <span className="mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700">
            6
          </span>
          <MapPin className="h-4 w-4" />
          Parking lot
          <span className="text-[11.5px] text-ink-500 font-normal ml-1">
            ({parked.length}) · capture and continue
          </span>
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-ink-400 transition-transform shrink-0 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-line">
          {parked.length === 0 ? (
            <p className="text-[12.5px] text-ink-500 italic my-3">
              Nothing parked yet. Off-agenda items captured here stay out of the time-box but don't get lost.
            </p>
          ) : (
            <ul className="space-y-1.5 my-3">
              {parked.map((p) => (
                <li key={p.id} className="text-[13px] leading-relaxed flex items-baseline gap-2.5 group">
                  <span className="mono text-[11px] text-ink-500 shrink-0 w-16">
                    {fmtClock(p.raised_at)}
                  </span>
                  <span className="text-[11px] mono font-semibold text-ink-900 px-1.5 py-0.5 rounded bg-ink-300/20 shrink-0">
                    {p.raised_by}
                  </span>
                  <span className="text-ink-700 min-w-0 flex-1">{p.text}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="text-ink-500 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label="Remove parked item"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="park-form flex items-center gap-2 flex-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <select
              value={raisedBy}
              onChange={(e) => setRaisedBy(e.target.value)}
              className="text-[12px] mono font-semibold px-2 py-1.5 rounded-lg border border-line bg-white text-ink-900 focus:border-accent-primary focus:outline-none"
            >
              {TRIO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Park for later..."
              className="flex-1 min-w-[200px] text-[13px] px-3 py-1.5 rounded-lg border border-line bg-white text-ink-900 placeholder:text-ink-500 focus:border-accent-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
              Park
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function fmtClock(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function inferTitleIdFromTicket(ticketId) {
  if (!ticketId) return null;
  const prefix = ticketId.split("-")[0];
  const map = {
    BL:  "borderlands",
    CIV: "civilization",
    MAF: "mafia",
    WND: "wonderlands",
    HW:  "homeworld",
    XCM: "xcom",
    ROR: "risk-of-rain",
    BIO: "bioshock",
  };
  return map[prefix] || null;
}

// -------------------------------------------------------------------
// ItemNote — inline amber note area that can be attached to any agenda
// item. Saves to localStorage via meeting.setNote/getNote. Has a
// one-click "Add as follow-up" that promotes the note text to Section 5.
// -------------------------------------------------------------------
function ItemNote({ itemId, itemLabel, meeting }) {
  const savedNote = meeting.getNote(itemId);
  const [open, setOpen] = useState(!!savedNote);
  const [draft, setDraft] = useState(savedNote);
  const [promoted, setPromoted] = useState(false);
  const textareaRef = useRef(null);

  // Sync with external reset
  useEffect(() => {
    const cur = meeting.getNote(itemId);
    setDraft(cur);
    if (!cur) setOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Focus when opened
  useEffect(() => {
    if (open && textareaRef.current) textareaRef.current.focus();
  }, [open]);

  const save = () => {
    meeting.setNote(itemId, draft.trim());
  };

  const promote = () => {
    const text = draft.trim();
    if (!text) return;
    meeting.addFollowUp(text, itemLabel || itemId);
    setPromoted(true);
    setTimeout(() => setPromoted(false), 2200);
  };

  const clear = () => {
    setDraft("");
    meeting.setNote(itemId, "");
    setOpen(false);
  };

  // No note, closed → subtle "Note" button
  if (!open && !savedNote) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-1 text-[10.5px] text-ink-300 hover:text-ink-500 transition-colors mt-1 select-none"
      >
        <StickyNote className="h-3 w-3" />
        Note
      </button>
    );
  }

  // Note exists, closed → amber preview card (click to edit)
  if (!open && savedNote) {
    return (
      <div
        className="mt-1.5 flex items-start gap-1.5 text-[12px] text-ink-700 bg-amber-50/70 border border-amber-100 rounded-md px-2.5 py-1.5 cursor-pointer hover:border-amber-300 transition-colors group/note"
        onClick={() => setOpen(true)}
        title="Click to edit note"
      >
        <StickyNote className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
        <span className="flex-1 min-w-0 leading-relaxed">{savedNote}</span>
        <Edit3 className="h-3 w-3 text-ink-400 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0 mt-0.5" />
      </div>
    );
  }

  // Open → textarea + save / promote / clear
  return (
    <div className="mt-1.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        placeholder="Note for this item..."
        rows={2}
        className="w-full text-[12.5px] px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50/40 text-ink-900 placeholder:text-ink-400 focus:border-amber-400 focus:outline-none resize-none"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => { save(); setOpen(false); }}
          className="text-[11px] font-medium text-ink-600 hover:text-ink-900 transition-colors"
        >
          Done
        </button>
        <button
          type="button"
          onClick={promote}
          disabled={!draft.trim()}
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            promoted
              ? "bg-accent-success/15 text-accent-success"
              : "bg-accent-success/10 text-accent-success hover:bg-accent-success/20"
          }`}
        >
          <ArrowUpRight className="h-3 w-3" />
          {promoted ? "Added to follow-ups ✓" : "Add as follow-up"}
        </button>
        {savedNote && (
          <button
            type="button"
            onClick={clear}
            className="text-[11px] text-ink-400 hover:text-accent-red transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// FollowUpSection — Section 5. Aggregates follow-up items promoted
// from inline notes, plus freeform additions. Each item has an assignee,
// editable text, source attribution (e.g., "from BL-2418 blocker"),
// and a done toggle.
// -------------------------------------------------------------------
function FollowUpRow({ fu, onToggle, onRemove, onUpdate, onUpdateAssignee }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fu.text);

  return (
    <li className="text-[13px] leading-relaxed flex items-start gap-2.5 group">
      <button
        type="button"
        onClick={() => onToggle(fu.id)}
        className={`mt-0.5 shrink-0 transition-colors ${
          fu.done ? "text-accent-success" : "text-ink-400 hover:text-accent-success"
        }`}
        aria-label={fu.done ? "Mark not done" : "Mark done"}
      >
        {fu.done ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <span className="inline-block h-4 w-4 border-2 border-current rounded-sm" />
        )}
      </button>
      <div className={`min-w-0 flex-1 ${fu.done ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <select
            value={fu.assignee || "Alex"}
            onChange={(e) => onUpdateAssignee(fu.id, e.target.value)}
            disabled={fu.done}
            className="text-[10.5px] mono font-semibold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-900 border-none focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:cursor-not-allowed"
          >
            {TRIO_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {fu.source && (
            <span className="text-[10px] text-ink-400 mono">
              from {fu.source}
            </span>
          )}
        </div>
        {editing ? (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onUpdate(fu.id, draft); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onUpdate(fu.id, draft); setEditing(false); }
              if (e.key === "Escape") { setDraft(fu.text); setEditing(false); }
            }}
            className="w-full text-[13px] px-2 py-0.5 rounded border border-accent-primary focus:outline-none text-ink-900 bg-white"
          />
        ) : (
          <div
            className={`text-ink-700 ${fu.done ? "line-through" : "cursor-text hover:text-ink-900"}`}
            onClick={() => !fu.done && setEditing(true)}
            title={fu.done ? "" : "Click to edit"}
          >
            {fu.text}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(fu.id)}
        className="text-ink-300 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
        aria-label="Remove follow-up"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function FollowUpSection({ followUps, onAdd, onToggle, onRemove, onUpdate, onUpdateAssignee, open, onSectionToggle }) {
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("Alex");
  const doneCount = followUps.filter((f) => f.done).length;

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), null, assignee);
    setText("");
  };

  return (
    <section className="panel border-l-4 border-l-accent-success">
      <button
        type="button"
        onClick={onSectionToggle}
        className="w-full flex items-center justify-between p-5 gap-3 text-left"
      >
        <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-success">
          <span className="mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700">
            5
          </span>
          <StickyNote className="h-4 w-4" />
          Follow-ups from this standup
          <span className="text-[11.5px] text-ink-500 font-normal ml-1">
            ({followUps.length})
            {doneCount > 0 && (
              <> · <span className="text-accent-success">{doneCount} done</span></>
            )}
          </span>
        </h2>
        <ChevronDown
          className={`h-4 w-4 text-ink-400 transition-transform shrink-0 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-line">
          {followUps.length === 0 ? (
            <p className="text-[12.5px] text-ink-500 italic my-3">
              No follow-ups yet. Add a note to any agenda item above and click{" "}
              <span className="font-medium text-accent-success not-italic">Add as follow-up</span>{" "}
              — or add one directly here.
            </p>
          ) : (
            <ul className="space-y-2.5 my-3">
              {followUps.map((fu) => (
                <FollowUpRow
                  key={fu.id}
                  fu={fu}
                  onToggle={onToggle}
                  onRemove={onRemove}
                  onUpdate={onUpdate}
                  onUpdateAssignee={onUpdateAssignee}
                />
              ))}
            </ul>
          )}
          <form
            className="park-form flex items-center gap-2 flex-wrap"
            onSubmit={(e) => { e.preventDefault(); submit(); }}
          >
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="text-[12px] mono font-semibold px-2 py-1.5 rounded-lg border border-line bg-white text-ink-900 focus:border-accent-primary focus:outline-none"
            >
              {TRIO_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add follow-up directly..."
              className="flex-1 min-w-[200px] text-[13px] px-3 py-1.5 rounded-lg border border-line bg-white text-ink-900 placeholder:text-ink-500 focus:border-accent-success focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-success hover:text-accent-success transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------------
// AgendaSection — collapsible time-boxed section.
// -------------------------------------------------------------------
function AgendaSection({ number, title, timeBox, tone, Icon, totalCount, resolvedCount, open, onToggle, children }) {
  const toneClass = {
    red:     "text-accent-red border-l-accent-red",
    amber:   "text-accent-amber border-l-accent-amber",
    primary: "text-accent-primary border-l-accent-primary",
    success: "text-accent-success border-l-accent-success",
  }[tone] || "text-ink-700 border-l-ink-300";

  const [titleColor, borderClass] = toneClass.split(" ");
  const showResolveCount =
    typeof resolvedCount === "number" &&
    typeof totalCount === "number" &&
    totalCount > 0 &&
    resolvedCount > 0;

  return (
    <section className={`panel border-l-4 ${borderClass}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 gap-3 text-left"
      >
        <h2 className={`text-[13px] font-bold flex items-center gap-2 ${titleColor}`}>
          <span className="mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700">
            {number}
          </span>
          <Icon className="h-4 w-4" />
          {title}
          {typeof totalCount === "number" && (
            <span className="text-[11px] mono text-ink-500 font-normal ml-1">
              {showResolveCount
                ? `(${resolvedCount} of ${totalCount} resolved)`
                : `(${totalCount})`}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] mono font-semibold text-ink-500">
            <Timer className="h-3 w-3" /> {timeBox}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-ink-400 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-line">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </section>
  );
}

// -------------------------------------------------------------------
// Markdown digest for the Copy-agenda button.
// -------------------------------------------------------------------
function buildAgendaDigest({ standup: s, blockers, decisions, calls, p0Inbox, actionItems, yesterdayCounts, followUps, notes }) {
  const lines = [];
  const dateStr = fmtDate(s.standup_date, { year: true });

  lines.push(`*Daily standup agenda · ${dateStr}*`);
  lines.push(`_Trio: Davide · Alex · Marketing Mgr II · 18 min target_`);
  lines.push("");

  if (yesterdayCounts && (yesterdayCounts.done || yesterdayCounts.carried_over)) {
    const total =
      (yesterdayCounts.done || 0) +
      (yesterdayCounts.carried_over || 0) +
      (yesterdayCounts.dropped || 0);
    const parts = [];
    if (yesterdayCounts.done) parts.push(`${yesterdayCounts.done} of ${total} closed`);
    if (yesterdayCounts.carried_over) parts.push(`${yesterdayCounts.carried_over} carrying over`);
    if (yesterdayCounts.dropped) parts.push(`${yesterdayCounts.dropped} dropped`);
    lines.push(`*Yesterday's commitments:* ${parts.join(" · ")}`);
    lines.push("");
  }

  lines.push(`*Context.* ${s.portfolio_health_summary}`);
  lines.push("");

  if (blockers.length > 0) {
    lines.push(`*1. Blockers needing the room (5 min)*`);
    for (const b of blockers) {
      const t = titleForId(b.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      const tkId = b.linked_ticket_id ? ` · ${b.linked_ticket_id}` : "";
      lines.push(
        `• ${name}${b.blocker} — needs *${b.needed_from}* by ${fmtDate(b.by)}${tkId}`
      );
    }
    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push(`*2. Decisions on the table (5 min)*`);
    for (const d of decisions) {
      const t = titleForId(d.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      const tranche =
        d.tranche_amount_usd > 0
          ? ` · $${(d.tranche_amount_usd / 1000).toFixed(0)}K`
          : "";
      const tag = d.decision_owner === "Davide Detta" ? " · Davide GO/NO-GO" : "";
      lines.push(
        `• ${name}${d.decision} — by ${fmtDate(d.decision_date)}${tranche}${tag}`
      );
    }
    lines.push("");
  }

  if (calls.length > 0 || p0Inbox.length > 0) {
    lines.push(`*3. Today's external touchpoints (4 min)*`);
    for (const c of calls) {
      const tkId = c.linked_ticket_id ? ` · ${c.linked_ticket_id}` : "";
      lines.push(`• ${c.time_label} — ${c.title}${tkId}`);
    }
    for (const it of p0Inbox) {
      const t = titleForId(it.titleId);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• P0 (${it.type}) ${name}${it.headline}`);
    }
    lines.push("");
  }

  if (actionItems.length > 0) {
    lines.push(`*4. Action items out (2 min)*`);
    for (const a of actionItems) {
      const tkId = a.linked_ticket_id ? ` · ${a.linked_ticket_id}` : "";
      lines.push(`• ${a.owner} — ${a.task}${tkId}`);
    }
    lines.push("");
  }

  // Follow-ups
  const pendingFollowUps = (followUps || []).filter((f) => !f.done);
  if (pendingFollowUps.length > 0) {
    lines.push(`*Follow-ups from this standup*`);
    for (const f of pendingFollowUps) {
      const src = f.source ? ` · from ${f.source}` : "";
      lines.push(`☐ ${f.assignee || "Alex"} — ${f.text}${src}`);
    }
    lines.push("");
  }

  lines.push(`—`);
  lines.push(
    `Live agenda: https://2k-beatboard.vercel.app/brief · Full digest: https://2k-beatboard.vercel.app/brief/digest`
  );

  return lines.join("\n");
}
