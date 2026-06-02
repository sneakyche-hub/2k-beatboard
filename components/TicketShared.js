"use client";

import Link from "next/link";
import {
  X,
  ExternalLink,
  Ban,
  Paperclip,
  CheckCircle2,
  Target,
  DollarSign,
  Inbox,
} from "lucide-react";
import Badge from "./Badge";
import {
  jiraUrl,
  getTicket,
  getBeat,
  getTicketBlockers,
  getActiveBlockers,
  getTicketsBlockedBy,
  isTicketDone,
  inboxRefForSource,
  inboxHrefForSource,
  COMPONENT_LABEL,
  COMPONENT_TONE,
  fmtDate,
  fmtMoney,
} from "@/lib/data";

// ---- Kanban columns (shared by per-title + portfolio boards) ----
export const COLUMNS = [
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
export function sourceLabel(source) {
  if (!source) return "Manual";
  const kind = source.split(":")[0];
  return SOURCE_KIND[kind] || kind.replace(/_/g, " ");
}

// ---- Gate status → tone ----
export const GATE_TONE = {
  cleared: "success",
  on_track: "success",
  awaiting_decision: "amber",
  decide_today: "amber",
  held: "red",
};
export const GATE_LABEL = {
  cleared: "Cleared",
  on_track: "On track",
  awaiting_decision: "Awaiting decision",
  decide_today: "Decide today",
  held: "Held",
};

export function readinessTone(pct) {
  if (pct == null) return "neutral";
  if (pct >= 80) return "success";
  if (pct >= 50) return "amber";
  return "red";
}
export const TONE_BAR = {
  success: "bg-accent-success",
  amber: "bg-accent-amber",
  red: "bg-accent-red",
  neutral: "bg-ink-300",
};

// ---- Component tag (#7) ----
export function ComponentTag({ component, size = "xs" }) {
  if (!component) return null;
  return (
    <Badge tone={COMPONENT_TONE[component] || "neutral"} size={size}>
      {COMPONENT_LABEL[component] || component}
    </Badge>
  );
}

// ===================================================================
// Kanban card (clickable, blocker badge, component tag)
// ===================================================================
export function TicketCard({ ticket, onSelect, showTitle }) {
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
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <ComponentTag component={ticket.component} />
        {activeBlockers.length > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-red/10 text-accent-red text-[10px] font-medium">
            <Ban className="h-2.5 w-2.5" />
            Blocked by {activeBlockers.length}
          </span>
        )}
      </div>
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
// Ticket detail drawer
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

export function TicketDrawer({ ticketId, titleInvoices, onClose, onSelect }) {
  const ticket = ticketId ? getTicket(ticketId) : null;
  if (!ticket) return null;

  const blockers = getTicketBlockers(ticket);
  const activeBlockers = getActiveBlockers(ticket);
  const blocks = getTicketsBlockedBy(ticket.ticket_id);
  const beat = ticket.beat_id ? getBeat(ticket.beat_id) : null;
  const sourceRef = inboxRefForSource(ticket.source);

  // Invoice tied via an attachment's linked_invoice_id.
  const linkedInvoiceIds = (ticket.attachments || [])
    .map((a) => a.linked_invoice_id)
    .filter(Boolean);
  const linkedInvoices = (titleInvoices || []).filter((i) =>
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge status={ticket.priority} size="xs">
                  {ticket.priority}
                </Badge>
                <Badge status={ticket.status} size="xs">
                  {ticket.status.replace(/_/g, " ")}
                </Badge>
                <ComponentTag component={ticket.component} />
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

          {/* Trace to the raw signal this ticket was created from */}
          {sourceRef && (
            <Link
              href={inboxHrefForSource(ticket.source, ticket.title_id)}
              className="inline-flex items-center gap-1.5 text-[11.5px] text-accent-primary font-medium hover:underline"
            >
              <Inbox className="h-3.5 w-3.5" />
              View source signal in AI Inbox
            </Link>
          )}

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

          {/* Blocked by */}
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

          {/* Blocks (reverse) */}
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
                      <div className="text-[11.5px] truncate">{inv.vendor}</div>
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
