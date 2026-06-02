"use client";

import { useState, useMemo } from "react";
import {
  Ban,
  ShieldCheck,
  Target,
  DollarSign,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import Badge from "./Badge";
import GoNoGoChecklist from "./GoNoGoChecklist";
import TicketFilterBar from "./TicketFilterBar";
import {
  COLUMNS,
  GATE_TONE,
  GATE_LABEL,
  readinessTone,
  TONE_BAR,
  TicketCard,
  TicketDrawer,
} from "./TicketShared";
import {
  getBeatReadiness,
  getInvoicesForTitle,
  SAVED_FILTERS,
  SAVED_FILTER_MAP,
  TICKET_COMPONENTS,
  fmtDate,
} from "@/lib/data";

// ===================================================================
// Beat release-readiness rail (#3)
// ===================================================================
function ReadinessRail({ beats, onOpenGate }) {
  // Only beats that carry a GO/NO-GO gate — the "can we ship?" decisions.
  const gated = beats
    .filter((b) => b.go_no_go)
    .map((b) => getBeatReadiness(b.beat_id))
    .filter(Boolean);

  if (gated.length === 0) return null;

  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-4 w-4 text-accent-primary" />
        <h3 className="section-title">Beat release readiness</h3>
        <span className="text-[11px] text-ink-500 mono">
          {gated.length} gate{gated.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {gated.map((r) => {
          const gateStatus = r.gate?.status;
          const pct = r.readinessPct;
          const tone = readinessTone(pct);
          return (
            <button
              key={r.beat.beat_id}
              type="button"
              onClick={() => onOpenGate(r.beat)}
              className="text-left border border-line rounded-lg p-3 bg-white hover:border-ink-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12.5px] font-semibold leading-snug">
                  {r.beat.beat_name}
                </span>
                <Badge tone={GATE_TONE[gateStatus] || "neutral"} size="xs">
                  {GATE_LABEL[gateStatus] || gateStatus}
                </Badge>
              </div>

              {/* readiness bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10.5px] text-ink-500 mb-1">
                  <span>
                    {r.doneTickets}/{r.totalTickets} tickets done
                  </span>
                  <span className="mono">{pct == null ? "—" : `${pct}%`}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-300/30 overflow-hidden">
                  <div
                    className={`h-full ${TONE_BAR[tone]}`}
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </div>

              {/* signal chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10.5px]">
                {r.p0Total > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700">
                    <Target className="h-2.5 w-2.5" />
                    P0 {r.p0Done}/{r.p0Total}
                  </span>
                )}
                {r.blockers.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red">
                    <Ban className="h-2.5 w-2.5" />
                    {r.blockers.length} blocker
                    {r.blockers.length === 1 ? "" : "s"}
                  </span>
                )}
                {r.pastDueInvoices.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red">
                    <DollarSign className="h-2.5 w-2.5" />
                    {r.pastDueInvoices.length} past-due
                  </span>
                )}
                {r.openInvoices.length > 0 &&
                  r.pastDueInvoices.length === 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700">
                      <DollarSign className="h-2.5 w-2.5" />
                      {r.openInvoices.length} open inv
                    </span>
                  )}
              </div>

              {r.gate && (
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-line text-[10.5px] text-ink-500">
                  <CalendarDays className="h-3 w-3" />
                  {fmtDate(r.gate.decision_date)} · {r.gate.decision_owner}
                  <ChevronRight className="h-3 w-3 ml-auto" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===================================================================
// Main
// ===================================================================
export default function TicketsBoard({ title, tickets, beats, invoices }) {
  const [selectedId, setSelectedId] = useState(null);
  const [gateBeat, setGateBeat] = useState(null);
  const [savedFilter, setSavedFilter] = useState("all");
  const [activeComponents, setActiveComponents] = useState(() => new Set());

  const titleInvoices = invoices || getInvoicesForTitle(title.title_id);

  // Apply the active saved filter + component multi-select.
  const filtered = useMemo(() => {
    const f = SAVED_FILTER_MAP[savedFilter] || SAVED_FILTER_MAP.all;
    return tickets.filter(
      (t) =>
        f.match(t) &&
        (activeComponents.size === 0 || activeComponents.has(t.component))
    );
  }, [tickets, savedFilter, activeComponents]);

  // Chip counts (saved filters reflect the component selection;
  // component counts reflect the saved-filter selection).
  const counts = useMemo(() => {
    const out = {};
    for (const f of SAVED_FILTERS) {
      out[f.id] = tickets.filter(
        (t) =>
          f.match(t) &&
          (activeComponents.size === 0 || activeComponents.has(t.component))
      ).length;
    }
    return out;
  }, [tickets, activeComponents]);

  const componentCounts = useMemo(() => {
    const f = SAVED_FILTER_MAP[savedFilter] || SAVED_FILTER_MAP.all;
    const out = {};
    for (const c of TICKET_COMPONENTS) out[c.id] = 0;
    for (const t of tickets) {
      if (f.match(t) && t.component != null) out[t.component] = (out[t.component] || 0) + 1;
    }
    return out;
  }, [tickets, savedFilter]);

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        items: filtered.filter((t) => col.match(t.status)),
      })),
    [filtered]
  );

  const toggleComponent = (id) =>
    setActiveComponents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearFilters = () => {
    setSavedFilter("all");
    setActiveComponents(new Set());
  };

  return (
    <div className="space-y-5">
      {/* #3 — Beat release readiness rail */}
      <ReadinessRail beats={beats} onOpenGate={setGateBeat} />

      {/* #4 — Saved filters + component chips */}
      <TicketFilterBar
        savedFilter={savedFilter}
        onSavedFilter={setSavedFilter}
        components={activeComponents}
        onToggleComponent={toggleComponent}
        onClear={clearFilters}
        counts={counts}
        componentCounts={componentCounts}
        resultCount={filtered.length}
        totalCount={tickets.length}
      />

      {/* #1/#2 — Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col.key} className="panel p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="section-title">{col.label}</h3>
              <span className="text-[11px] text-ink-500 mono">
                {col.items.length}
              </span>
            </div>
            <ul className="space-y-2">
              {col.items.map((t) => (
                <TicketCard
                  key={t.ticket_id}
                  ticket={t}
                  onSelect={setSelectedId}
                />
              ))}
              {col.items.length === 0 && (
                <li className="text-[11px] text-ink-400 italic py-1">
                  Nothing here.
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {selectedId && (
        <TicketDrawer
          ticketId={selectedId}
          titleInvoices={titleInvoices}
          onClose={() => setSelectedId(null)}
          onSelect={setSelectedId}
        />
      )}

      {/* Gate drill-down reuses the existing GO/NO-GO modal */}
      {gateBeat && (
        <GoNoGoChecklist
          beat={gateBeat}
          titleColor={title.brand_color}
          onClose={() => setGateBeat(null)}
        />
      )}
    </div>
  );
}
