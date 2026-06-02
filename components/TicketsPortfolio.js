"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, AlertTriangle, Ban, CalendarClock, Target } from "lucide-react";
import {
  tickets as allTickets,
  titles,
  invoices,
  getTitleById,
  SAVED_FILTERS,
  SAVED_FILTER_MAP,
  TICKET_COMPONENTS,
  COMPONENT_LABEL,
  SPRINT_WEEK,
  fmtDate,
} from "@/lib/data";
import TicketFilterBar from "./TicketFilterBar";
import { COLUMNS, TicketCard, TicketDrawer } from "./TicketShared";

const GROUP_OPTIONS = [
  { id: "title", label: "Title" },
  { id: "owner", label: "Owner" },
  { id: "component", label: "Component" },
];

// Order helpers so swimlanes render in a stable, meaningful sequence.
const TITLE_ORDER = titles.map((t) => t.title_id);
const COMPONENT_ORDER = TICKET_COMPONENTS.map((c) => c.id);

function groupKey(ticket, groupBy) {
  if (groupBy === "title") return ticket.title_id;
  if (groupBy === "owner") return ticket.owner || "Unassigned";
  return ticket.component || "uncategorized";
}

function groupLabel(key, groupBy) {
  if (groupBy === "title") {
    const t = getTitleById(key);
    return t ? t.title_name : key;
  }
  if (groupBy === "component") return COMPONENT_LABEL[key] || key;
  return key;
}

function groupColor(key, groupBy) {
  if (groupBy === "title") {
    const t = getTitleById(key);
    return t ? t.brand_color : "#94A3B8";
  }
  return null;
}

