"use client";

import { CheckCircle2, Circle, CircleDot, Calendar } from "lucide-react";
import { fmtDate, DEMO_TODAY_ISO } from "@/lib/data";

// Derive 7 sub-phases from a beat's lifecycle dates.
// Planning span splits into Planning / Brief Lock / Asset Production (40/30/30).
// Execution span splits into Kickoff (first 5 days) / In-flight (rest).
// Wrap span splits into Wrap (first 60%) / Post-mortem (last 40%).
function derivePhases(lifecycle) {
  const ms = (iso) => new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).getTime();
  const iso = (n) => new Date(n).toISOString().slice(0, 10);

  const planS = ms(lifecycle.planning_start);
  const planE = ms(lifecycle.execution_start);
  const execE = ms(lifecycle.wrap_start);
  const wrapE = ms(lifecycle.wrap_end);

  const planSpan = planE - planS;
  const kickoffSpan = Math.min(5 * 86400000, execE - planE);
  const wrapSpan = wrapE - execE;

  return [
    {
      key: "planning",
      label: "Planning",
      start: lifecycle.planning_start,
      end: iso(planS + planSpan * 0.4),
      blurb: "Scope brief, vendor outreach, owner alignment.",
    },
    {
      key: "brief_lock",
      label: "Brief Lock",
      start: iso(planS + planSpan * 0.4),
      end: iso(planS + planSpan * 0.7),
      blurb: "Lock creative brief + measurement plan. Distribute to vendors.",
    },
    {
      key: "asset_production",
      label: "Asset Production",
      start: iso(planS + planSpan * 0.7),
      end: lifecycle.execution_start,
      blurb: "Brand QA, asset adapt sets, paid creative finalization.",
    },
    {
      key: "kickoff",
      label: "Kickoff",
      start: lifecycle.execution_start,
      end: iso(planE + kickoffSpan),
      blurb: "GO/NO-GO clears, flights launch, day-1 monitoring.",
    },
    {
      key: "in_flight",
      label: "In-flight",
      start: iso(planE + kickoffSpan),
      end: lifecycle.wrap_start,
      blurb: "Active campaign — pacing, optimization, sentiment monitoring.",
    },
    {
      key: "wrap",
      label: "Wrap",
      start: lifecycle.wrap_start,
      end: iso(execE + wrapSpan * 0.6),
      blurb: "Vendor invoicing, paid spend reconciliation, asset archive.",
    },
    {
      key: "post_mortem",
      label: "Post-mortem",
      start: iso(execE + wrapSpan * 0.6),
      end: lifecycle.wrap_end,
      blurb: "Learnings doc, KPI vs target readout, next-cycle hand-off.",
    },
  ];
}

function statusForPhase(phase, todayIso) {
  const today = new Date(todayIso + "T00:00:00Z").getTime();
  const start = new Date(phase.start + "T00:00:00Z").getTime();
  const end = new Date(phase.end + "T00:00:00Z").getTime();
  if (today < start) return "upcoming";
  if (today >= end) return "complete";
  return "in_progress";
}

const STATUS_META = {
  complete: { icon: CheckCircle2, color: "text-accent-success", bg: "bg-accent-success", label: "Complete" },
  in_progress: { icon: CircleDot, color: "text-accent-primary", bg: "bg-accent-primary", label: "In-progress" },
  upcoming: { icon: Circle, color: "text-ink-400", bg: "bg-ink-300", label: "Upcoming" },
};

export default function PhaseBreakdown({ beat, brandColor }) {
  if (!beat || !beat.lifecycle) return null;
  const phases = derivePhases(beat.lifecycle);
  const today = DEMO_TODAY_ISO;
  const phasesWithStatus = phases.map((p) => ({
    ...p,
    status: statusForPhase(p, today),
  }));

  // Strip range = planning_start → wrap_end
  const stripStart = new Date(beat.lifecycle.planning_start + "T00:00:00Z").getTime();
  const stripEnd = new Date(beat.lifecycle.wrap_end + "T00:00:00Z").getTime();
  const stripSpan = stripEnd - stripStart;
  const todayMs = new Date(today + "T00:00:00Z").getTime();
  const todayPct =
    todayMs >= stripStart && todayMs <= stripEnd
      ? ((todayMs - stripStart) / stripSpan) * 100
      : null;

  return (
    <div className="panel p-4 space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div
            className="text-[10.5px] uppercase tracking-wider font-semibold"
            style={{ color: brandColor }}
          >
            Lifecycle breakdown
          </div>
          <h3 className="text-[15px] font-semibold mt-0.5">{beat.beat_name}</h3>
        </div>
        <div className="text-[11px] text-ink-500 inline-flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {fmtDate(beat.lifecycle.planning_start)} →{" "}
          {fmtDate(beat.lifecycle.wrap_end)}
        </div>
      </div>

      {/* Strip */}
      <div className="relative">
        <div className="flex h-3 rounded-full overflow-hidden border border-line">
          {phasesWithStatus.map((p) => {
            const s = new Date(p.start + "T00:00:00Z").getTime();
            const e = new Date(p.end + "T00:00:00Z").getTime();
            const width = ((e - s) / stripSpan) * 100;
            const meta = STATUS_META[p.status];
            const opacity =
              p.status === "complete"
                ? 0.85
                : p.status === "in_progress"
                ? 1
                : 0.35;
            return (
              <span
                key={p.key}
                className={`${meta.bg}`}
                style={{
                  width: `${width}%`,
                  opacity,
                }}
                title={`${p.label} · ${meta.label}`}
              />
            );
          })}
        </div>
        {todayPct != null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-accent-red"
            style={{ left: `${todayPct}%` }}
            title={`Today · ${fmtDate(today)}`}
          />
        )}
      </div>

      {/* Phase cards */}
      <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {phasesWithStatus.map((p, i) => {
          const meta = STATUS_META[p.status];
          const Icon = meta.icon;
          return (
            <li
              key={p.key}
              className={`border rounded-lg p-3 ${
                p.status === "in_progress"
                  ? "border-accent-primary/40 bg-accent-primary/[0.04]"
                  : "border-line"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="mono text-[10.5px] text-ink-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                <span className="text-[12.5px] font-semibold">{p.label}</span>
              </div>
              <div className="text-[10.5px] mono text-ink-500 mt-1">
                {fmtDate(p.start)} → {fmtDate(p.end)}
              </div>
              <p className="text-[11.5px] text-ink-700 leading-relaxed mt-1.5">
                {p.blurb}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
