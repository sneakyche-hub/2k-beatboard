/* eslint-disable no-console */
// -------------------------------------------------------------------
// Data integrity gate — runs before `next build`.
//
// Enforces the project rule: every priority item and every blocker must
// be tracked in Jira. If any of these checks fail, the build fails, so
// the connectivity can never silently regress as new data is added.
//
//   1. Every ticket `is_blocked_by` reference resolves to a real ticket.
//   2. Every surfaced beat (Asset Lock / at_risk / delayed) has at least
//      one governing ticket on the beat.
//   3. Every decision (pending + closed) links to a real ticket.
//   4. Referential hygiene: ticket.title_id and ticket.beat_id resolve;
//      attachment.linked_invoice_id resolves.
//
// Run standalone with `npm run validate`.
// -------------------------------------------------------------------
const path = require("path");

const DATA = path.join(__dirname, "..", "data");
const load = (f) => require(path.join(DATA, f));

const tickets = load("tickets.json");
const beats = load("marketing_beats.json");
const decisions = load("decision_log.json");
const standup = load("daily_standup.json");
const titles = load("titles.json");
const invoices = load("invoices.json");

const ticketIds = new Set(tickets.map((t) => t.ticket_id));
const titleIds = new Set(titles.map((t) => t.title_id));
const beatIds = new Set(beats.map((b) => b.beat_id));
const invoiceIds = new Set(invoices.map((i) => i.invoice_id));
const ticketsByBeat = new Map();
for (const t of tickets) {
  if (!t.beat_id) continue;
  if (!ticketsByBeat.has(t.beat_id)) ticketsByBeat.set(t.beat_id, []);
  ticketsByBeat.get(t.beat_id).push(t);
}

const errors = [];
const err = (msg) => errors.push(msg);

// 1. Blocker references must resolve to a real ticket.
for (const t of tickets) {
  for (const b of t.is_blocked_by || []) {
    if (!ticketIds.has(b)) {
      err(`Ticket ${t.ticket_id} is blocked_by "${b}" — no such Jira ticket.`);
    }
  }
}

// 2. Every surfaced beat must have a governing ticket on the beat.
const isSurfaced = (b) =>
  b.lifecycle_stage === "Asset Lock" ||
  b.status === "at_risk" ||
  b.status === "delayed";
for (const b of beats) {
  if (!isSurfaced(b)) continue;
  const onBeat = ticketsByBeat.get(b.beat_id) || [];
  if (onBeat.length === 0) {
    err(
      `Beat "${b.beat_id}" surfaces in Needs Attention (${
        b.lifecycle_stage === "Asset Lock" ? "Asset Lock" : b.status
      }) but has NO ticket tracking it in Jira.`
    );
  }
}

// 3. Every decision (pending + closed) must link to a real ticket.
for (const d of standup.pending_decisions || []) {
  if (!d.linked_ticket_id) {
    err(`Pending decision "${d.decision_id}" has no linked_ticket_id.`);
  } else if (!ticketIds.has(d.linked_ticket_id)) {
    err(
      `Pending decision "${d.decision_id}" links to "${d.linked_ticket_id}" — no such Jira ticket.`
    );
  }
}
for (const d of decisions) {
  if (!d.linked_ticket_id) {
    err(`Closed decision "${d.decision_id}" has no linked_ticket_id.`);
  } else if (!ticketIds.has(d.linked_ticket_id)) {
    err(
      `Closed decision "${d.decision_id}" links to "${d.linked_ticket_id}" — no such Jira ticket.`
    );
  }
}

// 4. Referential hygiene on tickets.
for (const t of tickets) {
  if (t.title_id && !titleIds.has(t.title_id)) {
    err(`Ticket ${t.ticket_id} references unknown title "${t.title_id}".`);
  }
  if (t.beat_id && !beatIds.has(t.beat_id)) {
    err(`Ticket ${t.ticket_id} references unknown beat "${t.beat_id}".`);
  }
  for (const a of t.attachments || []) {
    if (a.linked_invoice_id && !invoiceIds.has(a.linked_invoice_id)) {
      err(
        `Ticket ${t.ticket_id} attachment "${a.attachment_id}" links invoice "${a.linked_invoice_id}" — no such invoice.`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(
    `\n\u2717 Data integrity check failed — ${errors.length} issue(s):\n`
  );
  for (const e of errors) console.error(`  \u2022 ${e}`);
  console.error(
    "\nEvery blocker, surfaced beat, and decision must trace to a real Jira ticket.\n"
  );
  process.exit(1);
}

console.log(
  `\u2713 Data integrity OK — ${tickets.length} tickets, ${beats.length} beats, ${
    decisions.length + (standup.pending_decisions || []).length
  } decisions; all blockers and priority items trace to Jira.`
);
