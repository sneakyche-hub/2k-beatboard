"use client";

import {
  Hash,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { buildSlackDigest, fmtDateTime } from "@/lib/data";
import JiraLink from "./JiraLink";

// Tone → dot color for the per-channel cards.
const TONE_DOT = {
  positive: "#16A34A",
  watch: "#D97706",
  risk: "#DC2626",
  neutral: "#94A3B8",
};

const TONE_LABEL = {
  positive: "Healthy",
  watch: "Watch",
  risk: "Risk",
  neutral: "Steady",
};

// Davide's #1 ask, rendered: one AI read across a title's several Slack
// channels so he can self-serve status without pinging the team. The
// narrative is Claude-authored (build time); the counts are derived live.
export default function TitleSlackDigest({ title, onOpenInbox }) {
  const digest = buildSlackDigest(title.title_id);
  if (!digest) return null;

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-twok-red" />
            Slack digest · Claude across {digest.channelCount} channel
            {digest.channelCount === 1 ? "" : "s"}
          </h3>
          <div className="text-[11px] text-ink-500 mt-0.5">
            {digest.messageCount} message
            {digest.messageCount === 1 ? "" : "s"} ·{" "}
            {digest.flaggedCount} flagged for action
            {digest.asOf ? ` · synthesized ${fmtDateTime(digest.asOf + "T00:00:00Z")}` : ""}
          </div>
        </div>
        {onOpenInbox && (
          <button
            type="button"
            onClick={onOpenInbox}
            className="text-[11.5px] font-medium text-accent-primary hover:underline inline-flex items-center gap-1 shrink-0"
          >
            Open raw threads <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {digest.headline && (
        <div className="text-[14px] font-semibold text-ink-900 leading-snug">
          {digest.headline}
        </div>
      )}
      {digest.synthesis && (
        <p className="text-[13px] text-ink-700 leading-relaxed">
          {digest.synthesis}
        </p>
      )}

      {digest.needsYou.length > 0 && (
        <div className="rounded-md bg-accent-amber/10 border border-accent-amber/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-accent-amber font-semibold flex items-center gap-1 mb-1.5">
            <Flag className="h-3 w-3" /> Needs you
          </div>
          <ul className="space-y-1.5">
            {digest.needsYou.map((n, i) => (
              <li
                key={i}
                className="text-[12.5px] text-ink-900 flex gap-2 leading-relaxed"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-accent-amber shrink-0 mt-0.5" />
                <span>
                  {n.text}
                  {n.ticket_id && (
                    <JiraLink
                      ticketId={n.ticket_id}
                      className="ml-1 text-accent-primary font-medium align-baseline"
                      fallbackClassName="ml-1 text-ink-500"
                    >
                      {n.ticket_id}
                    </JiraLink>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
          By channel
        </div>
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {digest.channels.map((c) => (
            <li
              key={c.channel}
              className="border border-line rounded-lg p-3 space-y-1.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: TONE_DOT[c.tone] || TONE_DOT.neutral }}
                  title={TONE_LABEL[c.tone] || c.tone}
                />
                <span className="text-[12.5px] font-semibold text-ink-900 inline-flex items-center gap-0.5">
                  <Hash className="h-3 w-3 text-ink-400" />
                  {c.channel.replace(/^#/, "")}
                </span>
                <span className="text-[10px] text-ink-500 ml-auto">
                  {c.messageCount} msg
                  {c.flaggedCount > 0 && (
                    <span className="text-accent-amber font-semibold">
                      {" "}
                      · {c.flaggedCount} flagged
                    </span>
                  )}
                </span>
              </div>
              {c.purpose && (
                <div className="text-[10.5px] uppercase tracking-wider text-ink-400 font-semibold">
                  {c.purpose}
                </div>
              )}
              {c.summary && (
                <p className="text-[12px] text-ink-700 leading-relaxed">
                  {c.summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
