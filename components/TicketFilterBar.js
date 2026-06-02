"use client";

import { Filter, Tag, X } from "lucide-react";
import { SAVED_FILTERS, TICKET_COMPONENTS } from "@/lib/data";

const COMP_TONE_ACTIVE = {
  primary: "bg-accent-primary text-white border-accent-primary",
  violet: "bg-accent-violet text-white border-accent-violet",
  success: "bg-accent-success text-white border-accent-success",
  amber: "bg-accent-amber text-white border-accent-amber",
  red: "bg-accent-red text-white border-accent-red",
  neutral: "bg-ink-700 text-white border-ink-700",
};

// Controlled filter bar shared by the per-title board and the portfolio.
// `savedFilter` is single-select; `components` is a Set of active component ids.
export default function TicketFilterBar({
  savedFilter,
  onSavedFilter,
  components,
  onToggleComponent,
  onClear,
  counts = {},
  componentCounts = {},
  resultCount,
  totalCount,
}) {
  const hasComponentFilter = components && components.size > 0;
  const isFiltered = savedFilter !== "all" || hasComponentFilter;

  return (
    <div className="panel p-3 space-y-2.5">
      {/* Saved filters (JQL-style) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500 font-semibold mr-1">
          <Filter className="h-3 w-3" />
          Filters
        </span>
        {SAVED_FILTERS.map((f) => {
          const active = savedFilter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              title={f.hint}
              onClick={() => onSavedFilter(f.id)}
              className={`px-2 py-1 rounded-full text-[11px] font-medium border transition ${
                active
                  ? "bg-accent-primary text-white border-accent-primary"
                  : "bg-white text-ink-700 border-line hover:border-ink-300"
              }`}
            >
              {f.label}
              {count != null && (
                <span
                  className={`ml-1 mono ${
                    active ? "text-white/80" : "text-ink-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Component chips (multi-select) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500 font-semibold mr-1">
          <Tag className="h-3 w-3" />
          Component
        </span>
        {TICKET_COMPONENTS.map((c) => {
          const active = components && components.has(c.id);
          const count = componentCounts[c.id] || 0;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggleComponent(c.id)}
              className={`px-2 py-1 rounded-full text-[11px] font-medium border transition ${
                active
                  ? COMP_TONE_ACTIVE[c.tone] || COMP_TONE_ACTIVE.neutral
                  : "bg-white text-ink-700 border-line hover:border-ink-300"
              }`}
            >
              {c.label}
              <span
                className={`ml-1 mono ${
                  active ? "text-white/80" : "text-ink-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result line + clear */}
      <div className="flex items-center justify-between pt-1 border-t border-line">
        <span className="text-[11px] text-ink-500">
          Showing <span className="mono text-ink-700">{resultCount}</span>
          {totalCount != null && (
            <span className="text-ink-400"> / {totalCount}</span>
          )}{" "}
          tickets
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
