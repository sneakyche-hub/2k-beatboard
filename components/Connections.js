"use client";

import { connections, fmtDateTime } from "@/lib/data";
import Badge from "./Badge";
import { Plug, CheckCircle2, RefreshCw } from "lucide-react";

const CATEGORY_LABEL = {
  comms: "Comms",
  platform: "Platform",
  analytics: "Analytics",
  ticketing: "Ticketing",
};

const CATEGORY_TONE = {
  comms: "primary",
  platform: "violet",
  analytics: "success",
  ticketing: "amber",
};

const STATUS_LABEL = {
  connected: "Connected",
  syncing: "Syncing",
  needs_attention: "Needs attention",
};

const STATUS_TONE = {
  connected: "success",
  syncing: "primary",
  needs_attention: "amber",
};

function groupBy(list, key) {
  return list.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export default function Connections() {
  const grouped = groupBy(connections, "category");
  const connectedCount = connections.filter(
    (c) => c.status === "connected"
  ).length;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1.5">
          <Plug className="h-3 w-3" /> Connections
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          What Claude is allowed to see — and what it does with it.
        </h1>
        <p className="text-[13px] text-ink-500 mt-1">
          Every signal in BeatBoard comes from one of these{" "}
          <span className="font-semibold text-ink-700">
            {connections.length} integrations
          </span>
          . {connectedCount} active · scopes scoped to read-mostly, with
          explicit write actions surfaced as drafts for sign-off.
        </p>
      </div>

      <div className="panel p-4 bg-gradient-to-br from-accent-primary/5 to-accent-violet/5 border-accent-primary/30">
        <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
          Why this page exists
        </div>
        <p className="text-[13px] leading-relaxed text-ink-900">
          BeatBoard never invents data. Every KPI, transcript snippet, draft,
          and ticket on this dashboard is rooted in a real connector listed
          below. If a source goes dark, the cards that depend on it surface
          the staleness in line — no silent fallback. This page is the
          single source of truth for{" "}
          <span className="font-semibold">what Claude can read</span> and{" "}
          <span className="font-semibold">what it can write back</span> on
          this Manager's behalf.
        </p>
      </div>

      {Object.keys(grouped).map((cat) => (
        <div key={cat} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="section-title text-[12px] uppercase tracking-wider text-ink-500 font-semibold">
              {CATEGORY_LABEL[cat] || cat}
            </h2>
            <Badge tone={CATEGORY_TONE[cat] || "neutral"} size="xs">
              {grouped[cat].length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped[cat].map((c) => (
              <div key={c.connection_id} className="panel p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-base/80 border border-line flex items-center justify-center text-[20px] shrink-0">
                      {c.icon_emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold truncate">
                        {c.name}
                      </div>
                      <div className="text-[11.5px] text-ink-500 truncate">
                        {c.connected_workspace}
                      </div>
                    </div>
                  </div>
                  <Badge
                    tone={STATUS_TONE[c.status] || "neutral"}
                    size="xs"
                  >
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                  </Badge>
                </div>

                <p className="text-[12.5px] leading-relaxed text-ink-700">
                  {c.scope_summary}
                </p>

                <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] text-ink-500">
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" />
                    Last synced{" "}
                    <span className="mono text-ink-700">
                      {fmtDateTime(c.last_synced)}
                    </span>
                  </span>
                  <span className="mono text-[10px] text-ink-400">
                    {c.connection_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="panel p-4 text-[12px] text-ink-700 leading-relaxed">
        <span className="font-semibold">Scope guardrails — </span>
        Claude operates at this Manager's level of authority only. It drafts,
        flags, and coordinates. It does <span className="italic">not</span>{" "}
        unilaterally authorize spend tranches, sign-off comms to external
        audiences, or close tickets without explicit Manager approval. All
        write actions surface as drafts in the AI Inbox first.
      </div>
    </div>
  );
}
