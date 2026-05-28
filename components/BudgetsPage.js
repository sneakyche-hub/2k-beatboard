"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  quarterlyPnl,
  tickets,
  titles,
  invoices,
  fmtMoney,
  fmtDate,
} from "@/lib/data";
import {
  DollarSign,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Paperclip,
  FileSpreadsheet,
  Info,
} from "lucide-react";

function titleColor(titleId) {
  return titles.find((t) => t.title_id === titleId)?.brand_color || "#666";
}

function titleSlug(titleId) {
  return titles.find((t) => t.title_id === titleId)?.franchise_slug || titleId;
}

function VarianceBar({ pct, status }) {
  // pct can be negative (under) or positive (over). Cap visual at +/-50%.
  const capped = Math.max(-50, Math.min(50, pct || 0));
  const widthPct = Math.abs(capped) * 1.6; // map 50 -> 80%
  const color =
    status === "over"
      ? "#dc2626"
      : status === "under"
      ? "#0891b2"
      : "#94a3b8";
  return (
    <div className="relative h-1.5 bg-ink-300/30 rounded overflow-hidden">
      <div className="absolute top-0 left-1/2 h-full w-px bg-ink-500/30" />
      <div
        className="absolute top-0 h-full rounded"
        style={{
          width: `${widthPct}%`,
          backgroundColor: color,
          left: capped >= 0 ? "50%" : `${50 - widthPct}%`,
        }}
      />
    </div>
  );
}

