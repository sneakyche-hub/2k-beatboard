import titles from "@/data/titles.json";
import standup from "@/data/daily_standup.json";
import vendors from "@/data/vendors.json";
import beats from "@/data/marketing_beats.json";
import calendar from "@/data/production_calendar.json";
import tickets from "@/data/tickets.json";
import zoomTranscripts from "@/data/zoom_transcripts.json";
import slackMessages from "@/data/slack_messages.json";
import gmailThreads from "@/data/gmail_threads.json";
import escalationDrafts from "@/data/escalation_drafts.json";
import activityFeed from "@/data/activity_feed.json";
import analyticsRollups from "@/data/analytics_rollups.json";
import connections from "@/data/connections.json";
import invoices from "@/data/invoices.json";
import quarterlyPnl from "@/data/quarterly_pnl.json";
import weeklyUpdate from "@/data/weekly_update.json";
import decisionLog from "@/data/decision_log.json";

export {
  titles,
  standup,
  vendors,
  beats,
  calendar,
  tickets,
  zoomTranscripts,
  slackMessages,
  gmailThreads,
  escalationDrafts,
  activityFeed,
  analyticsRollups,
  connections,
  invoices,
  quarterlyPnl,
  weeklyUpdate,
  decisionLog,
};

export const TITLE_SLUGS = titles.map((t) => t.franchise_slug);

export function getTitle(slug) {
  return titles.find((t) => t.franchise_slug === slug);
}

export function getTitleStandup(titleId) {
  return standup.by_title.find((b) => b.title_id === titleId);
}

export function getBeatsForTitle(titleId) {
  return beats.filter((b) => b.title_id === titleId);
}

export function getBeat(beatId) {
  return beats.find((b) => b.beat_id === beatId);
}

export function getCalendarForTitle(titleId) {
  return calendar.filter((t) => t.title_id === titleId);
}

export function getTicketsForTitle(titleId) {
  return tickets.filter((t) => t.title_id === titleId);
}

export function getTicket(ticketId) {
  return tickets.find((t) => t.ticket_id === ticketId);
}

// Jira deep-link for a ticket id.
export function jiraUrl(ticketId) {
  return `https://2kgames.atlassian.net/browse/${ticketId}`;
}

const DONE_STATUSES = new Set(["completed", "done", "closed"]);
export function isTicketDone(t) {
  return !!t && DONE_STATUSES.has(t.status);
}

// Resolve a ticket's "blocked by" edges into full ticket objects.
export function getTicketBlockers(ticket) {
  if (!ticket || !ticket.is_blocked_by) return [];
  return ticket.is_blocked_by
    .map((id) => getTicket(id))
    .filter(Boolean);
}

// Reverse edges: tickets that this ticket blocks (i.e. list it in is_blocked_by).
export function getTicketsBlockedBy(ticketId) {
  return tickets.filter(
    (t) => (t.is_blocked_by || []).includes(ticketId)
  );
}

// A ticket is "actively blocked" if any of its blockers is not yet done.
export function getActiveBlockers(ticket) {
  return getTicketBlockers(ticket).filter((b) => !isTicketDone(b));
}

// -------------------------------------------------------------------
// getBeatReadiness
//
// Release-readiness rollup for a beat — the "can we ship this beat on
// time?" view. Joins the beat's GO/NO-GO gate (if any) with the tickets
// and invoices that share its beat_id. All deterministic; computed at
// render time from the static JSON.
// -------------------------------------------------------------------
export function getBeatReadiness(beatId) {
  const beat = getBeat(beatId);
  if (!beat) return null;

  const beatTickets = tickets.filter((t) => t.beat_id === beatId);
  const done = beatTickets.filter(isTicketDone);
  const p0 = beatTickets.filter((t) => t.priority === "P0");
  const p0Done = p0.filter(isTicketDone);
  const blockers = beatTickets.filter(
    (t) => !isTicketDone(t) && (t.status === "at_risk" || t.status === "blocked")
  );

  const beatInvoices = invoices.filter((i) => i.beat_id === beatId);
  const openInvoices = beatInvoices.filter((i) => i.status !== "paid");
  const pastDueInvoices = openInvoices.filter((i) => i.status === "past_due");

  const readinessPct = beatTickets.length
    ? Math.round((done.length / beatTickets.length) * 100)
    : null;

  return {
    beat,
    gate: beat.go_no_go || null,
    totalTickets: beatTickets.length,
    doneTickets: done.length,
    p0Total: p0.length,
    p0Done: p0Done.length,
    blockers,
    openInvoices,
    pastDueInvoices,
    readinessPct,
    tickets: beatTickets,
  };
}

