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

export function getCalendarForTitle(titleId) {
  return calendar.filter((t) => t.title_id === titleId);
}

export function getTicketsForTitle(titleId) {
  return tickets.filter((t) => t.title_id === titleId);
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