export default function BudgetsPage() {
  const [activeQuarter, setActiveQuarter] = useState(
    quarterlyPnl.quarters.find((q) => q.status === "in_flight")?.quarter ||
      quarterlyPnl.quarters[0].quarter
  );
  const quarter = quarterlyPnl.quarters.find(
    (q) => q.quarter === activeQuarter
  );

  // Aggregate all ticket attachments that look like vendor invoices,
  // sorted most-recent first — cross-title invoice register view.
  const invoiceAttachments = useMemo(() => {
    const out = [];
    for (const t of tickets) {
      for (const a of t.attachments || []) {
        if (a.type === "vendor_invoice") {
          out.push({ ...a, ticket: t });
        }
      }
    }
    return out.sort(
      (a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
  }, []);

  // All attachments — used for the "attachments index" footer count by type.
  const allAttachments = useMemo(() => {
    const out = [];
    for (const t of tickets) {
      for (const a of t.attachments || []) {
        out.push({ ...a, ticket: t });
      }
    }
    return out;
  }, []);

  const attachmentsByType = useMemo(() => {
    const map = new Map();
    for (const a of allAttachments) {
      map.set(a.type, (map.get(a.type) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [allAttachments]);

  const isInFlight = quarter.status === "in_flight";

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
          <DollarSign className="h-3 w-3" /> Budgets
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          Quarterly P&amp;L — plan vs actual
        </h1>
        <p className="text-[13px] text-ink-500 mt-1 max-w-3xl">
          Manager-track view: I read variance against the canonical Marketing
          Finance Excel and the underlying Jira ticket + vendor invoice payload.
          I do not authorize spend tranches — those are Davide GO/NO-GOs.
        </p>

        <div className="mt-3 p-3 rounded-md border border-line bg-ink-50/40 text-[12px] text-ink-700 flex items-start gap-2 max-w-3xl">
          <Info className="h-3.5 w-3.5 mt-0.5 text-ink-500 shrink-0" />
          <div>
            <span className="font-semibold">System of record: </span>
            {quarterlyPnl.source_note}
          </div>
        </div>
      </div>

      {/* Quarter selector */}
      <div className="border-b border-line">
        <div className="flex flex-wrap gap-1">
          {quarterlyPnl.quarters.map((q) => {
            const isActive = q.quarter === activeQuarter;
            return (
              <button
                key={q.quarter}
                type="button"
                onClick={() => setActiveQuarter(q.quarter)}
                className={`px-3 py-2 text-[12.5px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-accent-primary text-accent-primary"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                }`}
              >
                {q.quarter} {q.period_label}
                <span
                  className={`text-[9.5px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                    q.status === "closed"
                      ? "bg-ink-300/40 text-ink-700"
                      : "bg-accent-primary/10 text-accent-primary"
                  }`}
                >
                  {q.status === "closed" ? "Closed" : "In flight"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Headline + totals */}
      <div className="panel p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
              Plan
            </div>
            <div className="display text-[24px] font-bold mt-1">
              {fmtMoney(quarter.plan_total_usd)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
              {isInFlight ? "Actual to date" : "Actual"}
            </div>
            <div className="display text-[24px] font-bold mt-1">
              {fmtMoney(
                isInFlight
                  ? quarter.actual_to_date_usd
                  : quarter.actual_total_usd
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
              {isInFlight ? "Projected" : "Variance $"}
            </div>
            <div className="display text-[24px] font-bold mt-1">
              {fmtMoney(
                isInFlight
                  ? quarter.projected_total_usd
                  : quarter.variance_total_usd
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
              Variance %
            </div>
            <div
              className={`display text-[24px] font-bold mt-1 mono ${
                (isInFlight
                  ? quarter.variance_projected_pct
                  : quarter.variance_total_pct) > 0
                  ? "text-red-600"
                  : "text-cyan-700"
              }`}
            >
              {(isInFlight
                ? quarter.variance_projected_pct
                : quarter.variance_total_pct) > 0
                ? "+"
                : ""}
              {(isInFlight
                ? quarter.variance_projected_pct
                : quarter.variance_total_pct
              ).toFixed(1)}
              %
            </div>
          </div>
        </div>

        <div className="mt-4 text-[12.5px] text-ink-700 leading-relaxed">
          <span className="font-semibold">Headline: </span>
          {quarter.headline}
        </div>
      </div>

      {/* Title variance table */}
      <div className="panel p-5">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Variance by title
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold border-b border-line">
                <th className="pb-2 pr-3">Title</th>
                <th className="pb-2 pr-3 text-right">Plan</th>
                <th className="pb-2 pr-3 text-right">
                  {isInFlight ? "To date" : "Actual"}
                </th>
                {isInFlight && (
                  <th className="pb-2 pr-3 text-right">Projected</th>
                )}
                <th className="pb-2 pr-3 text-right">Variance $</th>
                <th className="pb-2 pr-3 text-right">Variance %</th>
                <th className="pb-2 pl-2 w-[180px]">Trend</th>
              </tr>
            </thead>
            <tbody>
              {quarter.titles.map((row) => {
                const variancePct = isInFlight
                  ? row.variance_projected_pct
                  : row.variance_pct;
                const varianceUsd = isInFlight
                  ? row.variance_projected_usd
                  : row.variance_usd;
                return (
                  <tr
                    key={row.title_id}
                    className="border-b border-line/50 last:border-0 hover:bg-ink-50/40 group"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/titles/${titleSlug(row.title_id)}`}
                        className="flex items-center gap-2 font-medium group-hover:underline"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: titleColor(row.title_id) }}
                        />
                        {row.title_name}
                      </Link>
                      {row.notes && (
                        <div className="text-[11px] text-ink-500 mt-0.5 pl-4 leading-snug max-w-[520px]">
                          {row.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 mono text-right align-top">
                      {fmtMoney(row.plan_usd)}
                    </td>
                    <td className="py-2.5 pr-3 mono text-right align-top">
                      {fmtMoney(
                        isInFlight ? row.actual_to_date_usd : row.actual_usd
                      )}
                    </td>
                    {isInFlight && (
                      <td className="py-2.5 pr-3 mono text-right align-top">
                        {fmtMoney(row.projected_usd)}
                      </td>
                    )}
                    <td
                      className={`py-2.5 pr-3 mono text-right align-top ${
                        varianceUsd > 0
                          ? "text-red-600"
                          : varianceUsd < 0
                          ? "text-cyan-700"
                          : "text-ink-500"
                      }`}
                    >
                      {varianceUsd > 0 ? "+" : ""}
                      {fmtMoney(varianceUsd)}
                    </td>
                    <td
                      className={`py-2.5 pr-3 mono text-right align-top ${
                        variancePct > 0
                          ? "text-red-600"
                          : variancePct < 0
                          ? "text-cyan-700"
                          : "text-ink-500"
                      }`}
                    >
                      {variancePct > 0 ? "+" : ""}
                      {variancePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 pl-2 align-top pr-2">
                      <VarianceBar
                        pct={variancePct}
                        status={row.variance_status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-ink-500 mt-3 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-cyan-700" /> Under plan
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-red-600" /> Over plan
          </span>
          <span className="text-ink-400">·</span>
          <span>Bar centered at plan. Cap +/-50%.</span>
        </div>
      </div>

      {/* Top holds / variance drivers */}
      {isInFlight && (
        <div className="panel p-5">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Top variance drivers
          </h2>
          <ul className="space-y-3 text-[12.5px]">
            {quarter.titles
              .filter((t) => Math.abs(t.variance_projected_pct) >= 15)
              .sort(
                (a, b) =>
                  Math.abs(b.variance_projected_pct) -
                  Math.abs(a.variance_projected_pct)
              )
              .map((row) => (
                <li
                  key={row.title_id}
                  className="border-l-2 pl-3 py-1 leading-snug"
                  style={{ borderColor: titleColor(row.title_id) }}
                >
                  <div className="font-semibold flex items-center gap-2">
                    {row.title_name}
                    <span
                      className={`mono text-[11px] font-bold ${
                        row.variance_projected_pct > 0
                          ? "text-red-600"
                          : "text-cyan-700"
                      }`}
                    >
                      {row.variance_projected_pct > 0 ? "+" : ""}
                      {row.variance_projected_pct.toFixed(1)}% (
                      {row.variance_projected_usd > 0 ? "+" : ""}
                      {fmtMoney(row.variance_projected_usd)})
                    </span>
                  </div>
                  <div className="text-ink-700 mt-0.5">{row.notes}</div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Recent vendor invoices (cross-ticket) */}
      <div className="panel p-5">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5" /> Recent vendor invoices (from
          ticket attachments)
        </h2>
        <p className="text-[11.5px] text-ink-500 mb-3">
          Cross-ticket invoice register. Each row is a vendor invoice attached
          to an operational Jira ticket, with PO + amount cross-linked to the
          invoices table.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold border-b border-line">
                <th className="pb-2 pr-3">Filename</th>
                <th className="pb-2 pr-3">Ticket</th>
                <th className="pb-2 pr-3">PO</th>
                <th className="pb-2 pr-3 text-right">Amount</th>
                <th className="pb-2 pr-3">Uploaded</th>
                <th className="pb-2 pr-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {invoiceAttachments.map((a) => (
                <tr
                  key={a.attachment_id}
                  className="border-b border-line/50 last:border-0 hover:bg-ink-50/40"
                >
                  <td className="py-2 pr-3 mono text-[11px] truncate max-w-[280px]">
                    {a.filename}
                  </td>
                  <td className="py-2 pr-3">
                    <Link
                      href={`/titles/${titleSlug(a.ticket.title_id)}`}
                      className="mono text-[11px] hover:underline"
                      style={{ color: titleColor(a.ticket.title_id) }}
                    >
                      {a.ticket.ticket_id}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 mono text-[11px] text-ink-700">
                    {a.po_number || "—"}
                  </td>
                  <td
                    className={`py-2 pr-3 mono text-right ${
                      a.amount_usd < 0 ? "text-cyan-700" : ""
                    }`}
                  >
                    {a.amount_usd != null ? fmtMoney(a.amount_usd) : "—"}
                  </td>
                  <td className="py-2 pr-3 mono text-[11px] text-ink-500">
                    {fmtDate(a.uploaded_at)}
                  </td>
                  <td className="py-2 pr-3 text-[11.5px] text-ink-700 leading-snug max-w-[300px]">
                    {a.notes || ""}
                  </td>
                </tr>
              ))}
              {invoiceAttachments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-ink-400 italic text-center"
                  >
                    No vendor invoices attached yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachments index */}
      <div className="panel p-5">
        <h2 className="section-title mb-3">Attachments index</h2>
        <p className="text-[11.5px] text-ink-500 mb-3">
          {allAttachments.length} files attached across{" "}
          {tickets.filter((t) => t.attachments?.length > 0).length} tickets.
          Demonstrates the ticket-as-system-of-record pattern — invoices, SOWs,
          briefs, and deliverables live on the ticket they relate to.
        </p>
        <div className="flex flex-wrap gap-2">
          {attachmentsByType.map(([type, count]) => (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 text-[11.5px] border border-line rounded px-2 py-1 bg-white"
            >
              <span className="font-semibold capitalize">
                {type.replace(/_/g, " ")}
              </span>
              <span className="mono text-ink-500">{count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="text-[10.5px] text-ink-400 text-center pt-2">
        As of {fmtDate(quarterlyPnl.as_of_date, { year: true })} · FY
        {quarterlyPnl.fiscal_year}
      </div>
    </div>
  );
}
