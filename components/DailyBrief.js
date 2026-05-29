"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  standup,
  titles,
  fmtDate,
  buildInboxItems,
} from "@/lib/data";
import Badge from "./Badge";
import {
  Sparkles,
  AlertOctagon,
  Gauge,
  Send,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Copy,
  Printer,
  ArrowLeft,
  Check,
  Timer,
  Mail,
} from "lucide-react";

// -------------------------------------------------------------------
// DailyBrief
//
// Shareable one-page roll-up of the daily standup. Designed to be
// circulated to Davide / Marketing Mgr II / cross-functional partners
// without making them read the full standup. Priority is fixed:
// blockers → today's decisions → P0 inbox actions → today's calls →
// top risks → yesterday at a glance → active tracking lines.
//
// Two share affordances: "Copy as text" produces a clean markdown
// digest for Slack/email. "Print" uses print CSS to hide nav + format
// for a one-page PDF.
// -------------------------------------------------------------------

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

const SEVERITY_TONE = { high: "red", medium: "amber", low: "neutral" };

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

const DECISION_STATUS_LABEL = {
  awaiting_decision: "Awaiting",
  held: "Held",
  decide_today: "Decide today",
  cleared: "Cleared",
  on_track: "On track",
};

const DECISION_STATUS_TONE = {
  awaiting_decision: "amber",
  held: "red",
  decide_today: "amber",
  cleared: "success",
  on_track: "success",
};

const PREP_TONE = {
  ready: { label: "Prep ready", tone: "success" },
  outstanding: { label: "Prep outstanding", tone: "amber" },
  blocked: { label: "Prep blocked", tone: "red" },
};

