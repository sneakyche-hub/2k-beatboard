"use client";

import clsx from "clsx";

const STATUS_COLOR = {
  active: "bg-accent-primary",
  in_progress: "bg-accent-primary",
  scheduled: "bg-ink-400",
  planning: "bg-ink-400",
  at_risk: "bg-accent-amber",
  delayed: "bg-accent-red",
  blocked: "bg-accent-red",
  completed: "bg-accent-success",
  open: "bg-ink-400",
};

export default function GanttBar({
  label,
  startDate,
  endDate,
  status,
  rangeStart,
  rangeEnd,
  rightLabel,
  brandColor,
}) {
  const total = rangeEnd - rangeStart;
  const s = Math.max(rangeStart, new Date(startDate).getTime());
  const e = Math.min(rangeEnd, new Date(endDate).getTime());
  const left = Math.max(0, ((s - rangeStart) / total) * 100);
  const width = Math.max(2, ((e - s) / total) * 100);
  const colorClass = STATUS_COLOR[status] || "bg-ink-400";
  return (
    <div className="relative h-7 group">
      <div
        className={clsx(
          "absolute top-1 h-5 rounded-md text-[10.5px] text-white px-2 flex items-center font-medium overflow-hidden shadow-sm",
          !brandColor && colorClass
        )}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          backgroundColor: brandColor,
        }}
        title={label}
      >
        <span className="truncate">{label}</span>
      </div>
      {rightLabel && (
        <div className="absolute right-0 top-1 h-5 px-1.5 text-[10px] text-ink-500 hidden md:flex items-center">
          {rightLabel}
        </div>
      )}
    </div>
  );
}
