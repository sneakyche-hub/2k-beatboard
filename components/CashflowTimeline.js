"use client";

import { useState } from "react";
import {
  Receipt,
  AlertOctagon,
  Clock,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { invoices, titles, fmtMoney, fmtDate, DEMO_TODAY_ISO } from "@/lib/data";
import Badge from "./Badge";

const STATUS_META = {
  past_due: {
    label: "Past due",
    tone: "red",
    barClass: "bg-accent-red",
    chipClass: "bg-accent-red/10 text-accent-red border-accent-red/30",
    icon: AlertOctagon,
  },
  due: {
    label: "Due",
    tone: "amber",
    barClass: "bg-accent-amber",
    chipClass: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
    icon: Clock,
  },
  scheduled: {
    label: "Scheduled",
    tone: "neutral",
    barClass: "bg-ink-400",
    chipClass: "bg-ink-300/30 text-ink-700 border-ink-300",
    icon: CalendarClock,
  },
  paid: {
    label: "Paid",
    tone: "success",
    barClass: "bg-accent-success",
    chipClass: "bg-accent-success/10 text-accent-success border-accent-success/30",
    icon: CheckCircle2,
  },
};

function titleFor(id) {
  return titles.find((t) => t.title_id === id);
}

function daysBetween(aIso, bIso) {
  const a = new Date(aIso + "T00:00:00Z").getTime();
  const b = new Date(bIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

function bucketByWindow(invs, today) {
  // Group active (non-paid) invoices into time buckets relative to today.
  return invs.reduce(
    (acc, inv) => {
      if (inv.status === "paid") {
        acc.paid.push(inv);
        return acc;
      }
      const d = daysBetween(today, inv.due_date);
      if (d < 0) acc.past_due.push(inv);
      else if (d <= 7) acc.next_7.push(inv);
      else if (d <= 30) acc.next_30.push(inv);
      else acc.beyond_30.push(inv);
      return acc;
    },
    { past_due: [], next_7: [], next_30: [], beyond_30: [], paid: [] }
  );
}

const WINDOWS = [
  { key: "past_due", label: "Past due", accent: "text-accent-red", barClass: "bg-accent-red" },
  { key: "next_7", label: "Due in 7 days", accent: "text-accent-amber", barClass: "bg-accent-amber" },
  { key: "next_30", label: "Due in 30 days", accent: "text-ink-700", barClass: "bg-accent-primary" },
  { key: "beyond_30", label: "Scheduled · 30+ days", accent: "text-ink-500", barClass: "bg-ink-400" },
];

function sumAmount(list) {
  return list.reduce((s, i) => s + (i.amount_usd || 0), 0);
}

export default function CashflowTimeline() {
  const today = DEMO_TODAY_ISO;
  const [openWindow, setOpenWindow] = useState("past_due");

  const grouped = bucketByWindow(invoices, today);

  const totalPastDue = sumAmount(grouped.past_due);
  const totalNext7 = sumAmount(grouped.next_7);
  const totalNext30 = sumAmount(grouped.next_30) + totalNext7;
  const totalForward = totalNext30 + sumAmount(grouped.beyond_30);

  const activeList = grouped[openWindow] || [];

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="section-title flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-twok-red" />
          Cashflow · invoices & vendor commitments
        </h2>
        <div className="text-[11px] text-ink-500">
          As of {fmtDate(today, { year: true })}
        </div>
      </div>

      {/* Aggregate stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="border border-accent-red/30 bg-accent-red/[0.04] rounded-lg p-3">
          <div className="text-[10.5px] uppercase tracking-wider font-semibold text-accent-red flex items-center gap-1">
            <AlertOctagon className="h-3 w-3" /> Past due
          </div>
          <div className="display text-[20px] font-bold mt-1 mono text-accent-red">
            {fmtMoney(totalPastDue)}
          </div>
          <div className="text-[11px] text-ink-500 mt-0.5">
            {grouped.past_due.length} invoice{grouped.past_due.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="border border-accent-amber/30 bg-accent-amber/[0.04] rounded-lg p-3">
          <div className="text-[10.5px] uppercase tracking-wider font-semibold text-accent-amber flex items-center gap-1">
            <Clock className="h-3 w-3" /> Due next 7 days
          </div>
          <div className="display text-[20px] font-bold mt-1 mono">
            {fmtMoney(totalNext7)}
          </div>
          <div className="text-[11px] text-ink-500 mt-0.5">
            {grouped.next_7.length} invoice{grouped.next_7.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="border border-line rounded-lg p-3">
          <div className="text-[10.5px] uppercase tracking-wider font-semibold text-ink-700 flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Due next 30 days
          </div>
          <div className="display text-[20px] font-bold mt-1 mono">
            {fmtMoney(totalNext30)}
          </div>
          <div className="text-[11px] text-ink-500 mt-0.5">
            {grouped.next_7.length + grouped.next_30.length} invoice
            {grouped.next_7.length + grouped.next_30.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="border border-line rounded-lg p-3">
          <div className="text-[10.5px] uppercase tracking-wider font-semibold text-ink-700 flex items-center gap-1">
            <Receipt className="h-3 w-3" /> Committed forward
          </div>
          <div className="display text-[20px] font-bold mt-1 mono">
            {fmtMoney(totalForward)}
          </div>
          <div className="text-[11px] text-ink-500 mt-0.5">
            All open invoices + scheduled
          </div>
        </div>
      </div>

      {/* Window selector */}
      <div className="border border-line rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 divide-x divide-line">
          {WINDOWS.map((w) => {
            const items = grouped[w.key] || [];
            const isActive = openWindow === w.key;
            return (
              <button
                key={w.key}
                type="button"
                onClick={() => setOpenWindow(w.key)}
                className={`px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-base" : "bg-white hover:bg-base/60"
                }`}
              >
                <div className={`h-0.5 w-6 ${w.barClass} rounded mb-1.5`} />
                <div className={`text-[10.5px] uppercase tracking-wider font-semibold ${w.accent}`}>
                  {w.label}
                </div>
                <div className="text-[13px] font-bold mt-0.5 mono">
                  {fmtMoney(sumAmount(items))}
                </div>
                <div className="text-[10px] text-ink-500 mt-0.5">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active window invoice list */}
        <div className="border-t border-line">
          {activeList.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-ink-400 italic">
              Nothing in this window.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {activeList
                .slice()
                .sort((a, b) => a.due_date.localeCompare(b.due_date))
                .map((inv) => {
                  const t = titleFor(inv.title_id);
                  const meta = STATUS_META[inv.status] || STATUS_META.scheduled;
                  const StatusIcon = meta.icon;
                  const days = daysBetween(today, inv.due_date);
                  return (
                    <li
                      key={inv.invoice_id}
                      className="px-3 py-2.5 grid grid-cols-[auto_1fr_auto] gap-3 items-start"
                    >
                      <div
                        className={`h-full w-1 rounded-sm shrink-0 ${meta.barClass}`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-0.5 text-[9.5px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${meta.chipClass}`}
                          >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {meta.label}
                          </span>
                          {t && (
                            <span
                              className="text-[10px] uppercase tracking-wider font-semibold"
                              style={{ color: t.brand_color }}
                            >
                              {t.title_name}
                            </span>
                          )}
                          <span className="text-[12.5px] font-semibold text-ink-900">
                            {inv.vendor}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-ink-700 mt-0.5 leading-snug">
                          {inv.campaign_name}
                        </div>
                        {inv.notes && (
                          <div className="text-[11px] text-ink-500 mt-1 italic leading-relaxed">
                            {inv.notes}
                          </div>
                        )}
                        <div className="text-[10.5px] text-ink-500 mt-1 flex items-center gap-2 flex-wrap mono">
                          <span>{inv.invoice_id}</span>
                          <span>· PO {inv.po_number}</span>
                          <span>· Net-{inv.net_terms}</span>
                          {inv.paid_date && (
                            <span>· Paid {fmtDate(inv.paid_date)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mono font-bold text-[14px]">
                          {fmtMoney(inv.amount_usd)}
                        </div>
                        <div className="text-[10.5px] text-ink-500 mt-0.5">
                          Due {fmtDate(inv.due_date)}
                        </div>
                        {inv.status !== "paid" && (
                          <div
                            className={`text-[10px] mono mt-0.5 ${
                              days < 0
                                ? "text-accent-red font-semibold"
                                : days <= 7
                                ? "text-accent-amber font-semibold"
                                : "text-ink-500"
                            }`}
                          >
                            {days < 0
                              ? `${Math.abs(days)}d overdue`
                              : days === 0
                              ? "due today"
                              : `in ${days}d`}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
