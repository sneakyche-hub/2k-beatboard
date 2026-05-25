"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  titles,
  beats,
  calendar as calendarTasks,
  fmtDate,
} from "@/lib/data";
import GanttBar from "./GanttBar";

const VIEW_START = new Date("2026-05-15T00:00:00Z").getTime();
const VIEW_END = new Date("2026-09-30T00:00:00Z").getTime();
const TODAY = new Date("2026-05-26T00:00:00Z").getTime();

const STATUS_COLOR = {
  active: "#1F4FDB",
  on_track: "#16A34A",
  completed: "#16A34A",
  at_risk: "#D97706",
  blocked: "#DC2626",
  delayed: "#DC2626",
  planning: "#94A3B8",
  scheduled: "#94A3B8",
};

const GO_NO_GO_TONE = {
  cleared: { fill: "#16A34A", label: "Cleared" },
  on_track: { fill: "#16A34A", label: "On track" },
  awaiting_decision: { fill: "#D97706", label: "Awaiting decision" },
  decide_today: { fill: "#D97706", label: "Decide today" },
  held: { fill: "#DC2626", label: "Held" },
  blocked: { fill: "#DC2626", label: "Blocked" },
};

function monthMarkers() {
  const markers = [];
  let cursor = new Date(VIEW_START);
  cursor.setUTCDate(1);
  while (cursor.getTime() < VIEW_END) {
    markers.push({
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      pct: ((cursor.getTime() - VIEW_START) / (VIEW_END - VIEW_START)) * 100,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return markers;
}

const TASK_TYPE_LABEL = {
  creator_activation: "Creator activation",
  asset_delivery: "Asset delivery",
  creator_quest: "Creator quest",
  reporting: "Reporting",
  earned_media: "Earned media",
  event_prep: "Event prep",
  decision_gate: "Decision gate",
  external_dependency: "External dep",
  measurement: "Measurement",
  paid_media: "Paid media",
  owned_content: "Owned content",
  planning_sync: "Planning sync",
  planning_doc: "Planning doc",
  creative_dev: "Creative dev",
  review_gate: "Review gate",
  decision_prep: "Decision prep",
  analysis: "Analysis",
  comms_draft: "Comms draft",
  platform_update: "Platform update",
  paid_media_replan: "Paid replan",
  creator_brief_revision: "Brief revision",
  product_launch: "Product launch",
  asset_publish: "Asset publish",
  seo_milestone: "SEO milestone",
  legal_gate: "Legal gate",
  vendor_activation: "Vendor activation",
  vendor_brief: "Vendor brief",
  vendor_deliverable: "Vendor deliverable",
  internal_meeting: "Internal meeting",
  process_audit: "Process audit",
  community_event: "Community event",
  creator_seeding: "Creator seeding",
  platform_event: "Platform event",
};

// Pack beats into the minimum number of horizontal lanes so they don't overlap.
function packLanes(items) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const lanes = []; // lanes[i] = last end ms
  return sorted.map((item) => {
    const s = new Date(item.start_date).getTime();
    const e = new Date(item.end_date).getTime();
    let laneIdx = lanes.findIndex((endMs) => endMs <= s);
    if (laneIdx === -1) {
      lanes.push(e);
      laneIdx = lanes.length - 1;
    } else {
      lanes[laneIdx] = e;
    }
    return { item, laneIdx };
  });
}

function pctOf(ms) {
  return ((ms - VIEW_START) / (VIEW_END - VIEW_START)) * 100;
}

function clampedRange(startIso, endIso) {
  const s = Math.max(new Date(startIso).getTime(), VIEW_START);
  const e = Math.min(new Date(endIso).getTime(), VIEW_END);
  if (e <= s) return null;
  return { s, e, leftPct: pctOf(s), widthPct: pctOf(e) - pctOf(s) };
}

function BeatSegments({ beat, brandColor, statusColor }) {
  // If no lifecycle, render single solid bar across start→end.
  if (!beat.lifecycle) {
    const r = clampedRange(beat.start_date, beat.end_date);
    if (!r) return null;
    return (
      <span
        className="absolute inset-y-0 rounded-md border border-white/40 shadow-sm overflow-hidden flex items-center"
        style={{
          left: `${r.leftPct}%`,
          width: `max(${r.widthPct}%, 4px)`,
          backgroundColor: brandColor,
        }}
      >
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: statusColor }}
        />
        <span className="block pl-2 pr-1.5 text-[10.5px] font-semibold text-white truncate leading-tight">
          {beat.beat_name}
        </span>
      </span>
    );
  }

  const lc = beat.lifecycle;
  const planning = clampedRange(lc.planning_start, lc.execution_start);
  const execution = clampedRange(lc.execution_start, lc.wrap_start);
  const wrap = clampedRange(lc.wrap_start, lc.wrap_end);

  const stripe = `repeating-linear-gradient(45deg, ${brandColor}, ${brandColor} 4px, ${brandColor}88 4px, ${brandColor}88 8px)`;

  // Place beat name label inside whichever segment is widest.
  const widest = [
    { key: "execution", r: execution, w: execution?.widthPct || 0 },
    { key: "planning", r: planning, w: planning?.widthPct || 0 },
    { key: "wrap", r: wrap, w: wrap?.widthPct || 0 },
  ].sort((a, b) => b.w - a.w)[0];

  return (
    <>
      {planning && (
        <span
          className="absolute inset-y-0 rounded-l-md border border-white/30 overflow-hidden flex items-center"
          style={{
            left: `${planning.leftPct}%`,
            width: `max(${planning.widthPct}%, 3px)`,
            background: stripe,
            opacity: 0.72,
          }}
        >
          {widest.key === "planning" && (
            <span className="block pl-2 pr-1.5 text-[10.5px] font-semibold text-white truncate leading-tight">
              {beat.beat_name}
            </span>
          )}
        </span>
      )}
      {execution && (
        <span
          className="absolute inset-y-0 border border-white/40 shadow-sm overflow-hidden flex items-center"
          style={{
            left: `${execution.leftPct}%`,
            width: `max(${execution.widthPct}%, 3px)`,
            backgroundColor: brandColor,
            borderTopLeftRadius: planning ? 0 : 6,
            borderBottomLeftRadius: planning ? 0 : 6,
            borderTopRightRadius: wrap ? 0 : 6,
            borderBottomRightRadius: wrap ? 0 : 6,
          }}
        >
          <span
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: statusColor }}
          />
          {widest.key === "execution" && (
            <span className="block pl-2 pr-1.5 text-[10.5px] font-semibold text-white truncate leading-tight">
              {beat.beat_name}
            </span>
          )}
        </span>
      )}
      {wrap && (
        <span
          className="absolute inset-y-0 rounded-r-md border border-white/30 overflow-hidden flex items-center"
          style={{
            left: `${wrap.leftPct}%`,
            width: `max(${wrap.widthPct}%, 3px)`,
            backgroundColor: brandColor,
            opacity: 0.45,
          }}
        >
          {widest.key === "wrap" && (
            <span className="block pl-2 pr-1.5 text-[10.5px] font-semibold text-white truncate leading-tight">
              {beat.beat_name}
            </span>
          )}
        </span>
      )}
      {/* GO/NO-GO diamond at execution_start */}
      {beat.go_no_go && (
        <GoNoGoDiamond
          dateIso={lc.execution_start}
          status={beat.go_no_go.status}
        />
      )}
    </>
  );
}

