"use client";

import { useState } from "react";
import {
  zoomTranscripts,
  slackMessages,
  gmailThreads,
  escalationDrafts,
  activityFeed,
  titles,
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
  ChevronRight,
} from "lucide-react";

const TABS = [
  { key: "drafts", label: "Drafts", icon: Send },
  { key: "transcripts", label: "Zoom transcripts", icon: Video },
  { key: "slack", label: "Slack", icon: MessageSquare },
  { key: "gmail", label: "Gmail", icon: Mail },
  { key: "activity", label: "Activity", icon: Sparkles },
];

function titleColor(titleId) {
  const t = titles.find((x) => x.title_id === titleId);
  return t?.brand_color || "#94A3B8";
}

function titleName(titleId) {
  if (!titleId) return "Portfolio";
  const t = titles.find((x) => x.title_id === titleId);
  return t?.title_name || titleId;
}

export default function AIInbox() {
  const [tab, setTab] = useState("drafts");
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [openTranscript, setOpenTranscript] = useState(null);
  const activeDraft = escalationDrafts.find(
    (d) => d.draft_id === activeDraftId
  );

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
          <Inbox className="h-3 w-3" /> AI Inbox
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          Everything Claude has surfaced this week.
        </h1>
        <p className="text-[13px] text-ink-500 mt-1">
          Drafts to review · transcripts to file · channels to monitor ·
          extracted tickets ready to ship.
        </p>
      </div>

      <div className="border-b border-line overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-[13px] font-medium border-b-2 -mb-px flex items-center gap-1.5 ${
                  tab === t.key
                    ? "border-accent-primary text-accent-primary"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "drafts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {escalationDrafts.map((d) => (
            <button
              key={d.draft_id}
              type="button"
              onClick={() => setActiveDraftId(d.draft_id)}
              className="text-left panel p-4 hover:border-accent-primary hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-ink-500 uppercase tracking-wider font-semibold mb-1">
                <span>
                  {d.channel} · {d.recipient}
                </span>
                <Badge tone="violet" size="xs">
                  Draft
                </Badge>
              </div>
              {d.subject && (
                <div className="text-[13px] font-semibold mb-1">
                  {d.subject}
                </div>
              )}
              <p className="text-[12.5px] text-ink-700 line-clamp-4 leading-relaxed">
                {d.body}
              </p>
              <div className="mt-2 flex items-center text-[11px] text-accent-primary font-medium">
                Open <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "transcripts" && (
        <div className="space-y-2">
          {zoomTranscripts.map((tr) => {
            const isOpen = openTranscript === tr.transcript_id;
            return (
              <div
                key={tr.transcript_id}
                className="panel overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenTranscript(isOpen ? null : tr.transcript_id)
                  }
                  className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-base/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: titleColor(tr.title_id) }}
                    />
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold truncate">
                        {tr.meeting_title}
                      </div>
                      <div className="text-[11.5px] text-ink-500">
                        {fmtDate(tr.meeting_date, { year: true })} ·{" "}
                        {tr.duration_minutes} min ·{" "}
                        {tr.extracted_tickets.length} tickets ·{" "}
                        {tr.exchanges.length} exchanges
                        {tr.featured && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-accent-violet/10 text-accent-violet text-[10px] font-semibold uppercase tracking-wider">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-ink-400 shrink-0 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-line p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
                        Transcript
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
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
                              <Badge status={pt.priority} size="xs">
                                {pt.priority}
                              </Badge>
                            </div>
                            <div className="font-medium mt-0.5">
                              {pt.title}
                            </div>
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "slack" && (
        <ul className="space-y-2">
          {slackMessages.map((m) => (
            <li key={m.message_id} className="panel p-4">
              <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1">
                <span className="font-semibold text-ink-700">{m.author}</span>
                <span className="mono">{fmtDateTime(m.timestamp)}</span>
              </div>
              <div className="text-[10.5px] text-ink-500 mb-1.5">
                {m.channel} · {m.author_role}
              </div>
              <p className="text-[13px] leading-relaxed">{m.text}</p>
              {m.flagged_for_action && (
                <div className="mt-2">
                  <Badge tone="amber" size="xs">
                    Flagged for action
                  </Badge>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "gmail" && (
        <ul className="space-y-2">
          {gmailThreads.map((g) => (
            <li key={g.thread_id} className="panel p-4">
              <div className="flex items-center justify-between text-[11px] text-ink-500 mb-1">
                <span className="font-semibold text-ink-700">{g.from}</span>
                <span className="mono">{fmtDateTime(g.timestamp)}</span>
              </div>
              <div className="text-[13.5px] font-semibold">{g.subject}</div>
              <p className="text-[12.5px] text-ink-700 mt-1">
                {g.thread_summary}
              </p>
              {g.claude_recommended_reply && (
                <div className="mt-2 border-l-2 border-accent-violet pl-3 text-[12px] text-ink-900">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-violet mr-1">
                    Claude reply draft
                  </span>
                  {g.claude_recommended_reply}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "activity" && (
        <ul className="space-y-1.5">
          {activityFeed.map((e) => (
            <li
              key={e.event_id}
              className="panel px-4 py-2.5 flex items-start gap-3"
            >
              <div className="text-[11px] text-ink-500 mono w-32 shrink-0">
                {fmtDateTime(e.timestamp)}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 w-20 shrink-0">
                {e.source}
              </div>
              <div className="flex-1 text-[13px]">
                <div className="font-medium">{e.summary}</div>
                <div className="text-[11px] text-ink-500">
                  {e.actor} · {titleName(e.title_id)} ·{" "}
                  {e.event_type.replace(/_/g, " ")}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EscalationModal
        draft={activeDraft}
        onClose={() => setActiveDraftId(null)}
      />
    </div>
  );
}
