"use client";

import { useState, useMemo } from "react";
import {
  X,
  ExternalLink,
  Ban,
  ArrowUpRight,
  Paperclip,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Target,
  DollarSign,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import Badge from "./Badge";
import GoNoGoChecklist from "./GoNoGoChecklist";
import {
  jiraUrl,
  getTicket,
  getBeat,
  getTicketBlockers,
  getActiveBlockers,
  getTicketsBlockedBy,
  getBeatReadiness,
  isTicketDone,
  getInvoicesForTitle,
  fmtDate,
  fmtMoney,
} from "@/lib/data";

// ---- Kanban columns ----
const COLUMNS = [
  { key: "open", label: "Open", match: (s) => s === "open" },
  {
    key: "in_progress",
    label: "In progress",
    match: (s) => s === "in_progress" || s === "scheduled",
  },
  {
    key: "at_risk",
    label: "At risk / blocked",
    match: (s) => s === "at_risk" || s === "blocked",
  },
  { key: "completed", label: "Done", match: (s) => s === "completed" },
];

// ---- Source provenance → human label ----
const SOURCE_KIND = {
  slack: "Slack",
  zoom: "Zoom transcript",
  gmail: "Gmail thread",
  claude_draft: "AI draft",
  internal: "Internal",
  alex_self_assigned: "Self-assigned",
  from_heaven_email: "Vendor email",
  from_zoom_transcript: "Zoom transcript",
};
function sourceLabel(source) {
  if (!source) return "Manual";
  const kind = source.split(":")[0];
  return SOURCE_KIND[kind] || kind.replace(/_/g, " ");
}

// ---- Gate status → tone ----
const GATE_TONE = {
  cleared: "success",
  on_track: "success",
  awaiting_decision: "amber",
  decide_today: "amber",
  held: "red",
};
const GATE_LABEL = {
  cleared: "Cleared",
  on_track: "On track",
  awaiting_decision: "Awaiting decision",
  decide_today: "Decide today",
  held: "Held",
};

function readinessTone(pct) {
  if (pct == null) return "neutral";
  if (pct >= 80) return "success";
  if (pct >= 50) return "amber";
  return "red";
}
const TONE_BAR = {
  success: "bg-accent-success",
  amber: "bg-accent-amber",
  red: "bg-accent-red",
  neutral: "bg-ink-300",
};

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
// Kanban card (#1 clickable, #2 blocker badge)
// ===================================================================
function TicketCard({ ticket, onSelect }) {
  const activeBlockers = getActiveBlockers(ticket);
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onSelect(ticket.ticket_id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(ticket.ticket_id);
        }
      }}
      className="border border-line rounded-md p-2.5 hover:border-ink-300 hover:shadow-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary/40"
    >
      <div className="flex items-center justify-between gap-1">
        <span className="mono text-[10px] text-ink-500">{ticket.ticket_id}</span>
        <Badge status={ticket.priority} size="xs">
          {ticket.priority}
        </Badge>
      </div>
      <div className="text-[12.5px] font-medium mt-1 leading-snug">
        {ticket.summary}
      </div>
      {activeBlockers.length > 0 && (
        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red text-[10px] font-medium">
            <Ban className="h-2.5 w-2.5" />
            Blocked by {activeBlockers.length}
          </span>
        </div>
      )}
      <div className="text-[10.5px] text-ink-500 mt-1.5 flex items-center justify-between">
        <span className="truncate">{ticket.owner}</span>
        <span className="flex items-center gap-1.5 shrink-0 ml-2">
          {ticket.attachments && ticket.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-ink-600">
              <Paperclip className="h-3 w-3" />
              <span className="mono">{ticket.attachments.length}</span>
            </span>
          )}
          <span className="mono">{fmtDate(ticket.due_date)}</span>
        </span>
      </div>
    </li>
  );
}

// ===================================================================
// Ticket detail drawer (#1 + #2)
// ===================================================================
function DepRow({ t, onSelect }) {
  const done = isTicketDone(t);
  return (
    <button
      type="button"
      onClick={() => onSelect(t.ticket_id)}
      className="w-full text-left flex items-center gap-2 p-2 rounded-md border border-line hover:border-ink-300 hover:bg-base/60"
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-accent-success shrink-0" />
      ) : (
        <Ban className="h-3.5 w-3.5 text-accent-red shrink-0" />
      )}
      <span className="mono text-[10px] text-ink-500 shrink-0">
        {t.ticket_id}
      </span>
      <span className="text-[11.5px] truncate flex-1">{t.summary}</span>
      <Badge status={t.status} size="xs">
        {t.status.replace(/_/g, " ")}
      </Badge>
    </button>
  );
}

