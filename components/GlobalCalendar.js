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
import Badge from "./Badge";

const VIEW_START = new Date("2026-05-15T00:00:00Z").getTime();
const VIEW_END = new Date("2026-09-30T00:00:00Z").getTime();
const TODAY = new Date("2026-05-24T00:00:00Z").getTime();

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
          {fmtDate(VIEW_START, { year: true })} —{" "}
          {fmtDate(VIEW_END, { year: true })} · 8 titles · 26 beats · 50+ tasks
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
          {/* Today line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-accent-red"
            style={{ left: `${todayPct}%` }}
          >
            <div className="absolute -top-0.5 -translate-x-1/2 text-[9px] font-bold text-accent-red mono whitespace-nowrap">
              TODAY
            </div>
          </div>
        </div>
        <div className="relative">
          {/* Today vertical line through body */}
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
                    label={tab === "beats" ? item.lead_owner || "—" : item.owner}
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
      </section>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
        <span className="font-semibold uppercase tracking-wider text-[10px]">
          Status:
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-accent-success" /> on track /
          completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-accent-primary" /> active /
          in-progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-accent-amber" /> at risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-accent-red" /> blocked / delayed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-ink-400" /> planning / scheduled
        </span>
      </div>
    </div>
  );
}
