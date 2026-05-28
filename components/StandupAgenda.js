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
  Phone,
  ListChecks,
  Copy,
  Printer,
  ArrowLeft,
  Check,
  Timer,
  FileText,
} from "lucide-react";

// -------------------------------------------------------------------
// StandupAgenda
//
// Live-meeting view of the daily standup for the core GTM trio:
// Davide Detta (Sr Mgr) + Alex Akiyama (Mgr, NA) + Marketing Mgr II.
//
// Target: 15-20 min total. Four agenda sections, each time-boxed:
//   1. Blockers needing the room       — 5 min
//   2. Decisions on the table          — 5 min
//   3. Today's external touchpoints    — 4 min
//   4. Action items out                — 2 min
//                                Total: 16 min (with 2-4 min slack)
//
// Designed to be on screen during the meeting, not circulated. The
// shareable roll-up version lives at /brief/digest.
// -------------------------------------------------------------------

const TRIO = ["Davide Detta", "Alex Akiyama", "Marketing Mgr II", "Alex"];

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

function isTrio(name) {
  if (!name) return false;
  return TRIO.some((n) => name.toLowerCase().includes(n.toLowerCase()));
}

const DECISION_STATUS_LABEL = {
  awaiting_decision: "Awaiting",
  held: "Held",
  decide_today: "Decide today",
};

const DECISION_STATUS_TONE = {
  awaiting_decision: "amber",
  held: "red",
  decide_today: "amber",
};

const DECISION_STATUS_RANK = {
  decide_today: 0,
  awaiting_decision: 1,
  held: 2,
};