export function getTranscriptsForTitle(titleId) {
  return zoomTranscripts.filter((t) => t.title_id === titleId);
}

export function getSlackForTitle(titleId) {
  return slackMessages.filter((m) => m.linked_title_id === titleId);
}

export function getGmailForTitle(titleId) {
  return gmailThreads.filter((t) => t.title_id === titleId);
}

export function getDraftsForTitle(titleId) {
  const titleTicketIds = new Set(
    tickets.filter((t) => t.title_id === titleId).map((t) => t.ticket_id)
  );
  return escalationDrafts.filter((d) =>
    titleTicketIds.has(d.related_ticket_id)
  );
}

export function getVendorsForTitle(titleId) {
  return vendors.filter((v) => v.assigned_titles.includes(titleId));
}

export function getInvoicesForTitle(titleId) {
  return invoices.filter((i) => i.title_id === titleId);
}

// Returns past-due invoices and invoices due within the next 7 days,
// sorted past-due first then by due_date ascending.
export function getUrgentInvoices(iso = DEMO_TODAY_ISO) {
  const today = new Date(iso + "T00:00:00Z");
  const horizon = new Date(today);
  horizon.setUTCDate(today.getUTCDate() + 7);
  const horizonISO = horizon.toISOString().slice(0, 10);

  return invoices
    .filter((i) => {
      if (i.status === "paid") return false;
      if (i.status === "past_due") return true;
      if (i.status === "due" && i.due_date <= horizonISO) return true;
      if (i.status === "scheduled" && i.due_date <= horizonISO) return true;
      return false;
    })
    .sort((a, b) => {
      // past_due sorts before due/scheduled
      const rank = (s) => (s === "past_due" ? 0 : 1);
      const r = rank(a.status) - rank(b.status);
      if (r !== 0) return r;
      return a.due_date.localeCompare(b.due_date);
    });
}