function sortGroupKeys(keys, groupBy) {
  if (groupBy === "title") {
    return [...keys].sort(
      (a, b) => TITLE_ORDER.indexOf(a) - TITLE_ORDER.indexOf(b)
    );
  }
  if (groupBy === "component") {
    return [...keys].sort(
      (a, b) => COMPONENT_ORDER.indexOf(a) - COMPONENT_ORDER.indexOf(b)
    );
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function StatTile({ icon: Icon, label, value, tone }) {
  const toneClass =
    tone === "red"
      ? "text-accent-red"
      : tone === "amber"
      ? "text-accent-amber"
      : tone === "primary"
      ? "text-accent-primary"
      : "text-ink-700";
  return (
    <div className="panel p-3 flex items-center gap-3">
      <div className={`${toneClass} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[20px] font-bold leading-none mono">{value}</div>
        <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function TicketsPortfolio() {
  const [selectedId, setSelectedId] = useState(null);
  const [savedFilter, setSavedFilter] = useState("open");
  const [activeComponents, setActiveComponents] = useState(() => new Set());
  const [groupBy, setGroupBy] = useState("title");

  // Deep-link: ?focus=TICKET_ID opens that ticket's drawer on arrival, so a
  // Jira key clicked anywhere in the app lands directly on the ticket. The
  // drawer is a modal overlay, so it shows regardless of the active filters.
  useEffect(() => {
    try {
      const focus = new URLSearchParams(window.location.search).get("focus");
      if (focus && allTickets.some((t) => t.ticket_id === focus)) {
        setSelectedId(focus);
      }
    } catch {}
  }, []);

  // Portfolio-wide stat tiles — always over the full ticket set so the
  // headline numbers don't shift as filters change.
  const stats = useMemo(() => {
    const count = (id) => allTickets.filter((t) => SAVED_FILTER_MAP[id].match(t)).length;
    return {
      open: count("open"),
      p0: count("p0_active"),
      blocked: count("at_risk"),
      dueWeek: count("due_week"),
      overdue: count("overdue"),
    };
  }, []);

  const filtered = useMemo(() => {
    const f = SAVED_FILTER_MAP[savedFilter] || SAVED_FILTER_MAP.all;
    return allTickets.filter(
      (t) =>
        f.match(t) &&
        (activeComponents.size === 0 || activeComponents.has(t.component))
    );
  }, [savedFilter, activeComponents]);

  const counts = useMemo(() => {
    const out = {};
    for (const f of SAVED_FILTERS) {
      out[f.id] = allTickets.filter(
        (t) =>
          f.match(t) &&
          (activeComponents.size === 0 || activeComponents.has(t.component))
      ).length;
    }
    return out;
  }, [activeComponents]);

  const componentCounts = useMemo(() => {
    const f = SAVED_FILTER_MAP[savedFilter] || SAVED_FILTER_MAP.all;
    const out = {};
    for (const c of TICKET_COMPONENTS) out[c.id] = 0;
    for (const t of allTickets) {
      if (f.match(t) && t.component != null)
        out[t.component] = (out[t.component] || 0) + 1;
    }
    return out;
  }, [savedFilter]);

  // Build swimlanes: group → status columns.
  const groups = useMemo(() => {
    const byKey = new Map();
    for (const t of filtered) {
      const key = groupKey(t, groupBy);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(t);
    }
    return sortGroupKeys([...byKey.keys()], groupBy).map((key) => {
      const items = byKey.get(key);
      const p0 = items.filter((t) => t.priority === "P0").length;
      return {
        key,
        label: groupLabel(key, groupBy),
        color: groupColor(key, groupBy),
        items,
        p0,
        columns: COLUMNS.map((col) => ({
          ...col,
          items: items.filter((t) => col.match(t.status)),
        })),
      };
    });
  }, [filtered, groupBy]);

  const toggleComponent = (id) =>
    setActiveComponents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clearFilters = () => {
    setSavedFilter("open");
    setActiveComponents(new Set());
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
          Tickets — Portfolio Board
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          All execution work, one board.
        </h1>
        <p className="text-[13px] text-ink-500 mt-1">
          {allTickets.length} tickets across {titles.length} titles · sprint week{" "}
          {fmtDate(SPRINT_WEEK.startISO)}–{fmtDate(SPRINT_WEEK.endISO)} · grouped
          by {GROUP_OPTIONS.find((g) => g.id === groupBy)?.label.toLowerCase()}.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile icon={LayoutGrid} label="Open work" value={stats.open} />
        <StatTile icon={Target} label="P0 active" value={stats.p0} tone="primary" />
        <StatTile icon={Ban} label="At risk / blocked" value={stats.blocked} tone="red" />
        <StatTile icon={CalendarClock} label="Due this week" value={stats.dueWeek} tone="amber" />
        <StatTile icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="red" />
      </div>

      {/* Filter bar (#4) */}
      <TicketFilterBar
        savedFilter={savedFilter}
        onSavedFilter={setSavedFilter}
        components={activeComponents}
        onToggleComponent={toggleComponent}
        onClear={clearFilters}
        counts={counts}
        componentCounts={componentCounts}
        resultCount={filtered.length}
        totalCount={allTickets.length}
      />

      {/* Group-by selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
          Group by
        </span>
        <div className="flex bg-base rounded-md p-0.5 border border-line">
          {GROUP_OPTIONS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupBy(g.id)}
              className={`px-3 py-1 text-[12px] font-medium rounded ${
                groupBy === g.id
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Swimlanes */}
      <div className="space-y-4">
        {groups.length === 0 && (
          <div className="panel p-6 text-center text-[13px] text-ink-500">
            No tickets match these filters.
          </div>
        )}
        {groups.map((group) => (
          <div key={group.key} className="panel p-4">
            {/* Swimlane header */}
            <div className="flex items-center gap-2 mb-3">
              {group.color && (
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
              )}
              <h3 className="text-[14px] font-bold tracking-tight">
                {group.label}
              </h3>
              <span className="text-[11px] text-ink-500 mono">
                {group.items.length} ticket{group.items.length === 1 ? "" : "s"}
              </span>
              {group.p0 > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary text-[10.5px] font-medium">
                  <Target className="h-2.5 w-2.5" />
                  {group.p0} P0
                </span>
              )}
            </div>

            {/* Status columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {group.columns.map((col) => (
                <div key={col.key} className="bg-base/60 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
                      {col.label}
                    </h4>
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
                        —
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      {selectedId && (
        <TicketDrawer
          ticketId={selectedId}
          titleInvoices={invoices}
          onClose={() => setSelectedId(null)}
          onSelect={setSelectedId}
        />
      )}
    </div>
  );
}