function TicketDrawer({ ticketId, titleInvoices, onClose, onSelect }) {
  const ticket = ticketId ? getTicket(ticketId) : null;
  if (!ticket) return null;

  const blockers = getTicketBlockers(ticket);
  const activeBlockers = getActiveBlockers(ticket);
  const blocks = getTicketsBlockedBy(ticket.ticket_id);
  const beat = ticket.beat_id ? getBeat(ticket.beat_id) : null;

  // Invoice tied via an attachment's linked_invoice_id.
  const linkedInvoiceIds = (ticket.attachments || [])
    .map((a) => a.linked_invoice_id)
    .filter(Boolean);
  const linkedInvoices = titleInvoices.filter((i) =>
    linkedInvoiceIds.includes(i.invoice_id)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm animate-fade-in flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white border-l border-line shadow-2xl h-full overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={jiraUrl(ticket.ticket_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mono text-[11px] text-accent-primary hover:underline"
              >
                {ticket.ticket_id}
                <ExternalLink className="h-3 w-3" />
              </a>
              <h2 className="text-[15px] font-bold tracking-tight mt-1 leading-snug">
                {ticket.summary}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge status={ticket.priority} size="xs">
                  {ticket.priority}
                </Badge>
                <Badge status={ticket.status} size="xs">
                  {ticket.status.replace(/_/g, " ")}
                </Badge>
                {activeBlockers.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-accent-red font-medium">
                    <Ban className="h-3 w-3" />
                    Blocked
                  </span>
                )}
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
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11.5px]">
            <Meta label="Owner" value={ticket.owner} />
            {ticket.vendor_owner && (
              <Meta label="Vendor" value={ticket.vendor_owner} />
            )}
            <Meta label="Due" value={fmtDate(ticket.due_date)} mono />
            <Meta label="Created" value={fmtDate(ticket.created_date)} mono />
            {ticket.closed_date && (
              <Meta label="Closed" value={fmtDate(ticket.closed_date)} mono />
            )}
            <Meta label="From" value={sourceLabel(ticket.source)} />
          </div>

          {/* Linked KPI */}
          {ticket.linked_kpi && (
            <Section title="Linked KPI">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-accent-violet/10 text-accent-violet text-[11px] mono">
                <Target className="h-3 w-3" />
                {ticket.linked_kpi}
              </span>
            </Section>
          )}

          {/* Beat / release */}
          {beat && (
            <Section title="Beat (release)">
              <div className="border border-line rounded-md p-2.5">
                <div className="text-[12px] font-medium leading-snug">
                  {beat.beat_name}
                </div>
                {beat.go_no_go && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      tone={GATE_TONE[beat.go_no_go.status] || "neutral"}
                      size="xs"
                    >
                      GO/NO-GO:{" "}
                      {GATE_LABEL[beat.go_no_go.status] || beat.go_no_go.status}
                    </Badge>
                    <span className="text-[10.5px] text-ink-500">
                      {fmtDate(beat.go_no_go.decision_date)} ·{" "}
                      {beat.go_no_go.decision_owner}
                    </span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Blocked by (#2) */}
          {blockers.length > 0 && (
            <Section
              title={`Blocked by (${activeBlockers.length} open)`}
              tone={activeBlockers.length > 0 ? "red" : "success"}
            >
              <div className="space-y-1.5">
                {blockers.map((b) => (
                  <DepRow key={b.ticket_id} t={b} onSelect={onSelect} />
                ))}
              </div>
            </Section>
          )}

          {/* Blocks (#2 reverse) */}
          {blocks.length > 0 && (
            <Section title={`Blocks (${blocks.length})`}>
              <div className="space-y-1.5">
                {blocks.map((b) => (
                  <DepRow key={b.ticket_id} t={b} onSelect={onSelect} />
                ))}
              </div>
            </Section>
          )}

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Section title={`Attachments (${ticket.attachments.length})`}>
              <div className="space-y-1.5">
                {ticket.attachments.map((a) => (
                  <div
                    key={a.attachment_id}
                    className="border border-line rounded-md p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <Paperclip className="h-3.5 w-3.5 text-ink-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11.5px] font-medium break-words">
                          {a.filename}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10.5px] text-ink-500">
                          <span className="px-1.5 py-0.5 rounded bg-ink-300/20">
                            {a.type.replace(/_/g, " ")}
                          </span>
                          {a.po_number && (
                            <span className="mono">{a.po_number}</span>
                          )}
                          {a.amount_usd != null && (
                            <span
                              className={`mono font-medium ${
                                a.amount_usd < 0
                                  ? "text-accent-success"
                                  : "text-ink-700"
                              }`}
                            >
                              {fmtMoney(a.amount_usd)}
                            </span>
                          )}
                          {a.linked_invoice_id && (
                            <span className="inline-flex items-center gap-1 text-accent-primary mono">
                              <DollarSign className="h-2.5 w-2.5" />
                              {a.linked_invoice_id}
                            </span>
                          )}
                        </div>
                        {a.notes && (
                          <div className="text-[10.5px] text-ink-600 italic mt-1 leading-snug">
                            {a.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Linked invoices */}
          {linkedInvoices.length > 0 && (
            <Section title="Linked invoices">
              <div className="space-y-1.5">
                {linkedInvoices.map((inv) => (
                  <div
                    key={inv.invoice_id}
                    className="flex items-center justify-between gap-2 border border-line rounded-md p-2.5"
                  >
                    <div className="min-w-0">
                      <div className="mono text-[10.5px] text-ink-500">
                        {inv.invoice_id}
                      </div>
                      <div className="text-[11.5px] truncate">
                        {inv.vendor}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="mono text-[12px] font-medium">
                        {fmtMoney(inv.amount_usd)}
                      </div>
                      <Badge
                        status={inv.status === "paid" ? "completed" : inv.status}
                        size="xs"
                      >
                        {inv.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
        {label}
      </div>
      <div className={`text-ink-900 ${mono ? "mono text-[11px]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, tone, children }) {
  const titleColor =
    tone === "red"
      ? "text-accent-red"
      : tone === "success"
      ? "text-accent-success"
      : "text-ink-500";
  return (
    <div>
      <div
        className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 ${titleColor}`}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ===================================================================
// Main
// ===================================================================
export default function TicketsBoard({ title, tickets, beats, invoices }) {
  const [selectedId, setSelectedId] = useState(null);
  const [gateBeat, setGateBeat] = useState(null);

  const titleInvoices = invoices || getInvoicesForTitle(title.title_id);

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        items: tickets.filter((t) => col.match(t.status)),
      })),
    [tickets]
  );

  return (
    <div className="space-y-5">
      {/* #3 — Beat release readiness rail */}
      <ReadinessRail beats={beats} onOpenGate={setGateBeat} />

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
