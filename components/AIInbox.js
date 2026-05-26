"use client";

import { useMemo, useState } from "react";
import {
  zoomTranscripts,
  slackMessages,
  gmailThreads,
  escalationDrafts,
  activityFeed,
  titles,
  tickets,
  fmtDate,
  fmtDateTime,
} from "@/lib/data";
import Badge from "./Badge";
import EscalationModal from "./EscalationModal";
import {
  Inbox,
  MessageSquare,
  Mail,
  Video,
  Send,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

// -------------------------------------------------------------------
// Inbox item normalization
//
// Pivots the inbox away from channel-tab navigation toward a unified
// stream that can be grouped by title and sorted by derived priority.
// Each source (draft / transcript / slack / gmail / activity) maps to
// a common shape so the UI can group, filter, and sort without caring
// about origin.
// -------------------------------------------------------------------

const TYPE_META = {
  draft:      { label: "Draft",      Icon: Send,          tone: "violet" },
  transcript: { label: "Transcript", Icon: Video,         tone: "neutral" },
  slack:      { label: "Slack",      Icon: MessageSquare, tone: "neutral" },
  gmail:      { label: "Gmail",      Icon: Mail,          tone: "neutral" },
  activity:   { label: "Activity",   Icon: Sparkles,      tone: "neutral" },
};

const PRIORITY_META = {
  P0: { label: "P0 · Today",    tone: "red",     rank: 0 },
  P1: { label: "P1 · This wk",  tone: "amber",   rank: 1 },
  P2: { label: "P2 · FYI",      tone: "neutral", rank: 2 },
};

const PORTFOLIO_PSEUDO_TITLE = {
  title_id: "__portfolio__",
  title_name: "Portfolio (cross-title)",
  brand_color: "#94A3B8",
};

function ticketTitleId(ticketId) {
  if (!ticketId) return null;
  const tk = tickets.find((t) => t.ticket_id === ticketId);
  return tk?.title_id || null;
}

function ticketPriority(ticketId) {
  if (!ticketId) return null;
  const tk = tickets.find((t) => t.ticket_id === ticketId);
  return tk?.priority || null;
}

function buildInboxItems() {
  const items = [];

  // Drafts — always P0 (Claude has surfaced an action awaiting Alex).
  // Priority can sharpen to mirror the linked ticket if it's P0.
  for (const d of escalationDrafts) {
    const linkedPriority = ticketPriority(d.related_ticket_id);
    items.push({
      id: `draft:${d.draft_id}`,
      type: "draft",
      titleId: ticketTitleId(d.related_ticket_id),
      priority: "P0", // every draft is an action awaiting send
      headline:
        d.subject ||
        `${d.channel} draft to ${d.recipient}`,
      subline: `${d.channel} · ${d.recipient}${
        d.related_ticket_id ? ` · ${d.related_ticket_id}` : ""
      }${linkedPriority ? ` (${linkedPriority})` : ""}`,
      body: d.body,
      timestamp: null,
      raw: d,
    });
  }

  // Gmail — flagged threads are P0; threads with a Claude-drafted
  // reply are P1 (action exists but hasn't been escalated to draft);
  // everything else is P2 informational.
  for (const g of gmailThreads) {
    let priority = "P2";
    if (g.flagged_for_action) priority = "P0";
    else if (g.claude_recommended_reply) priority = "P1";
    items.push({
      id: `gmail:${g.thread_id}`,
      type: "gmail",
      titleId: g.title_id || null,
      priority,
      headline: g.subject,
      subline: `${g.from} · ${fmtDateTime(g.timestamp)}`,
      body: g.thread_summary,
      reply: g.claude_recommended_reply || null,
      timestamp: g.timestamp,
      raw: g,
    });
  }

  // Slack — flagged messages are P0; everything else is P2 (vendor
  // updates, KPI signals, standup posts). The 5 demo messages skew
  // toward operational chatter, not action items.
  for (const m of slackMessages) {
    items.push({
      id: `slack:${m.message_id}`,
      type: "slack",
      titleId: m.linked_title_id || null,
      priority: m.flagged_for_action ? "P0" : "P2",
      headline: m.text,
      subline: `${m.author} · ${m.channel} · ${fmtDateTime(m.timestamp)}`,
      body: null,
      timestamp: m.timestamp,
      raw: m,
    });
  }

  // Transcripts — if any extracted ticket is P0, the transcript needs
  // attention today (file the ticket, route the action). Otherwise P1.
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

  // Activity feed — always P2 (read-only audit of what's been
  // happening). Kept in the unified stream so a single title view
  // shows full context, but filtered out by default to reduce noise.
  for (const e of activityFeed) {
    items.push({
      id: `activity:${e.event_id}`,
      type: "activity",
      titleId: e.title_id || null,
      priority: "P2",
      headline: e.summary,
      subline: `${e.actor} · ${e.source} · ${fmtDateTime(e.timestamp)} · ${e.event_type.replace(
        /_/g,
        " "
      )}`,
      body: null,
      timestamp: e.timestamp,
      raw: e,
    });
  }

  return items;
}

function groupByTitle(items) {
  // Build the title-section list in the canonical titles[] order so
  // colors stay predictable across renders. Anything without a title
  // collapses into a Portfolio bucket at the bottom.
  const buckets = new Map();
  for (const t of titles) buckets.set(t.title_id, []);
  buckets.set(PORTFOLIO_PSEUDO_TITLE.title_id, []);

  for (const it of items) {
    const key = it.titleId || PORTFOLIO_PSEUDO_TITLE.title_id;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(it);
  }

  const sections = [];
  for (const t of titles) {
    const list = buckets.get(t.title_id) || [];
    if (list.length === 0) continue;
    sections.push({
      title: t,
      items: list.sort(
        (a, b) =>
          PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank ||
          (b.timestamp || "").localeCompare(a.timestamp || "")
      ),
    });
  }
  const portfolioList = buckets.get(PORTFOLIO_PSEUDO_TITLE.title_id) || [];
  if (portfolioList.length > 0) {
    sections.push({
      title: PORTFOLIO_PSEUDO_TITLE,
      items: portfolioList.sort(
        (a, b) =>
          PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank ||
          (b.timestamp || "").localeCompare(a.timestamp || "")
      ),
    });
  }
  return sections;
}

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------

const TYPE_FILTERS = [
  { key: "all", label: "All types", Icon: Inbox },
  { key: "draft", label: "Drafts", Icon: Send },
  { key: "transcript", label: "Transcripts", Icon: Video },
  { key: "slack", label: "Slack", Icon: MessageSquare },
  { key: "gmail", label: "Gmail", Icon: Mail },
  { key: "activity", label: "Activity", Icon: Sparkles },
];

const PRIORITY_FILTERS = [
  { key: "all", label: "All" },
  { key: "P0", label: "P0 only" },
  { key: "P0+P1", label: "P0 + P1" },
];

export default function AIInbox() {
  const [titleFilter, setTitleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const activeDraft = escalationDrafts.find(
    (d) => d.draft_id === activeDraftId
  );

  const allItems = useMemo(() => buildInboxItems(), []);

  const filteredItems = useMemo(() => {
    return allItems.filter((it) => {
      if (titleFilter !== "all") {
        const key = it.titleId || PORTFOLIO_PSEUDO_TITLE.title_id;
        if (key !== titleFilter) return false;
      }
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (priorityFilter === "P0" && it.priority !== "P0") return false;
      if (priorityFilter === "P0+P1" && it.priority === "P2") return false;
      return true;
    });
  }, [allItems, titleFilter, typeFilter, priorityFilter]);

  const sections = useMemo(() => groupByTitle(filteredItems), [filteredItems]);

  // Quick counts for the header
  const p0Count = allItems.filter((i) => i.priority === "P0").length;
  const p1Count = allItems.filter((i) => i.priority === "P1").length;
  const p2Count = allItems.filter((i) => i.priority === "P2").length;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
          <Inbox className="h-3 w-3" /> AI Inbox
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          What each title needs from you, sorted by priority.
        </h1>
        <p className="text-[13px] text-ink-500 mt-1">
          Drafts, transcripts, flagged Slack &amp; Gmail, and activity —
          unified, grouped by title, sorted P0 → P1 → P2 within each.
        </p>
        <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-ink-700">
          <span className="flex items-center gap-1.5">
            <Badge tone="red" size="xs">P0</Badge> {p0Count} today
          </span>
          <span className="flex items-center gap-1.5">
            <Badge tone="amber" size="xs">P1</Badge> {p1Count} this week
          </span>
          <span className="flex items-center gap-1.5">
            <Badge tone="neutral" size="xs">P2</Badge> {p2Count} FYI
          </span>
        </div>
      </div>

      {/* Filter bar — title chips */}
      <div className="space-y-2 sticky top-0 z-10 bg-canvas/95 backdrop-blur-sm py-2 -my-2 border-b border-line">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold shrink-0 mr-1">
            Title
          </span>
          <FilterChip
            label="All"
            active={titleFilter === "all"}
            onClick={() => setTitleFilter("all")}
          />
          {titles.map((t) => (
            <FilterChip
              key={t.title_id}
              label={t.title_name}
              color={t.brand_color}
              active={titleFilter === t.title_id}
              onClick={() => setTitleFilter(t.title_id)}
            />
          ))}
          <FilterChip
            label="Portfolio"
            color={PORTFOLIO_PSEUDO_TITLE.brand_color}
            active={titleFilter === PORTFOLIO_PSEUDO_TITLE.title_id}
            onClick={() => setTitleFilter(PORTFOLIO_PSEUDO_TITLE.title_id)}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold shrink-0 mr-1">
            Type
          </span>
          {TYPE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              Icon={f.Icon}
              active={typeFilter === f.key}
              onClick={() => setTypeFilter(f.key)}
            />
          ))}
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold shrink-0 ml-3 mr-1">
            Priority
          </span>
          {PRIORITY_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={priorityFilter === f.key}
              onClick={() => setPriorityFilter(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="panel p-10 text-center text-[13px] text-ink-500">
          Nothing matches those filters. Try widening the title or type.
        </div>
      )}

      {/* Grouped feed */}
      <div className="space-y-6">
        {sections.map(({ title, items }) => (
          <section key={title.title_id}>
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <div className="flex items-baseline gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: title.brand_color }}
                />
                <h2
                  className="text-[15px] font-bold tracking-tight"
                  style={{ color: title.brand_color }}
                >
                  {title.title_name}
                </h2>
                <span className="text-[11px] mono text-ink-500">
                  {items.length}
                </span>
              </div>
              <div className="text-[11px] text-ink-500 flex items-center gap-2">
                {countByPriority(items)}
              </div>
            </div>
            <ul className="space-y-1.5">
              {items.map((it) => (
                <InboxRow
                  key={it.id}
                  item={it}
                  expanded={expandedId === it.id}
                  onToggle={() =>
                    setExpandedId(expandedId === it.id ? null : it.id)
                  }
                  onOpenDraft={(draftId) => setActiveDraftId(draftId)}
                  titleColor={title.brand_color}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <EscalationModal
        draft={activeDraft}
        onClose={() => setActiveDraftId(null)}
      />
    </div>
  );
}

// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------

function FilterChip({ label, Icon, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-medium transition-all ${
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-line bg-white text-ink-700 hover:border-ink-400"
      }`}
      style={
        active && color
          ? { backgroundColor: color, borderColor: color, color: "#fff" }
          : undefined
      }
    >
      {Icon && <Icon className="h-3 w-3" />}
      {color && !active && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}

function countByPriority(items) {
  const counts = { P0: 0, P1: 0, P2: 0 };
  for (const it of items) counts[it.priority]++;
  const parts = [];
  if (counts.P0) parts.push(<Badge key="p0" tone="red" size="xs">{counts.P0} P0</Badge>);
  if (counts.P1) parts.push(<Badge key="p1" tone="amber" size="xs">{counts.P1} P1</Badge>);
  if (counts.P2) parts.push(<Badge key="p2" tone="neutral" size="xs">{counts.P2} P2</Badge>);
  return <>{parts}</>;
}

function InboxRow({ item, expanded, onToggle, onOpenDraft, titleColor }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.Icon;
  const pri = PRIORITY_META[item.priority];

  // Drafts route to the existing escalation modal directly (no inline expand).
  if (item.type === "draft") {
    return (
      <li>
        <button
          type="button"
          onClick={() => onOpenDraft(item.raw.draft_id)}
          className="w-full text-left panel px-3.5 py-2.5 flex items-start gap-3 hover:border-accent-primary hover:shadow-sm transition-all"
        >
          <Icon className="h-3.5 w-3.5 text-accent-violet shrink-0 mt-0.5" />
          <Badge tone={pri.tone} size="xs">{pri.label}</Badge>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink-900 leading-snug">
              {item.headline}
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5">
              {item.subline}
            </div>
            <p className="text-[12px] text-ink-700 line-clamp-2 mt-1.5 leading-relaxed">
              {item.body}
            </p>
          </div>
          <span className="text-[11px] text-accent-primary font-medium shrink-0 flex items-center gap-0.5">
            Open <ArrowUpRight className="h-3 w-3" />
          </span>
        </button>
      </li>
    );
  }

  // Everything else expands in-place to reveal full body / transcript /
  // recommended reply, etc.
  return (
    <li>
      <div className="panel overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left px-3.5 py-2.5 flex items-start gap-3 hover:bg-base/40"
          aria-expanded={expanded}
        >
          <Icon className="h-3.5 w-3.5 text-ink-500 shrink-0 mt-0.5" />
          <Badge tone={pri.tone} size="xs">{pri.label}</Badge>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-ink-900 leading-snug font-medium line-clamp-2">
              {item.headline}
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5 truncate">
              {item.subline}
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold shrink-0">
            {meta.label}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-ink-400 shrink-0 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
        {expanded && (
          <ExpandedContent item={item} titleColor={titleColor} />
        )}
      </div>
    </li>
  );
}

function ExpandedContent({ item, titleColor }) {
  if (item.type === "transcript") {
    const tr = item.raw;
    return (
      <div className="border-t border-line p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
            Transcript
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {tr.exchanges.map((ex, i) => (
              <div key={i} className="text-[12.5px]">
                <span className="font-semibold text-accent-primary">
                  {ex.speaker}:
                </span>{" "}
                <span className="text-ink-700">{ex.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
            Claude-extracted tickets
          </div>
          <ul className="space-y-2">
            {tr.extracted_tickets.map((pt) => (
              <li
                key={pt.proposed_ticket_id}
                className="border border-line rounded p-2.5 text-[12.5px]"
              >
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-ink-500">
                    {pt.proposed_ticket_id}
                  </span>
                  <Badge
                    tone={
                      pt.priority === "P0"
                        ? "red"
                        : pt.priority === "P1"
                        ? "amber"
                        : "neutral"
                    }
                    size="xs"
                  >
                    {pt.priority}
                  </Badge>
                </div>
                <div className="font-medium mt-0.5">{pt.title}</div>
                <div className="text-[10.5px] text-ink-500 mt-0.5">
                  Owner: {pt.owner}
                  {pt.vendor_owner && ` · ${pt.vendor_owner}`}
                </div>
                <div className="text-[11px] text-ink-700 italic mt-1.5">
                  "{pt.source_quote}"
                </div>
                <div className="text-[11px] text-ink-900 mt-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 mr-1">
                    Rationale
                  </span>
                  {pt.rationale}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (item.type === "gmail") {
    const g = item.raw;
    return (
      <div className="border-t border-line p-4">
        <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1">
          Thread summary
        </div>
        <p className="text-[12.5px] text-ink-700 leading-relaxed">
          {g.thread_summary}
        </p>
        {g.claude_recommended_reply && (
          <div className="mt-3 border-l-2 border-accent-violet pl-3 text-[12px] text-ink-900">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-accent-violet mb-1">
              Claude reply draft
            </div>
            {g.claude_recommended_reply}
          </div>
        )}
        {g.flagged_for_action && (
          <div className="mt-3">
            <Badge tone="amber" size="xs">Flagged for action</Badge>
          </div>
        )}
      </div>
    );
  }

  if (item.type === "slack") {
    const m = item.raw;
    return (
      <div className="border-t border-line p-4">
        <p className="text-[13px] leading-relaxed">{m.text}</p>
        <div className="text-[11px] text-ink-500 mt-2 flex items-center gap-3 flex-wrap">
          <span>{m.author_role}</span>
          {m.thread_replies > 0 && <span>{m.thread_replies} replies</span>}
          {m.linked_ticket_id && (
            <span className="mono">{m.linked_ticket_id}</span>
          )}
          {m.flagged_for_action && (
            <Badge tone="amber" size="xs">Flagged for action</Badge>
          )}
        </div>
      </div>
    );
  }

  if (item.type === "activity") {
    const e = item.raw;
    return (
      <div className="border-t border-line p-4 text-[12px] text-ink-700 grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
            Source
          </div>
          <div className="mt-0.5">{e.source}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
            Type
          </div>
          <div className="mt-0.5">{e.event_type.replace(/_/g, " ")}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
            Actor
          </div>
          <div className="mt-0.5">{e.actor}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
            Timestamp
          </div>
          <div className="mt-0.5 mono">{fmtDateTime(e.timestamp)}</div>
        </div>
        {e.linked_id && (
          <div className="col-span-2">
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
              Linked
            </div>
            <div className="mt-0.5 mono text-[11px]">{e.linked_id}</div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