export default function StandupAgenda() {
  const [copied, setCopied] = useState(false);

  const brief = standup.standup_brief;
  const blockers = brief.blockers || [];

  // Sort decisions: decide_today first, then awaiting, then held; within
  // each bucket, sort by decision_date ascending so soonest decisions
  // surface first.
  const decisions = useMemo(() => {
    return [...(standup.pending_decisions || [])]
      .filter(
        (d) =>
          d.status === "awaiting_decision" ||
          d.status === "decide_today" ||
          d.status === "held"
      )
      .sort((a, b) => {
        const r =
          (DECISION_STATUS_RANK[a.status] ?? 9) -
          (DECISION_STATUS_RANK[b.status] ?? 9);
        if (r !== 0) return r;
        return (a.decision_date || "").localeCompare(b.decision_date || "");
      });
  }, []);

  const calls = brief.today_calls || [];

  // P0 inbox items — only what needs to leave the building today.
  const p0Inbox = useMemo(() => {
    return buildInboxItems()
      .filter((it) => it.priority === "P0")
      .sort((a, b) => {
        const order = { draft: 0, gmail: 1, slack: 2, transcript: 3, activity: 4 };
        return (order[a.type] ?? 9) - (order[b.type] ?? 9);
      });
  }, []);

  // Action items out — derived from today_priorities (the explicit
  // who-owns-what assignments). today_followups (things Alex personally
  // owes others) stay in the digest, not the standup agenda.
  const actionItems = brief.today_priorities || [];

  const handleCopy = async () => {
    const md = buildAgendaDigest({
      standup,
      blockers,
      decisions,
      calls,
      p0Inbox,
      actionItems,
    });
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
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
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1100px] mx-auto space-y-5 agenda-root">
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          aside, nav, .agenda-actions, .agenda-back { display: none !important; }
          .agenda-root { padding: 0 !important; max-width: 100% !important; }
          .panel { box-shadow: none !important; border-color: #d1d5db !important; break-inside: avoid; }
          section { break-inside: avoid; }
          body { background: white !important; }
        }
      `}</style>

      {/* Back link */}
      <Link
        href="/"
        className="agenda-back inline-flex items-center gap-1.5 text-[11.5px] text-ink-500 hover:text-accent-primary"
      >
        <ArrowLeft className="h-3 w-3" /> Back to full standup
      </Link>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-accent-primary" />
            Daily standup agenda · NA Integrated Marketing
          </div>
          <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1 leading-tight">
            {fmtDate(standup.standup_date, { year: true })}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] mono font-semibold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/30">
              <Timer className="h-3 w-3" /> 18 min target
            </span>
            <span className="text-[12px] text-ink-500">
              Trio: Davide · Alex · Marketing Mgr II
            </span>
          </div>
        </div>
        <div className="agenda-actions flex items-center gap-2 shrink-0">
          <Link
            href="/brief/digest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Full digest
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
                Copy agenda
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

      {/* One-line portfolio context — replaces the long TL;DR */}
      <section className="panel p-4">
        <p className="text-[13px] leading-relaxed text-ink-700">
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mr-1.5">
            Context
          </span>
          {standup.portfolio_health_summary}
        </p>
      </section>

      {/* 1. Blockers needing the room — 5 min */}
      {blockers.length > 0 && (
        <AgendaSection
          number={1}
          title="Blockers needing the room"
          timeBox="5 min"
          tone="red"
          Icon={AlertOctagon}
          count={blockers.length}
        >
          <ul className="space-y-2.5">
            {blockers.map((b, i) => {
              const t = titleForId(b.title_id);
              const inRoom = isTrio(b.needed_from);
              return (
                <li
                  key={i}
                  className="text-[13px] leading-relaxed flex gap-2.5"
                >
                  <span className="text-accent-red mt-0.5 shrink-0">•</span>
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
                      <span className="text-ink-900">{b.blocker}</span>
                      {inRoom ? (
                        <Badge tone="red" size="xs">
                          Unblock in room
                        </Badge>
                      ) : (
                        <Badge tone="amber" size="xs">
                          Escalation path
                        </Badge>
                      )}
                    </div>
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
        </AgendaSection>
      )}

      {/* 2. Decisions on the table — 5 min */}
      {decisions.length > 0 && (
        <AgendaSection
          number={2}
          title="Decisions on the table"
          timeBox="5 min"
          tone="amber"
          Icon={Gauge}
          count={decisions.length}
        >
          <ul className="space-y-2.5">
            {decisions.map((d) => {
              const t = titleForId(d.title_id);
              const tone = DECISION_STATUS_TONE[d.status] || "neutral";
              const needsDavide = d.decision_owner === "Davide Detta";
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
                      {needsDavide && (
                        <Badge tone="violet" size="xs">
                          Needs Davide GO/NO-GO
                        </Badge>
                      )}
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
        </AgendaSection>
      )}

      {/* 3. Today's external touchpoints — 4 min */}
      {(calls.length > 0 || p0Inbox.length > 0) && (
        <AgendaSection
          number={3}
          title="Today's external touchpoints"
          timeBox="4 min"
          tone="primary"
          Icon={Phone}
          count={calls.length + p0Inbox.length}
        >
          {calls.length > 0 && (
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
                Calls
              </div>
              <ul className="space-y-1.5 mb-3">
                {calls.map((c, i) => (
                  <li
                    key={i}
                    className="text-[13px] leading-relaxed flex gap-2.5"
                  >
                    <span className="mono text-[12px] font-semibold text-ink-900 shrink-0 w-16">
                      {c.time_label}
                    </span>
                    <span className="text-ink-700 min-w-0 flex-1">
                      <span className="text-ink-900 font-medium">{c.title}</span>
                      {c.topic && <span className="text-ink-500"> — {c.topic}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {p0Inbox.length > 0 && (
            <div>
              <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
                P0 actions leaving the building
              </div>
              <ul className="space-y-1.5">
                {p0Inbox.map((it) => {
                  const t = titleForId(it.titleId);
                  return (
                    <li
                      key={it.id}
                      className="text-[13px] leading-relaxed flex gap-2.5"
                    >
                      <span className="text-accent-violet mt-0.5 shrink-0">•</span>
                      <span className="min-w-0 flex-1">
                        {t && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold mr-1.5"
                            style={{ color: t.brand_color }}
                          >
                            {t.title_name}
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mr-1.5">
                          {it.type}
                        </span>
                        <span className="text-ink-900">{it.headline}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </AgendaSection>
      )}

      {/* 4. Action items out — 2 min */}
      {actionItems.length > 0 && (
        <AgendaSection
          number={4}
          title="Action items out"
          timeBox="2 min"
          tone="success"
          Icon={ListChecks}
          count={actionItems.length}
        >
          <ul className="space-y-2">
            {actionItems.map((a, i) => {
              const t = titleForId(
                // derive title from linked ticket prefix (BL- → borderlands etc.)
                inferTitleIdFromTicket(a.linked_ticket_id)
              );
              return (
                <li
                  key={i}
                  className="text-[13px] leading-relaxed flex gap-2.5"
                >
                  <span className="text-accent-success mt-0.5 shrink-0">☐</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[11px] mono font-semibold text-ink-900 px-1.5 py-0.5 rounded bg-ink-300/20">
                        {a.owner}
                      </span>
                      {t && (
                        <span
                          className="text-[10px] uppercase tracking-wider font-bold"
                          style={{ color: t.brand_color }}
                        >
                          {t.title_name}
                        </span>
                      )}
                      {a.linked_ticket_id && (
                        <span className="text-[11px] mono text-ink-500">
                          {a.linked_ticket_id}
                        </span>
                      )}
                    </div>
                    <p className="text-ink-700 mt-0.5">{a.task}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </AgendaSection>
      )}

      {/* Footer */}
      <footer className="text-[11px] text-ink-500 pt-4 pb-2 text-center border-t border-line">
        Live meeting view ·{" "}
        <Link href="/brief/digest" className="text-accent-primary hover:underline">
          Switch to full digest
        </Link>{" "}
        for the shareable roll-up (TL;DR, risks, yesterday's closeout, tracking).
      </footer>
    </div>
  );
}

// Map ticket ID prefixes to title IDs — keeps the title chip on action
// items without requiring a title_id field on every priority entry.
function inferTitleIdFromTicket(ticketId) {
  if (!ticketId) return null;
  const prefix = ticketId.split("-")[0];
  const map = {
    BL: "borderlands",
    CIV: "civilization",
    MAF: "mafia",
    WND: "wonderlands",
    HW: "homeworld",
    XCM: "xcom",
    ROR: "risk-of-rain",
    BIO: "bioshock",
  };
  return map[prefix] || null;
}

function AgendaSection({ number, title, timeBox, tone, Icon, count, children }) {
  const toneClass = {
    red: "text-accent-red border-l-accent-red",
    amber: "text-accent-amber border-l-accent-amber",
    primary: "text-accent-primary border-l-accent-primary",
    success: "text-accent-success border-l-accent-success",
  }[tone] || "text-ink-700 border-l-ink-300";

  const [titleColor, borderClass] = toneClass.split(" ");

  return (
    <section className={`panel p-5 border-l-4 ${borderClass}`}>
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h2 className={`text-[13px] font-bold flex items-center gap-2 ${titleColor}`}>
          <span className="mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-ink-300/20 text-ink-700">
            {number}
          </span>
          <Icon className="h-4 w-4" />
          {title}
          {typeof count === "number" && (
            <span className="text-[11px] mono text-ink-500 font-normal ml-1">
              ({count})
            </span>
          )}
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px] mono font-semibold text-ink-500">
          <Timer className="h-3 w-3" /> {timeBox}
        </span>
      </div>
      {children}
    </section>
  );
}

// -------------------------------------------------------------------
// Markdown digest for the Copy-agenda button.
// Tighter than the full digest — agenda-flavored, not roll-up.
// Designed to paste pre-standup into Slack so the trio knows what's
// on the table before the call.
// -------------------------------------------------------------------
function buildAgendaDigest({ standup: s, blockers, decisions, calls, p0Inbox, actionItems }) {
  const lines = [];
  const dateStr = fmtDate(s.standup_date, { year: true });

  lines.push(`*Daily standup agenda · ${dateStr}*`);
  lines.push(`_Trio: Davide · Alex · Marketing Mgr II · 18 min target_`);
  lines.push("");
  lines.push(`*Context.* ${s.portfolio_health_summary}`);
  lines.push("");

  if (blockers.length > 0) {
    lines.push(`*1. Blockers needing the room (5 min)*`);
    for (const b of blockers) {
      const t = titleForId(b.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(
        `• ${name}${b.blocker} — needs *${b.needed_from}* by ${fmtDate(b.by)}`
      );
    }
    lines.push("");
  }

  if (decisions.length > 0) {
    lines.push(`*2. Decisions on the table (5 min)*`);
    for (const d of decisions) {
      const t = titleForId(d.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      const tranche =
        d.tranche_amount_usd > 0
          ? ` · $${(d.tranche_amount_usd / 1000).toFixed(0)}K`
          : "";
      const tag = d.decision_owner === "Davide Detta" ? " · Davide GO/NO-GO" : "";
      lines.push(
        `• ${name}${d.decision} — by ${fmtDate(d.decision_date)}${tranche}${tag}`
      );
    }
    lines.push("");
  }

  if (calls.length > 0 || p0Inbox.length > 0) {
    lines.push(`*3. Today's external touchpoints (4 min)*`);
    for (const c of calls) {
      lines.push(`• ${c.time_label} — ${c.title}`);
    }
    for (const it of p0Inbox) {
      const t = titleForId(it.titleId);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• P0 (${it.type}) ${name}${it.headline}`);
    }
    lines.push("");
  }

  if (actionItems.length > 0) {
    lines.push(`*4. Action items out (2 min)*`);
    for (const a of actionItems) {
      lines.push(`• ${a.owner} — ${a.task}`);
    }
    lines.push("");
  }

  lines.push(`—`);
  lines.push(
    `Live agenda: https://2k-beatboard.vercel.app/brief · Full digest: https://2k-beatboard.vercel.app/brief/digest`
  );

  return lines.join("\n");
}