export function fmtMoney(n) {
  if (n == null) return "n/a";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function fmtDate(iso, opts = {}) {
  if (!iso) return "n/a";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: opts.year ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export function fmtDateTime(iso) {
  if (!iso) return "n/a";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

// Demo time anchor. Hardcoded so the dashboard reads consistently across all
// renders and the date math in the standup view stays stable.
export const DEMO_TODAY_ISO = "2026-05-26";

// -------------------------------------------------------------------
// buildDeltaItems
//
// Returns a prioritised list of production signals for the homepage
// "Needs attention" strip. Computed from live data fields so it
// stays in sync with whatever is in the JSON.
//
// Categories surfaced:
//   - Beats stuck at Asset Lock > 2 days (phase transition slips)
//   - Pending decisions due today or overdue
//   - Beats in at_risk / delayed status not already caught above
// -------------------------------------------------------------------
export function buildDeltaItems() {
  const items = [];
  const DEMO = new Date(DEMO_TODAY_ISO + "T00:00:00Z");

  // 1. Asset Lock stalls — the most expensive slip class
  for (const beat of beats) {
    if (beat.lifecycle_stage === "Asset Lock" && beat.lifecycle_stage_entered_at) {
      const entered = new Date(beat.lifecycle_stage_entered_at + "T00:00:00Z");
      const daysStuck = Math.floor((DEMO - entered) / 86400000);
      if (daysStuck >= 2) {
        const t = titles.find((ti) => ti.title_id === beat.title_id);
        items.push({
          id: `assetlock:${beat.beat_id}`,
          type: "risk",
          priority: "P0",
          headline: `${beat.beat_name} stuck at Asset Lock`,
          detail: `${t ? t.title_name : beat.title_id} · ${daysStuck}d — needs unblocking`,
          title_id: beat.title_id,
        });
      }
    }
  }

  // 2. Decisions due today or overdue
  for (const d of (standup.pending_decisions || [])) {
    if (d.decision_date <= DEMO_TODAY_ISO) {
      const t = titles.find((ti) => ti.title_id === d.title_id);
      items.push({
        id: `decision:${d.decision_id}`,
        type: "decision",
        priority: "P0",
        headline: d.decision,
        detail: `${t ? t.title_name : ""} · ${fmtDate(d.decision_date)} · ${d.decision_owner}`,
        title_id: d.title_id,
      });
    }
  }

  // 3. At-risk / delayed beats not already caught as Asset Lock stalls
  const alreadySurfaced = new Set(items.map((i) => i.id.replace("assetlock:", "")));
  for (const beat of beats) {
    if (
      (beat.status === "at_risk" || beat.status === "delayed") &&
      beat.lifecycle_stage !== "Asset Lock" &&
      !alreadySurfaced.has(beat.beat_id)
    ) {
      const t = titles.find((ti) => ti.title_id === beat.title_id);
      items.push({
        id: `beat:${beat.beat_id}`,
        type: beat.status === "delayed" ? "risk" : "watch",
        priority: beat.status === "delayed" ? "P0" : "P1",
        headline: beat.beat_name,
        detail: `${t ? t.title_name : ""} · ${beat.status.replace(/_/g, " ")}`,
        title_id: beat.title_id,
      });
    }
  }

  // Attach a deep-link to the originating signal so each row is
  // click-through, not just a label. Decisions trace via their linked
  // ticket's source. Asset-Lock stalls and at-risk/delayed beats are
  // PRODUCTION blockers — they trace to the title's most operationally
  // relevant signal (production/execution/ops first, never a KPI stat).
  for (const it of items) {
    if (it.id.startsWith("decision:")) {
      const decId = it.id.slice("decision:".length);
      const dec = (standup.pending_decisions || []).find(
        (d) => d.decision_id === decId
      );
      it.href =
        (dec && dec.linked_ticket_id && inboxHrefForTicket(dec.linked_ticket_id)) ||
        productionInboxHrefForTitle(it.title_id);
    } else {
      it.href = productionInboxHrefForTitle(it.title_id);
    }
  }

  // Sort P0 before P1
  items.sort((a, b) => a.priority.localeCompare(b.priority));

  return items.slice(0, 7);
}

function toUTC(iso) {
  return new Date(iso + "T00:00:00Z");
}

function shiftDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoOf(date) {
  return date.toISOString().slice(0, 10);
}

// Returns the most recent prior business day before `iso` (skips Sat/Sun).
export function previousBusinessDayISO(iso = DEMO_TODAY_ISO) {
  let d = shiftDays(toUTC(iso), -1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d = shiftDays(d, -1);
  }
  return isoOf(d);
}

// Returns ISO date strings for the next N business days starting today.
export function nextBusinessDaysISO(n = 5, iso = DEMO_TODAY_ISO) {
  const out = [];
  let d = toUTC(iso);
  while (out.length < n) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
      out.push(isoOf(d));
    }
    d = shiftDays(d, 1);
  }
  return out;
}

export const DEMO_YESTERDAY_ISO = previousBusinessDayISO(DEMO_TODAY_ISO);
export const DEMO_THIS_WEEK_ISOS = nextBusinessDaysISO(5, DEMO_TODAY_ISO);

// -------------------------------------------------------------------
// Inbox normalization
//
// Pivots the inbox away from channel-tab navigation toward a unified
// stream that can be grouped by title and sorted by derived priority.
// Lives here so DailyBrief and AIInbox derive the same priority calls
// — drafts are always P0, flagged gmail/slack are P0, transcripts with
// any extracted P0 are P0 (else P1), and activity is always P2.
// -------------------------------------------------------------------

export const INBOX_PRIORITY_RANK = { P0: 0, P1: 1, P2: 2 };

function _ticketTitleId(ticketId) {
  if (!ticketId) return null;
  const tk = tickets.find((t) => t.ticket_id === ticketId);
  return tk?.title_id || null;
}

function _ticketPriority(ticketId) {
  if (!ticketId) return null;
  const tk = tickets.find((t) => t.ticket_id === ticketId);
  return tk?.priority || null;
}

export function buildInboxItems() {
  const items = [];

  for (const d of escalationDrafts) {
    const linkedPriority = _ticketPriority(d.related_ticket_id);
    items.push({
      id: `draft:${d.draft_id}`,
      type: "draft",
      titleId: _ticketTitleId(d.related_ticket_id),
      priority: "P0",
      opCategory: d.op_category || null,
      headline: d.subject || `${d.channel} draft to ${d.recipient}`,
      subline: `${d.channel} · ${d.recipient}${
        d.related_ticket_id ? ` · ${d.related_ticket_id}` : ""
      }${linkedPriority ? ` (${linkedPriority})` : ""}`,
      body: d.body,
      timestamp: null,
      raw: d,
    });
  }

  for (const g of gmailThreads) {
    let priority = "P2";
    if (g.flagged_for_action) priority = "P0";
    else if (g.claude_recommended_reply) priority = "P1";
    items.push({
      id: `gmail:${g.thread_id}`,
      type: "gmail",
      titleId: g.title_id || null,
      priority,
      opCategory: g.op_category || null,
      headline: g.subject,
      subline: `${g.from} · ${fmtDateTime(g.timestamp)}`,
      body: g.thread_summary,
      reply: g.claude_recommended_reply || null,
      timestamp: g.timestamp,
      raw: g,
    });
  }

  for (const m of slackMessages) {
    items.push({
      id: `slack:${m.message_id}`,
      type: "slack",
      titleId: m.linked_title_id || null,
      priority: m.flagged_for_action ? "P0" : "P2",
      opCategory: m.op_category || null,
      headline: m.text,
      subline: `${m.author} · ${m.channel} · ${fmtDateTime(m.timestamp)}`,
      body: null,
      timestamp: m.timestamp,
      raw: m,
    });
  }

  for (const tr of zoomTranscripts) {
    const hasP0 = (tr.extracted_tickets || []).some(
      (pt) => pt.priority === "P0"
    );
    items.push({
      id: `transcript:${tr.transcript_id}`,
      type: "transcript",
      titleId: tr.title_id || null,
      priority: hasP0 ? "P0" : "P1",
      headline: tr.meeting_title,
      subline: `${fmtDate(tr.meeting_date, { year: true })} · ${
        tr.duration_minutes
      } min · ${tr.extracted_tickets.length} extracted tickets`,
      body: null,
      timestamp: tr.meeting_date,
      raw: tr,
    });
  }

  for (const e of activityFeed) {
    items.push({
      id: `activity:${e.event_id}`,
      type: "activity",
      titleId: e.title_id || null,
      priority: "P2",
      headline: e.summary,
      subline: `${e.actor} · ${e.source} · ${fmtDateTime(
        e.timestamp
      )} · ${e.event_type.replace(/_/g, " ")}`,
      body: null,
      timestamp: e.timestamp,
      raw: e,
    });
  }

  return items;
}

// -------------------------------------------------------------------
// Source tracing — connect a standup signal / ticket back to the raw
// inbox item it came from, so the UI can deep-link instead of making
// the user hunt. A ticket's `source` (e.g. "slack:slack_003") maps
// directly to the AI Inbox item id; only the prefix differs for Zoom.
// -------------------------------------------------------------------
const SOURCE_KIND_TO_INBOX = {
  slack: "slack",
  gmail: "gmail",
  zoom: "transcript",
  claude_draft: "draft",
};

// "slack:slack_003" -> "slack:slack_003"; "zoom:foo" -> "transcript:foo".
// Returns null for loose sources without a resolvable signal (internal,
// alex_self_assigned, from_heaven_email, etc.).
export function inboxRefForSource(source) {
  if (!source || !source.includes(":")) return null;
  const idx = source.indexOf(":");
  const kind = source.slice(0, idx);
  const rest = source.slice(idx + 1);
  const type = SOURCE_KIND_TO_INBOX[kind];
  if (!type || !rest) return null;
  return `${type}:${rest}`;
}

// Best raw signal for a title — prefers a flagged Slack/Gmail message,
// then a transcript, then any Slack. Used when a beat-level signal has
// no single originating ticket.
export function topSignalRefForTitle(titleId) {
  if (!titleId) return null;
  const fs = slackMessages.find(
    (m) => m.linked_title_id === titleId && m.flagged_for_action
  );
  if (fs) return `slack:${fs.message_id}`;
  const fg = gmailThreads.find(
    (t) => t.title_id === titleId && t.flagged_for_action
  );
  if (fg) return `gmail:${fg.thread_id}`;
  const z = zoomTranscripts.find((t) => t.title_id === titleId);
  if (z) return `transcript:${z.transcript_id}`;
  const s = slackMessages.find((m) => m.linked_title_id === titleId);
  if (s) return `slack:${s.message_id}`;
  return null;
}

// When a PRODUCTION / OPS item (an Asset-Lock stall, an at-risk beat,
// "needs unblocking") needs a source signal, a raw KPI stat is the wrong
// landing — it makes a delivery blocker look like a metrics conversation.
// This ranks a title's signals by operational relevance — production /
// execution / ops first, KPIs dead last — so the trace lands on the thing
// actually blocking delivery. Aligned to the tool's purpose: keep
// campaigns ON TRACK, not report numbers.
const SIGNAL_CATEGORY_RANK = {
  production: 0,
  execution: 1,
  ops: 2,
  comms: 3,
  creative: 4,
  schedule: 5,
  budget: 6,
  // uncategorized falls here (7) via the helper
  kpi: 9,
};
function _signalCatRank(cat) {
  return cat != null && cat in SIGNAL_CATEGORY_RANK
    ? SIGNAL_CATEGORY_RANK[cat]
    : 7;
}

export function productionSignalRefForTitle(titleId) {
  if (!titleId) return null;
  const cands = [];
  for (const m of slackMessages) {
    if (m.linked_title_id === titleId) {
      cands.push({
        ref: `slack:${m.message_id}`,
        cat: m.op_category,
        flagged: !!m.flagged_for_action,
        ts: m.timestamp || "",
      });
    }
  }
  for (const g of gmailThreads) {
    if (g.title_id === titleId) {
      cands.push({
        ref: `gmail:${g.thread_id}`,
        cat: g.op_category,
        flagged: !!g.flagged_for_action,
        ts: g.timestamp || "",
      });
    }
  }
  if (cands.length === 0) {
    const z = zoomTranscripts.find((t) => t.title_id === titleId);
    return z ? `transcript:${z.transcript_id}` : null;
  }
  cands.sort((a, b) => {
    const ca = _signalCatRank(a.cat);
    const cb = _signalCatRank(b.cat);
    if (ca !== cb) return ca - cb; // operational relevance first
    if (a.flagged !== b.flagged) return a.flagged ? -1 : 1; // flagged next
    return b.ts.localeCompare(a.ts); // newest last
  });
  return cands[0].ref;
}

export function productionInboxHrefForTitle(titleId) {
  if (!titleId) return "/inbox";
  const ref = productionSignalRefForTitle(titleId);
  if (ref) return `/inbox?focus=${encodeURIComponent(ref)}&title=${titleId}`;
  return `/inbox?title=${titleId}`;
}

// Deep-link to the AI Inbox, focused on the best available signal.
export function inboxHrefForTitle(titleId) {
  if (!titleId) return "/inbox";
  const ref = topSignalRefForTitle(titleId);
  if (ref) return `/inbox?focus=${encodeURIComponent(ref)}&title=${titleId}`;
  return `/inbox?title=${titleId}`;
}

export function inboxHrefForSource(source, titleId) {
  const ref = inboxRefForSource(source);
  if (ref) {
    const titlePart = titleId ? `&title=${titleId}` : "";
    return `/inbox?focus=${encodeURIComponent(ref)}${titlePart}`;
  }
  return inboxHrefForTitle(titleId);
}

export function inboxHrefForTicket(ticketId) {
  const t = getTicket(ticketId);
  if (!t) return null;
  return inboxHrefForSource(t.source, t.title_id);
}

// Deep-link to the Decision Log, focused (and flashed) on one decision.
export function decisionHref(decisionId) {
  if (!decisionId) return "/decisions";
  return `/decisions?focus=${encodeURIComponent(decisionId)}`;
}

// -------------------------------------------------------------------
// Connected context for a single ticket — the full surround of every
// artifact that touches this piece of work: the meetings that produced
// it, the Slack threads and Gmail chains discussing it, the decisions
// that govern it, and its sibling tickets on the same beat. Computed
// at build time off the relational keys already in the JSON; the drawer
// renders it so one task is a hub, not a dead end.
// -------------------------------------------------------------------
export function buildTicketContext(ticketId) {
  const t = getTicket(ticketId);
  if (!t) return null;
  const titleId = t.title_id;

  // Meetings (Zoom) — ones that produced this ticket first, then same-title.
  const meetings = [];
  for (const tr of zoomTranscripts) {
    const produced = (tr.extracted_tickets || []).some(
      (et) => et.proposed_ticket_id === ticketId
    );
    const sameTitle = tr.title_id === titleId;
    if (!produced && !sameTitle) continue;
    meetings.push({
      id: tr.transcript_id,
      label: tr.meeting_title,
      sub: `${fmtDate(tr.meeting_date, { year: true })} · ${
        tr.duration_minutes
      } min`,
      flag: produced ? "produced this ticket" : null,
      href: `/inbox?focus=${encodeURIComponent(
        `transcript:${tr.transcript_id}`
      )}`,
    });
  }
  meetings.sort((a, b) => (b.flag ? 1 : 0) - (a.flag ? 1 : 0));

  // Slack — linked directly to this ticket first, then flagged same-title.
  const slack = [];
  for (const m of slackMessages) {
    const direct = m.linked_ticket_id === ticketId;
    const sameTitle = m.linked_title_id === titleId && m.flagged_for_action;
    if (!direct && !sameTitle) continue;
    slack.push({
      id: m.message_id,
      label: m.text,
      sub: `${m.author} · ${m.channel}`,
      flag: direct ? "linked to this ticket" : null,
      href: `/inbox?focus=${encodeURIComponent(`slack:${m.message_id}`)}`,
    });
  }
  slack.sort((a, b) => (b.flag ? 1 : 0) - (a.flag ? 1 : 0));

  // Gmail — same title; flagged / action threads float to the top.
  const gmail = [];
  for (const g of gmailThreads) {
    if (g.title_id !== titleId) continue;
    gmail.push({
      id: g.thread_id,
      label: g.subject,
      sub: g.from,
      flag: g.flagged_for_action ? "needs action" : null,
      href: `/inbox?focus=${encodeURIComponent(`gmail:${g.thread_id}`)}`,
    });
  }
  gmail.sort((a, b) => (b.flag ? 1 : 0) - (a.flag ? 1 : 0));

  // Decisions — pending (from standup) first, then closed log entries.
  const decisions = [];
  for (const d of standup.pending_decisions || []) {
    const direct = d.linked_ticket_id === ticketId;
    if (!direct && d.title_id !== titleId) continue;
    decisions.push({
      id: d.decision_id,
      label: d.decision,
      sub: `${d.decision_owner} · pending`,
      outcome: "pending",
      flag: direct ? "governs this ticket" : null,
      href: decisionHref(d.decision_id),
    });
  }
  for (const d of decisionLog) {
    const direct = d.linked_ticket_id === ticketId;
    if (!direct && d.title_id !== titleId) continue;
    decisions.push({
      id: d.decision_id,
      label: d.decision,
      sub: `${d.decided_by} · ${d.decision_outcome.replace(/_/g, "-")}`,
      outcome: d.decision_outcome,
      flag: direct ? "governs this ticket" : null,
      href: decisionHref(d.decision_id),
    });
  }
  decisions.sort((a, b) => (b.flag ? 1 : 0) - (a.flag ? 1 : 0));

  // Sibling tickets on the same beat (release).
  const relatedTickets = t.beat_id
    ? tickets.filter((x) => x.beat_id === t.beat_id && x.ticket_id !== ticketId)
    : [];

  return { meetings, slack, gmail, decisions, relatedTickets };
}

// -------------------------------------------------------------------
// Components taxonomy (#7)
//
// Every ticket carries a `component` — the execution discipline that
// owns delivery (mirrors a Jira "Components" field). This is baked into
// the JSON at build time, not inferred at runtime. The taxonomy below
// drives the colour-coded chips and the portfolio/per-title filters.
// -------------------------------------------------------------------
export const TICKET_COMPONENTS = [
  { id: "paid", label: "Paid Media", tone: "primary" },
  { id: "creator", label: "Creator", tone: "violet" },
  { id: "community", label: "Community", tone: "success" },
  { id: "comms", label: "Comms / PR", tone: "amber" },
  { id: "creative", label: "Creative", tone: "red" },
  { id: "seo", label: "SEO / Organic", tone: "neutral" },
  { id: "analytics", label: "Analytics", tone: "primary" },
  { id: "ops", label: "Ops / Legal", tone: "neutral" },
];

export const COMPONENT_LABEL = Object.fromEntries(
  TICKET_COMPONENTS.map((c) => [c.id, c.label])
);
export const COMPONENT_TONE = Object.fromEntries(
  TICKET_COMPONENTS.map((c) => [c.id, c.tone])
);

export function getTitleById(titleId) {
  return titles.find((t) => t.title_id === titleId) || null;
}

// -------------------------------------------------------------------
// Sprint / cadence week (#6)
//
// The "this week" window is the calendar week (Mon–Sun) containing the
// demo's today. Computed once and reused by the saved filters and the
// standup cadence panel so everything agrees on the same week.
// -------------------------------------------------------------------
function _weekRange(iso = DEMO_TODAY_ISO) {
  const today = toUTC(iso);
  const dow = today.getUTCDay(); // 0 Sun .. 6 Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = shiftDays(today, mondayOffset);
  const weekEnd = shiftDays(weekStart, 6);
  return { startISO: isoOf(weekStart), endISO: isoOf(weekEnd) };
}

export const SPRINT_WEEK = _weekRange(DEMO_TODAY_ISO);

function _inSprintWeek(d) {
  return !!d && d >= SPRINT_WEEK.startISO && d <= SPRINT_WEEK.endISO;
}

// Release-cadence rollup for the standup. Buckets every ticket into
// done-this-week / due-this-week / carried-over (overdue) and counts
// the actively-blocked subset. All derived from due_date + status.
export function buildSprintCadence() {
  const doneThisWeek = [];
  const dueThisWeek = [];
  const carryover = [];
  let blockedCount = 0;

  for (const t of tickets) {
    if (isTicketDone(t)) {
      if (_inSprintWeek(t.closed_date)) doneThisWeek.push(t);
      continue;
    }
    const isBlocked = t.status === "blocked" || getActiveBlockers(t).length > 0;
    if (isBlocked) blockedCount += 1;

    if (t.due_date && t.due_date < SPRINT_WEEK.startISO) {
      carryover.push(t);
    } else if (_inSprintWeek(t.due_date)) {
      dueThisWeek.push(t);
    }
  }

  const committed = doneThisWeek.length + dueThisWeek.length + carryover.length;
  const completionPct = committed
    ? Math.round((doneThisWeek.length / committed) * 100)
    : null;

  return {
    startISO: SPRINT_WEEK.startISO,
    endISO: SPRINT_WEEK.endISO,
    doneThisWeek,
    dueThisWeek,
    carryover,
    blockedCount,
    committed,
    completionPct,
  };
}

// -------------------------------------------------------------------
// Saved filters (#4)
//
// JQL-style one-click filters that answer concrete execution
// questions. Each is a pure predicate over a ticket — evaluated in the
// browser against the static JSON, no query engine required.
// -------------------------------------------------------------------
export const SAVED_FILTERS = [
  { id: "all", label: "All", hint: "Every ticket, all statuses", match: () => true },
  { id: "open", label: "Open work", hint: "Everything not yet done", match: (t) => !isTicketDone(t) },
  { id: "p0_active", label: "P0 active", hint: "Priority-0, still open", match: (t) => t.priority === "P0" && !isTicketDone(t) },
  {
    id: "at_risk",
    label: "At risk / blocked",
    hint: "Off-track or waiting on a blocker",
    match: (t) =>
      !isTicketDone(t) &&
      (t.status === "at_risk" || t.status === "blocked" || getActiveBlockers(t).length > 0),
  },
  {
    id: "vendor_week",
    label: "Vendor-owned due this week",
    hint: "Agency/vendor deliverables landing this week",
    match: (t) => !!t.vendor_owner && !isTicketDone(t) && _inSprintWeek(t.due_date),
  },
  { id: "due_week", label: "Due this week", hint: "Open and due in the current week", match: (t) => !isTicketDone(t) && _inSprintWeek(t.due_date) },
  { id: "overdue", label: "Overdue", hint: "Past due and still open", match: (t) => !isTicketDone(t) && !!t.due_date && t.due_date < SPRINT_WEEK.startISO },
  {
    id: "ready",
    label: "Ready to start",
    hint: "Open with no active blockers",
    match: (t) => t.status === "open" && getActiveBlockers(t).length === 0,
  },
  { id: "mine", label: "Owned by Alex", hint: "Alex Akiyama is the owner", match: (t) => t.owner === "Alex Akiyama" && !isTicketDone(t) },
];

export const SAVED_FILTER_MAP = Object.fromEntries(
  SAVED_FILTERS.map((f) => [f.id, f])
);
