"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  standup,
  titles,
  fmtDate,
  buildInboxItems,
} from "@/lib/data";
import Badge from "./Badge";
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
// Working-agenda behaviors:
//   - Yesterday's commitments panel (closes the loop day-over-day)
//   - Collapsible sections: overview strip shows all time allotments
//     at a glance; expand each section as you reach it in the meeting
//   - Per-item resolve toggle persisted in localStorage by standup_date
//   - Parking Lot for off-agenda capture without blowing the time-box
//   - Reset Meeting State button for clean demo replay
//
// The shareable roll-up version (full digest) lives at /brief/digest.
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
// useMeetingState — client-only meeting state (resolved items +
// parking lot). Persisted to localStorage by standup_date so a
// refresh mid-meeting doesn't lose state. Safe SSR: initial render
// is empty state; localStorage loads on mount via useEffect.
// -------------------------------------------------------------------
function useMeetingState(standupDate) {
  const storageKey = `beatboard:standup:${standupDate}`;
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState({ resolved: {}, parked: [] });

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({
          resolved: parsed.resolved || {},
          parked: parsed.parked || [],
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

  const resetAll = () => setState({ resolved: {}, parked: [] });

  return {
    hydrated,
    isResolved: (id) => !!state.resolved[id],
    resolvedCount: (ids) => ids.filter((id) => state.resolved[id]).length,
    toggleResolved,
    parked: state.parked,
    addParked,
    removeParked,
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
    5: false,
  });

  const meeting = useMeetingState(standup.standup_date);

  const brief = standup.standup_brief;
  const blockers = brief.blockers || [];

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
        const order = { draft: 0, gmail: 1, slack: 2, transcript: 3, activity: 4 };
        return (order[a.type] ?? 9) - (order[b.type] ?? 9);
      });
  }, []);

  const actionItems = brief.today_priorities || [];

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

  // Stable item IDs for resolve state
  const blockerIds = blockers.map((_, i) => `blocker:${i}`);
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
    setSectionOpen((s) => ({ ...s, 1: next, 2: next, 3: next, 4: next }));
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

      {/* Yesterday's commitments — closes the loop day-over-day */}
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

      {/* Agenda overview — all sections and time allotments at a glance.
          Tap any row to expand that section. */}
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
          <ul className="space-y-2.5">
            {blockers.map((b, i) => {
              const id = `blocker:${i}`;
              const resolved = meeting.isResolved(id);
              const t = titleForId(b.title_id);
              const inRoom = isTrio(b.needed_from);
              return (
                <ResolvableRow
                  key={i}
                  id={id}
                  resolved={resolved}
                  onToggle={meeting.toggleResolved}
                  bulletColor="text-accent-red"
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
                      <Badge tone="success" size="xs">
                        Resolved
                      </Badge>
                    ) : inRoom ? (
                      <Badge tone="red" size="xs">
                        Unblock in room
                      </Badge>
                    ) : (
                      <Badge tone="amber" size="xs">
                        Escalation path
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11.5px] text-ink-500 mt-0.5">
                    Owner: <span className="text-ink-700">{b.owner}</span> ·
                    Needs <span className="text-ink-700">{b.needed_from}</span>{" "}
                    by <span className="text-ink-700 mono">{fmtDate(b.by)}</span>
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
                      <Badge tone="success" size="xs">
                        Discussed
                      </Badge>
                    ) : (
                      <>
                        <Badge tone={tone} size="xs">
                          {DECISION_STATUS_LABEL[d.status] || d.status}
                        </Badge>
                        {needsDavide && (
                          <Badge tone="violet" size="xs">
                            Needs Davide GO/NO-GO
                          </Badge>
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
          {calls.length > 0 && (
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
                Calls
              </div>
              <ul className="space-y-1.5 mb-3">
                {calls.map((c, i) => {
                  const id = `call:${i}`;
                  const resolved = meeting.isResolved(id);
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
                    >
                      <span className={resolved ? "text-ink-500 line-through" : "text-ink-700"}>
                        <span className={resolved ? "text-ink-500" : "text-ink-900 font-medium"}>
                          {c.title}
                        </span>
                        {c.topic && <span className="text-ink-500"> — {c.topic}</span>}
                      </span>
                    </ResolvableRow>
                  );
                })}
              </ul>
            </div>
          )}
          {p0Inbox.length > 0 && (
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
                P0 actions leaving the building
              </div>
              <ul className="space-y-1.5">
                {p0Inbox.map((it) => {
                  const id = `inbox:${it.id}`;
                  const resolved = meeting.isResolved(id);
                  const t = titleForId(it.titleId);
                  return (
                    <ResolvableRow
                      key={it.id}
                      id={id}
                      resolved={resolved}
                      onToggle={meeting.toggleResolved}
                      bulletColor="text-accent-violet"
                      tight
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
                        <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mr-1.5">
                          {it.type}
                        </span>
                        <span className={resolved ? "text-ink-700 line-through" : "text-ink-900"}>
                          {it.headline}
                        </span>
                      </span>
                    </ResolvableRow>
                  );
                })}
              </ul>
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
              return (
                <li key={i} className="text-[13px] leading-relaxed flex gap-2.5 group">
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
                    <div className="flex items-baseline gap-2 flex-wrap">
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
                      {a.linked_ticket_id && (
                        <span className="text-[11px] mono text-ink-500">
                          {a.linked_ticket_id}
                        </span>
                      )}
                    </div>
                    <p className={resolved ? "text-ink-700 mt-0.5 line-through" : "text-ink-700 mt-0.5"}>
                      {a.task}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </AgendaSection>
      )}

      {/* 5. Parking lot */}
      <ParkingLot
        parked={meeting.parked}
        onAdd={meeting.addParked}
        onRemove={meeting.removeParked}
        open={sectionOpen[5]}
        onToggle={() => toggleSection(5)}
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
// YesterdayPanel — closes the loop on yesterday's commitments.
// Compact: one row per item; carry-overs sort first; done items
// show line-through. Counts in the header tell the whole story.
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
                        <span className="text-[11px] mono text-ink-500">
                          {it.linked_ticket_id}
                        </span>
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
// Used by sections 1, 2, 3. Section 4 (action items) uses a more
// prominent checkbox inline since each row IS the commitment.
// -------------------------------------------------------------------
function ResolvableRow({ id, resolved, onToggle, bulletColor, bullet, tight, children }) {
  return (
    <li className={`text-[13px] leading-relaxed flex gap-2.5 group relative ${resolved ? "opacity-70" : ""}`}>
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
    </li>
  );
}

// -------------------------------------------------------------------
// ParkingLot — off-agenda capture. Items live in localStorage so they
// survive the meeting and can be triaged after. Collapsible header
// keeps it out of the way until needed.
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
            5
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
    BL: "borderlands",
    CIV: "civilization",
    MAF: "mafia",
    WND: "wonderlands",
    HW: "homeworld",
    XCM: "xcom",
    ROR: "risk-of-rain",
    BIO: "bioshock",
  };
  return map[prefix] || null;
}

// -------------------------------------------------------------------
// AgendaSection — collapsible time-boxed section. The header always
// shows the section number, title, item count, and time allocation.
// Click anywhere on the header to expand/collapse the content.
// -------------------------------------------------------------------
function AgendaSection({ number, title, timeBox, tone, Icon, totalCount, resolvedCount, open, onToggle, children }) {
  const toneClass = {
    red: "text-accent-red border-l-accent-red",
    amber: "text-accent-amber border-l-accent-amber",
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
// Includes a one-line yesterday's-commitments recap up top.
// -------------------------------------------------------------------
function buildAgendaDigest({ standup: s, blockers, decisions, calls, p0Inbox, actionItems, yesterdayCounts }) {
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
      lines.push(
        `• ${name}${b.blocker} — needs *${b.needed_from}* by ${fmtDate(b.by)}`
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
      lines.push(`• ${c.time_label} — ${c.title}`);
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
      lines.push(`• ${a.owner} — ${a.task}`);
    }
    lines.push("");
  }

  lines.push(`—`);
  lines.push(
    `Live agenda: https://2k-beatboard.vercel.app/brief · Full digest: https://2k-beatboard.vercel.app/brief/digest`
  );

  return lines.join("\n");
}