function GoNoGoDiamond({ dateIso, status }) {
  const ms = new Date(dateIso).getTime();
  if (ms < VIEW_START || ms > VIEW_END) return null;
  const left = pctOf(ms);
  const tone = GO_NO_GO_TONE[status] || GO_NO_GO_TONE.awaiting_decision;
  return (
    <span
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
      style={{ left: `${left}%` }}
      title={`GO/NO-GO ${tone.label} · ${fmtDate(dateIso)}`}
    >
      <span
        className="block h-3 w-3 rotate-45 border border-white shadow"
        style={{ backgroundColor: tone.fill }}
      />
    </span>
  );
}

export default function GlobalCalendar() {
  const [filterTitle, setFilterTitle] = useState("all");
  const [tab, setTab] = useState("beats"); // beats | tasks

  const markers = useMemo(() => monthMarkers(), []);
  const todayPct = ((TODAY - VIEW_START) / (VIEW_END - VIEW_START)) * 100;

  const filteredBeats = beats.filter(
    (b) =>
      (filterTitle === "all" || b.title_id === filterTitle) &&
      new Date(b.end_date).getTime() >= VIEW_START &&
      new Date(b.start_date).getTime() <= VIEW_END
  );
  const filteredTasks = calendarTasks.filter(
    (t) =>
      (filterTitle === "all" || t.title_id === filterTitle) &&
      new Date(t.end_date).getTime() >= VIEW_START &&
      new Date(t.start_date).getTime() <= VIEW_END
  );

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
          Global Calendar
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          One view of the portfolio.
        </h1>
        <p className="text-[13px] text-ink-500 mt-1">
          {fmtDate(VIEW_START, { year: true })} to{" "}
          {fmtDate(VIEW_END, { year: true })} · 8 titles · 26 beats · 50+ tasks
          · planning / execution / wrap shown distinctly with GO/NO-GO gates.
        </p>
      </div>

      {/* Controls */}
      <div className="panel p-3 flex flex-wrap items-center gap-2">
        <div className="flex bg-base rounded-md p-0.5 border border-line">
          <button
            type="button"
            onClick={() => setTab("beats")}
            className={`px-3 py-1 text-[12px] font-medium rounded ${
              tab === "beats"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500"
            }`}
          >
            Beats
          </button>
          <button
            type="button"
            onClick={() => setTab("tasks")}
            className={`px-3 py-1 text-[12px] font-medium rounded ${
              tab === "tasks"
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500"
            }`}
          >
            Tasks
          </button>
        </div>
        <span className="text-[11px] text-ink-500 ml-1 hidden md:inline">
          Filter:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTitle("all")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${
              filterTitle === "all"
                ? "bg-ink-900 text-white border-ink-900"
                : "border-line text-ink-700 hover:bg-ink-300/20"
            }`}
          >
            All titles
          </button>
          {titles.map((t) => (
            <button
              key={t.title_id}
              type="button"
              onClick={() => setFilterTitle(t.title_id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border flex items-center gap-1.5 ${
                filterTitle === t.title_id
                  ? "border-ink-900 bg-ink-900/5"
                  : "border-line text-ink-700 hover:bg-ink-300/20"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.brand_color }}
              />
              {t.title_name}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt */}
      <section className="panel overflow-hidden">
        {/* Month header */}
        <div className="relative h-7 border-b border-line bg-base/50">
          {markers.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 h-full text-[10.5px] mono text-ink-500 font-semibold pl-1 border-l border-line/70"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </div>
          ))}
          <div
            className="absolute top-0 bottom-0 w-px bg-accent-red"
            style={{ left: `${todayPct}%` }}
          >
            <div className="absolute -top-0.5 -translate-x-1/2 text-[9px] font-bold text-accent-red mono whitespace-nowrap">
              TODAY
            </div>
          </div>
        </div>

        {/* All-titles + beats: title swimlanes with lane stacking. */}
        {tab === "beats" && filterTitle === "all" ? (
          <div className="relative">
            <div
              className="absolute top-0 bottom-0 w-px bg-accent-red/40 pointer-events-none z-10"
              style={{ left: `${todayPct}%` }}
            />
            {titles.map((t) => {
              const titleBeats = filteredBeats.filter(
                (b) => b.title_id === t.title_id
              );
              const packed = packLanes(titleBeats);
              const laneCount = packed.reduce(
                (max, p) => Math.max(max, p.laneIdx + 1),
                1
              );
              const LANE_HEIGHT = 26; // px per lane
              const LANE_GAP = 4;
              const rowHeight =
                Math.max(1, laneCount) * LANE_HEIGHT +
                Math.max(0, laneCount - 1) * LANE_GAP +
                16; // top/bottom padding

              return (
                <div
                  key={t.title_id}
                  className="grid grid-cols-[200px_1fr] md:grid-cols-[220px_1fr] border-b border-line last:border-b-0 hover:bg-base/40"
                >
                  <Link
                    href={`/titles/${t.franchise_slug}`}
                    className="px-3 py-3 border-r border-line min-w-0 hover:bg-ink-300/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.brand_color }}
                      />
                      <span className="text-[12.5px] font-semibold truncate">
                        {t.title_name}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-ink-500 mt-0.5">
                      {titleBeats.length} beat
                      {titleBeats.length === 1 ? "" : "s"} ·{" "}
                      {laneCount} lane{laneCount === 1 ? "" : "s"}
                    </div>
                  </Link>
                  <div
                    className="relative"
                    style={{ height: `${rowHeight}px` }}
                  >
                    {packed.map(({ item: b, laneIdx }) => {
                      const statusColor =
                        STATUS_COLOR[b.status] || t.brand_color;
                      const top = 8 + laneIdx * (LANE_HEIGHT + LANE_GAP);
                      return (
                        <Link
                          key={b.beat_id}
                          href={`/titles/${t.franchise_slug}`}
                          className="absolute group hover:ring-2 hover:ring-ink-900/10 rounded-md transition-all"
                          style={{
                            top: `${top}px`,
                            left: 0,
                            right: 0,
                            height: `${LANE_HEIGHT}px`,
                          }}
                          title={`${b.beat_name} · ${b.status} · ${fmtDate(
                            b.start_date
                          )} → ${fmtDate(b.end_date)}${
                            b.lifecycle
                              ? ` · plan→exec ${fmtDate(
                                  b.lifecycle.execution_start
                                )}`
                              : ""
                          }`}
                        >
                          <BeatSegments
                            beat={b}
                            brandColor={t.brand_color}
                            statusColor={statusColor}
                          />
                        </Link>
                      );
                    })}
                    {titleBeats.length === 0 && (
                      <div className="absolute inset-0 flex items-center pl-2 text-[10.5px] text-ink-400">
                        No beats in this window
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative">
            <div
              className="absolute top-0 bottom-0 w-px bg-accent-red/40 pointer-events-none z-10"
              style={{ left: `${todayPct}%` }}
            />
            {(tab === "beats" ? filteredBeats : filteredTasks).map((item) => {
              const t = titles.find((x) => x.title_id === item.title_id);
              const label =
                tab === "beats" ? item.beat_name : item.task_name;
              const sub =
                tab === "beats"
                  ? `${fmtDate(item.start_date)} → ${fmtDate(item.end_date)}`
                  : TASK_TYPE_LABEL[item.task_type] || item.task_type;
              return (
                <div
                  key={tab === "beats" ? item.beat_id : item.task_id}
                  className="grid grid-cols-[200px_1fr] md:grid-cols-[260px_1fr] border-b border-line last:border-b-0 hover:bg-base/40"
                >
                  <div className="px-3 py-2.5 border-r border-line min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: t?.brand_color || "#94A3B8",
                        }}
                      />
                      <span className="text-[12.5px] font-medium truncate">
                        {label}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-500 mt-0.5 truncate">
                      {sub}
                    </div>
                  </div>
                  <div className="relative px-2">
                    <GanttBar
                      label={tab === "beats" ? item.lead_owner || "n/a" : item.owner}
                      startDate={item.start_date}
                      endDate={item.end_date}
                      status={item.status}
                      rangeStart={VIEW_START}
                      rangeEnd={VIEW_END}
                      brandColor={t?.brand_color}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Legend */}
      <div className="panel p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-700">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-ink-500">
            Phases:
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-6 rounded-sm border border-line"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #3b82f6, #3b82f6 4px, #3b82f688 4px, #3b82f688 8px)",
                opacity: 0.72,
              }}
            />
            Planning (striped)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded-sm bg-accent-primary" />
            Execution (solid)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-6 rounded-sm bg-accent-primary"
              style={{ opacity: 0.45 }}
            />
            Wrap (dimmed)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rotate-45 bg-accent-amber border border-white shadow-sm" />
            GO/NO-GO gate
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-500 pt-2 border-t border-line">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Status accent:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-accent-success" /> on track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-accent-primary" /> active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-accent-amber" /> at risk
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-accent-red" /> blocked / delayed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-ink-400" /> planning
          </span>
        </div>
      </div>
    </div>
  );
}