export default function DailyBrief() {
  const [copied, setCopied] = useState(false);

  const brief = standup.standup_brief;
  const blockers = brief.blockers || [];
  const decisions = (standup.pending_decisions || []).filter(
    (d) =>
      d.status === "awaiting_decision" ||
      d.status === "decide_today" ||
      d.status === "held"
  );
  const calls = brief.today_calls || [];
  const followups = brief.today_followups || [];
  const risks = [...(standup.top_risks || [])].sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)
  );
  const closeout = brief.yesterday_closeout || {};
  const tracking = brief.tracking || [];

  // P0 inbox items (drafts + flagged gmail/slack). Surface only what
  // needs Alex (or Davide via Alex) to act today.
  const p0Inbox = useMemo(() => {
    return buildInboxItems()
      .filter((it) => it.priority === "P0")
      .sort((a, b) => {
        // Drafts first (they're ready to send), then by type for visual rhythm
        const order = { draft: 0, gmail: 1, slack: 2, transcript: 3, activity: 4 };
        return (order[a.type] ?? 9) - (order[b.type] ?? 9);
      });
  }, []);

  const handleCopy = async () => {
    const md = buildMarkdownDigest({
      standup,
      brief,
      blockers,
      decisions,
      calls,
      followups,
      risks,
      closeout,
      tracking,
      p0Inbox,
    });
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      // Fallback: select-all in a hidden textarea (older browsers)
      const ta = document.createElement("textarea");
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
      document.body.removeChild(ta);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1100px] mx-auto space-y-5 brief-root">
      {/* Print CSS — hide nav + buttons, keep page clean */}
      <style jsx global>{`
        @media print {
          aside, nav, .brief-actions, .brief-back { display: none !important; }
          .brief-root { padding: 0 !important; max-width: 100% !important; }
          .panel { box-shadow: none !important; border-color: #d1d5db !important; break-inside: avoid; }
          section { break-inside: avoid; }
          body { background: white !important; }
        }
      `}</style>

      {/* Back link */}
      <Link
        href="/"
        className="brief-back inline-flex items-center gap-1.5 text-[11.5px] text-ink-500 hover:text-accent-primary"
      >
        <ArrowLeft className="h-3 w-3" /> Back to full standup
      </Link>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-accent-primary" />
            Daily Brief · NA Integrated Marketing
          </div>
          <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1 leading-tight">
            {fmtDate(standup.standup_date, { year: true })}
          </h1>
          <p className="text-[12.5px] text-ink-500 mt-1">
            Shareable roll-up · Alex Akiyama · circulate to Davide / Marketing
            Mgr II / cross-functional partners
          </p>
        </div>
        <div className="brief-actions flex items-center gap-2 shrink-0">
          <Link
            href="/brief"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <Timer className="h-3.5 w-3.5" />
            Standup agenda
          </Link>
          <Link
            href="/brief/weekly"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Weekly update
          </Link>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-accent-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy as text
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </header>

      {/* TL;DR */}
      <section className="panel p-5">
        <h2 className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
          TL;DR
        </h2>
        <p className="text-[14px] leading-relaxed text-ink-900">
          {standup.portfolio_health_summary}
        </p>
      </section>

      {/* Blockers — top priority */}
      {blockers.length > 0 && (
        <section className="panel p-5 border-l-4 border-l-accent-red">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-red">
              <AlertOctagon className="h-4 w-4" /> Blockers
            </h2>
            <span className="text-[11px] mono text-ink-500">
              {blockers.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {blockers.map((b, i) => {
              const t = titleForId(b.title_id);
              return (
                <li
                  key={i}
                  className="text-[13px] leading-relaxed flex gap-2.5"
                >
                  <span className="text-accent-red mt-0.5 shrink-0">•</span>
                  <div className="min-w-0 flex-1">
                    {t && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold mr-1.5"
                        style={{ color: t.brand_color }}
                      >
                        {t.title_name}
                      </span>
                    )}
                    <span className="text-ink-900">{b.blocker}</span>
                    <div className="text-[11.5px] text-ink-500 mt-0.5">
                      Owner: <span className="text-ink-700">{b.owner}</span> ·
                      Needs <span className="text-ink-700">{b.needed_from}</span>{" "}
                      by <span className="text-ink-700 mono">{fmtDate(b.by)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Decisions awaiting */}
      {decisions.length > 0 && (
        <section className="panel p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-amber">
              <Gauge className="h-4 w-4" /> Decisions awaiting
            </h2>
            <span className="text-[11px] mono text-ink-500">
              {decisions.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {decisions.map((d) => {
              const t = titleForId(d.title_id);
              const tone = DECISION_STATUS_TONE[d.status] || "neutral";
              return (
                <li
                  key={d.decision_id}
                  className="text-[13px] leading-relaxed flex gap-2.5"
                >
                  <span className="text-accent-amber mt-0.5 shrink-0">•</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {t && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold"
                          style={{ color: t.brand_color }}
                        >
                          {t.title_name}
                        </span>
                      )}
                      <span className="font-semibold text-ink-900">
                        {d.decision}
                      </span>
                      <Badge tone={tone} size="xs">
                        {DECISION_STATUS_LABEL[d.status] || d.status}
                      </Badge>
                    </div>
                    <div className="text-[11.5px] text-ink-500 mt-0.5">
                      Owner: <span className="text-ink-700">{d.decision_owner}</span>{" "}
                      · By <span className="text-ink-700 mono">{fmtDate(d.decision_date)}</span>
                      {d.tranche_amount_usd > 0 && (
                        <>
                          {" "}
                          · Tranche{" "}
                          <span className="text-ink-700 mono">
                            ${(d.tranche_amount_usd / 1000).toFixed(0)}K
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* P0 inbox actions */}
      {p0Inbox.length > 0 && (
        <section className="panel p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-violet">
              <Send className="h-4 w-4" /> P0 actions awaiting send
            </h2>
            <span className="text-[11px] mono text-ink-500">
              {p0Inbox.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {p0Inbox.map((it) => {
              const t = titleForId(it.titleId);
              return (
                <li
                  key={it.id}
                  className="text-[13px] leading-relaxed flex gap-2.5"
                >
                  <span className="text-accent-violet mt-0.5 shrink-0">•</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {t && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold"
                          style={{ color: t.brand_color }}
                        >
                          {t.title_name}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                        {it.type}
                      </span>
                      <span className="text-ink-900 font-medium">
                        {it.headline}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-ink-500 mt-0.5">
                      {it.subline}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Today's calls */}
      {calls.length > 0 && (
        <section className="panel p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-primary">
              <Phone className="h-4 w-4" /> Today's calls
            </h2>
            <span className="text-[11px] mono text-ink-500">{calls.length}</span>
          </div>
          <ul className="space-y-2">
            {calls.map((c, i) => {
              const prep = PREP_TONE[c.prep_status] || PREP_TONE.outstanding;
              return (
                <li
                  key={i}
                  className="text-[13px] leading-relaxed flex gap-2.5"
                >
                  <span className="mono text-[12px] font-semibold text-ink-900 shrink-0 w-16">
                    {c.time_label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-ink-900 font-medium">{c.title}</span>
                      <Badge tone={prep.tone} size="xs">
                        {prep.label}
                      </Badge>
                    </div>
                    {c.topic && (
                      <div className="text-[11.5px] text-ink-700 mt-0.5">
                        {c.topic}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Top risks — sorted high → medium → low */}
      {risks.length > 0 && (
        <section className="panel p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-amber">
              <AlertTriangle className="h-4 w-4" /> Top risks
            </h2>
            <span className="text-[11px] mono text-ink-500">{risks.length}</span>
          </div>
          <ul className="space-y-3">
            {risks.map((r) => {
              const t = titleForId(r.title_id);
              return (
                <li key={r.risk_id} className="text-[13px] leading-relaxed">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Badge tone={SEVERITY_TONE[r.severity]} size="xs">
                      {r.severity}
                    </Badge>
                    {t && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold"
                        style={{ color: t.brand_color }}
                      >
                        {t.title_name}
                      </span>
                    )}
                    <span className="font-semibold text-ink-900">
                      {r.headline}
                    </span>
                  </div>
                  <p className="text-[12px] text-ink-700 mt-1">
                    <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mr-1.5">
                      Action
                    </span>
                    {r.recommended_action}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Yesterday at a glance */}
      <section className="panel p-5">
        <h2 className="text-[13px] font-bold flex items-center gap-2 text-accent-success mb-3">
          <CheckCircle2 className="h-4 w-4" /> Yesterday at a glance
        </h2>
        <p className="text-[13px] text-ink-700 leading-relaxed">
          {closeout.summary}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat
            label="Closed"
            value={(closeout.completed || []).length}
            tone="success"
          />
          <Stat
            label="Slipped"
            value={(closeout.slipped || []).length}
            tone={
              (closeout.slipped || []).length > 0 ? "red" : "neutral"
            }
          />
          <Stat
            label="New tickets"
            value={(closeout.opened_yesterday || []).length}
            tone="neutral"
          />
        </div>
      </section>

      {/* Active tracking lines — the persistent backdrop */}
      {tracking.length > 0 && (
        <section className="panel p-5">
          <h2 className="text-[13px] font-bold flex items-center gap-2 text-ink-700 mb-3">
            <Activity className="h-4 w-4" /> What we're tracking this week
          </h2>
          <ul className="space-y-2">
            {tracking.map((line, i) => (
              <li
                key={i}
                className="text-[12.5px] leading-relaxed text-ink-700 flex gap-2.5"
              >
                <span className="text-ink-400 mt-0.5 shrink-0">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="text-[11px] text-ink-500 pt-4 pb-2 text-center border-t border-line">
        Generated from 2K BeatBoard ·{" "}
        <Link href="/" className="text-accent-primary hover:underline">
          Open the full standup
        </Link>{" "}
        for KPI movements, per-title detail, budget pacing, and the AI inbox.
      </footer>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneClass =
    tone === "success"
      ? "text-accent-success"
      : tone === "red"
      ? "text-accent-red"
      : "text-ink-700";
  return (
    <div className="border border-line rounded-lg py-2.5">
      <div className={`text-[22px] font-bold ${toneClass} leading-none`}>
        {value}
      </div>
      <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mt-1">
        {label}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Markdown digest for the Copy-as-text button.
//
// Optimized for paste-into-Slack or paste-into-email: keeps blockers /
// decisions / P0 actions at the top, uses bullets (not tables — tables
// don't render in Slack), trims to one line per item, and ends with a
// link back to the live brief.
// -------------------------------------------------------------------
function buildMarkdownDigest({
  standup: s,
  brief,
  blockers,
  decisions,
  calls,
  followups,
  risks,
  closeout,
  tracking,
  p0Inbox,
}) {
  const lines = [];
  const dateStr = fmtDate(s.standup_date, { year: true });

  lines.push(`*Daily Brief · NA Integrated Marketing · ${dateStr}*`);
  lines.push(`_Alex Akiyama · circulate freely_`);
  lines.push("");
  lines.push(`*TL;DR.* ${s.portfolio_health_summary}`);
  lines.push("");

  if (blockers.length > 0) {
    lines.push(`*:no_entry: Blockers (${blockers.length})*`);
    for (const b of blockers) {
      const t = titleForId(b.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(
        `• ${name}${b.blocker} — needs *${b.needed_from}* by ${fmtDate(b.by)} (owner: ${b.owner})`
      );
    }
    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push(`*:bar_chart: Decisions awaiting (${decisions.length})*`);
    for (const d of decisions) {
      const t = titleForId(d.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      const tranche =
        d.tranche_amount_usd > 0
          ? ` · $${(d.tranche_amount_usd / 1000).toFixed(0)}K`
          : "";
      lines.push(
        `• ${name}${d.decision} — *${d.decision_owner}* by ${fmtDate(d.decision_date)}${tranche} (${(DECISION_STATUS_LABEL[d.status] || d.status)})`
      );
    }
    lines.push("");
  }

  if (p0Inbox.length > 0) {
    lines.push(`*:envelope: P0 actions awaiting send (${p0Inbox.length})*`);
    for (const it of p0Inbox) {
      const t = titleForId(it.titleId);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• ${name}(${it.type}) ${it.headline}`);
    }
    lines.push("");
  }

  if (calls.length > 0) {
    lines.push(`*:phone: Today's calls (${calls.length})*`);
    for (const c of calls) {
      lines.push(
        `• ${c.time_label} — ${c.title}${c.topic ? ` — ${c.topic}` : ""}`
      );
    }
    lines.push("");
  }

  if (risks.length > 0) {
    lines.push(`*:warning: Top risks (${risks.length})*`);
    for (const r of risks) {
      const t = titleForId(r.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• [${r.severity.toUpperCase()}] ${name}${r.headline}`);
      lines.push(`  → ${r.recommended_action}`);
    }
    lines.push("");
  }

  lines.push(`*:white_check_mark: Yesterday at a glance*`);
  lines.push(
    `• ${(closeout.completed || []).length} closed · ${(closeout.slipped || []).length} slipped · ${(closeout.opened_yesterday || []).length} new tickets`
  );
  if (closeout.summary) lines.push(`• ${closeout.summary}`);
  lines.push("");

  if (tracking.length > 0) {
    lines.push(`*:chart_with_upwards_trend: What we're tracking this week*`);
    for (const line of tracking) lines.push(`• ${line}`);
    lines.push("");
  }

  lines.push(`—`);
  lines.push(
    `Generated from 2K BeatBoard. Full standup: https://2k-beatboard.vercel.app/`
  );

  return lines.join("\n");
}
