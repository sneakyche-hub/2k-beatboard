"use client";

import { useEffect } from "react";
import { X, CheckCircle2, Circle, AlertTriangle, CalendarDays, UserCheck } from "lucide-react";
import { fmtDate } from "@/lib/data";

const STATUS_TONE = {
  delivered: { icon: CheckCircle2, color: "text-accent-success", bg: "bg-accent-success/10", label: "Delivered" },
  outstanding: { icon: Circle, color: "text-accent-amber", bg: "bg-accent-amber/10", label: "Outstanding" },
  blocked: { icon: AlertTriangle, color: "text-accent-red", bg: "bg-accent-red/10", label: "Blocked" },
};

const DECISION_STATUS_LABEL = {
  cleared: "Cleared",
  awaiting_decision: "Awaiting decision",
  held: "Held",
  on_track: "On track",
  decide_today: "Decide today",
};

const DECISION_STATUS_TONE = {
  cleared: "text-accent-success",
  awaiting_decision: "text-accent-amber",
  held: "text-accent-red",
  on_track: "text-accent-success",
  decide_today: "text-accent-amber",
};

export default function GoNoGoChecklist({ beat, titleColor, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!beat || !beat.go_no_go) return null;

  const g = beat.go_no_go;
  const inputs = g.inputs || [];
  const delivered = inputs.filter((i) => i.status === "delivered").length;
  const outstanding = inputs.filter((i) => i.status === "outstanding").length;
  const blocked = inputs.filter((i) => i.status === "blocked").length;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm animate-fade-in flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-3xl bg-white border border-line rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: titleColor || "#888" }}
                />
                GO / NO-GO checklist
              </div>
              <h2 className="text-[17px] font-bold tracking-tight mt-1">
                {beat.beat_name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-ink-700">
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-ink-500" />
                  Decision: <span className="font-semibold">{g.decision_owner}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-ink-500" />
                  {fmtDate(g.decision_date)}
                </span>
                <span className={`font-semibold ${DECISION_STATUS_TONE[g.status] || "text-ink-700"}`}>
                  {DECISION_STATUS_LABEL[g.status] || g.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="h-8 w-8 rounded-md hover:bg-ink-300/20 text-ink-500 flex items-center justify-center shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {g.summary && (
            <p className="text-[12.5px] text-ink-700 leading-relaxed mt-3">
              {g.summary}
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-b border-line bg-base/60 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="display text-[22px] font-bold text-accent-success">{delivered}</div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Delivered</div>
          </div>
          <div>
            <div className="display text-[22px] font-bold text-accent-amber">{outstanding}</div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Outstanding</div>
          </div>
          <div>
            <div className="display text-[22px] font-bold text-accent-red">{blocked}</div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Blocked</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-2.5">
            {inputs.map((input, i) => {
              const tone = STATUS_TONE[input.status] || STATUS_TONE.outstanding;
              const Icon = tone.icon;
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-line"
                >
                  <div className={`h-7 w-7 rounded-md ${tone.bg} ${tone.color} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-ink-900">
                        {input.input}
                      </span>
                      <span className={`text-[10.5px] uppercase tracking-wider font-semibold ${tone.color}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-ink-500 mt-1 flex items-center gap-3 flex-wrap">
                      <span>Owner: <span className="text-ink-700">{input.owner}</span></span>
                      <span>Due: <span className="mono">{fmtDate(input.due)}</span></span>
                    </div>
                    {input.note && (
                      <div className="text-[11.5px] text-ink-700 mt-1 italic">
                        {input.note}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-line px-5 py-3 flex items-center justify-between bg-base/60">
          <div className="text-[11px] text-ink-500">
            Manager view · decision packet for {g.decision_owner}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
