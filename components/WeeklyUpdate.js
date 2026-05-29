"use client";

import { useState } from "react";
import Link from "next/link";
import { weeklyUpdate, titles, fmtDate } from "@/lib/data";
import Badge from "./Badge";
import {
  Sparkles,
  Copy,
  Printer,
  ArrowLeft,
  Check,
  Send,
  Mail,
  Trophy,
  Pause,
  Gavel,
  Calendar,
  HandHelping,
  Compass,
  TrendingUp,
  TrendingDown,
  Timer,
  FileText,
} from "lucide-react";

// -------------------------------------------------------------------
// WeeklyUpdate
//
// Friday roll-up to Davide + Marketing Mgr II (cc Brand / Comms /
// Marcus). The manager-track artifact: not a status doc, an editorial
// take on the week — what happened, what we decided, what we're asking
// for, what we're watching.
//
// Composed by Alex on Friday afternoon from the week's tickets,
// decisions, KPIs, and blockers — with explicit editorial layers
// (narrative arc, recommendations on open decisions, asks of Davide,
// themes tracking into next month).
//
// Affordances: Copy as email (formatted for paste-into-Gmail), Print,
// and a (mock) Send button — the "drafted, ready to send" status pill
// is the framing.
// -------------------------------------------------------------------

function titleForId(id) {
  return titles.find((t) => t.title_id === id);
}

const STATUS_LABEL = {
  draft: "Draft",
  ready_to_send: "Ready to send",
  sent: "Sent",
};

const STATUS_TONE = {
  draft: "neutral",
  ready_to_send: "primary",
  sent: "success",
};

export default function WeeklyUpdate() {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const w = weeklyUpdate;

  const handleCopy = async () => {
    const md = buildEmailMarkdown(w);
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

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1100px] mx-auto space-y-5 weekly-root">
      <style jsx global>{`
        @media print {
          aside, nav, .weekly-actions, .weekly-back { display: none !important; }
          .weekly-root { padding: 0 !important; max-width: 100% !important; }
          .panel { box-shadow: none !important; border-color: #d1d5db !important; break-inside: avoid; }
          section { break-inside: avoid; }
          body { background: white !important; }
        }
      `}</style>

      <Link
        href="/brief"
        className="weekly-back inline-flex items-center gap-1.5 text-[11.5px] text-ink-500 hover:text-accent-primary"
      >
        <ArrowLeft className="h-3 w-3" /> Back to standup agenda
      </Link>

      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-accent-primary" />
            Weekly NA Integrated Update · Friday roll-up
          </div>
          <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1 leading-tight">
            Week ending {fmtDate(w.week_ending, { year: true })}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge tone={STATUS_TONE[w.status]} size="xs">
              {STATUS_LABEL[w.status]}
            </Badge>
            <span className="text-[12px] text-ink-500">
              Drafted {new Date(w.drafted_at).toLocaleString("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "UTC",
              })}{" "}
              · {w.week_label}
            </span>
          </div>
        </div>
        <div className="weekly-actions flex items-center gap-2 shrink-0">
          <Link
            href="/brief"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <Timer className="h-3.5 w-3.5" />
            Standup
          </Link>
          <Link
            href="/brief/digest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-medium text-ink-700 hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Daily digest
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
                Copy as email
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
          <button
            type="button"
            onClick={handleSend}
            disabled={sent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-primary bg-accent-primary text-white text-[12px] font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-60"
          >
            {sent ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Sent
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send
              </>
            )}
          </button>
        </div>
      </header>

      {/* Envelope strip (From / To / Subject) */}
      <section className="panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">From</span>
          <span className="text-ink-900">{w.from}</span>
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">To</span>
          <span className="text-ink-900">{w.to.join(", ")}</span>
          {w.cc && w.cc.length > 0 && (
            <>
              <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Cc</span>
              <span className="text-ink-700">{w.cc.join(", ")}</span>
            </>
          )}
          <span className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">Subject</span>
          <span className="text-ink-900 font-medium">{w.subject_line}</span>
        </div>
      </section>

      {/* Headline + narrative arc */}
      <section className="panel p-5">
        <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
          Headline
        </div>
        <p className="text-[15.5px] leading-relaxed text-ink-900 font-medium">
          {w.headline}
        </p>
        <p className="text-[13.5px] leading-relaxed text-ink-700 mt-3">
          {w.narrative_arc}
        </p>
      </section>

      {/* Wins this week */}
      {w.wins_this_week && w.wins_this_week.length > 0 && (
        <WeeklySection title="Wins this week" Icon={Trophy} tone="success" count={w.wins_this_week.length}>
          <ul className="space-y-3">
            {w.wins_this_week.map((item, i) => (
              <WeeklyItem key={i} item={item} />
            ))}
          </ul>
        </WeeklySection>
      )}

      {/* Intentional holds */}
      {w.intentional_holds && w.intentional_holds.length > 0 && (
        <WeeklySection
          title="Intentional holds"
          Icon={Pause}
          tone="amber"
          count={w.intentional_holds.length}
          subtitle="Not slips — deliberate holds with a re-measure path"
        >
          <ul className="space-y-3">
            {w.intentional_holds.map((item, i) => (
              <WeeklyItem key={i} item={item} />
            ))}
          </ul>
        </WeeklySection>
      )}

      {/* Decisions made */}
      {w.decisions_made_this_week && w.decisions_made_this_week.length > 0 && (
        <WeeklySection
          title="Decisions made this week"
          Icon={Gavel}
          tone="primary"
          count={w.decisions_made_this_week.length}
        >
          <ul className="space-y-3">
            {w.decisions_made_this_week.map((d, i) => (
              <li key={i} className="text-[13px] leading-relaxed">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-ink-900">{d.what}</span>
                  <Badge tone={d.outcome === "go" ? "success" : d.outcome === "no_go" ? "red" : "amber"} size="xs">
                    {d.outcome === "go" ? "GO" : d.outcome === "no_go" ? "NO-GO" : "DEFER"}
                  </Badge>
                  <span className="text-[11px] mono text-ink-500">
                    {d.decided_by} · {fmtDate(d.decided_at)}
                  </span>
                </div>
                <p className="text-[12.5px] text-ink-700 mt-1">
                  <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mr-1.5">
                    Rationale
                  </span>
                  {d.rationale}
                </p>
              </li>
            ))}
          </ul>
        </WeeklySection>
      )}

      {/* Decisions open into next week */}
      {w.decisions_open_into_next_week && w.decisions_open_into_next_week.length > 0 && (
        <WeeklySection
          title="Decisions open into next week"
          Icon={Gavel}
          tone="amber"
          count={w.decisions_open_into_next_week.length}
          subtitle="With my recommendation — happy to be talked out of either"
        >
          <ul className="space-y-3">
            {w.decisions_open_into_next_week.map((d, i) => (
              <li key={i} className="text-[13px] leading-relaxed">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-ink-900">{d.what}</span>
                  <Badge tone="amber" size="xs">
                    {d.owner} by {fmtDate(d.by)}
                  </Badge>
                </div>
                {d.alex_recommendation && (
                  <p className="text-[12.5px] text-ink-700 mt-1">
                    <span className="text-[10px] uppercase tracking-wider text-accent-primary font-semibold mr-1.5">
                      My read
                    </span>
                    {d.alex_recommendation}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </WeeklySection>
      )}

      {/* KPI movements */}
      {w.kpi_movements_week && w.kpi_movements_week.length > 0 && (
        <WeeklySection title="KPI movements" Icon={TrendingUp} tone="ink" count={w.kpi_movements_week.length}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1.5">
            {w.kpi_movements_week.map((k, i) => {
              const up = k.direction === "up";
              return (
                <li key={i} className="text-[12.5px] leading-relaxed flex items-baseline gap-2">
                  {up ? (
                    <TrendingUp className="h-3.5 w-3.5 text-accent-success shrink-0" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-accent-red shrink-0" />
                  )}
                  <span className="text-ink-700 flex-1 min-w-0">{k.kpi}</span>
                  <span className="mono font-semibold text-ink-900 shrink-0">{k.value}</span>
                  <span className={`mono text-[11.5px] shrink-0 ${up ? "text-accent-success" : "text-accent-red"}`}>
                    {k.delta}
                  </span>
                </li>
              );
            })}
          </ul>
        </WeeklySection>
      )}

      {/* Coming up next week */}
      {w.coming_up_next_week && (
        <WeeklySection
          title={`Coming up next week · ${w.coming_up_next_week.week_label}`}
          Icon={Calendar}
          tone="primary"
          count={w.coming_up_next_week.headline_beats.length}
        >
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
              Headline beats
            </div>
            <ul className="space-y-1.5 mb-4">
              {w.coming_up_next_week.headline_beats.map((b, i) => {
                const t = titleForId(b.title_id);
                return (
                  <li key={i} className="text-[13px] leading-relaxed flex gap-2.5">
                    <span className="mono text-[12px] font-semibold text-ink-900 shrink-0 w-20">
                      {fmtDate(b.date)}
                    </span>
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
                        <span className="text-ink-900">{b.what}</span>
                      </div>
                      <div className="text-[11px] text-ink-500 mt-0.5">Owner: {b.owner}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {w.coming_up_next_week.watch_items && w.coming_up_next_week.watch_items.length > 0 && (
              <>
                <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
                  Watch items
                </div>
                <ul className="space-y-1">
                  {w.coming_up_next_week.watch_items.map((item, i) => (
                    <li key={i} className="text-[12.5px] leading-relaxed text-ink-700 flex gap-2.5">
                      <span className="text-ink-400 mt-0.5 shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </WeeklySection>
      )}

      {/* Asks of Davide */}
      {w.asks_of_davide && w.asks_of_davide.length > 0 && (
        <WeeklySection
          title="Asks of Davide"
          Icon={HandHelping}
          tone="violet"
          count={w.asks_of_davide.length}
          subtitle="Explicit, by-date — flagging so they don't get lost"
        >
          <ul className="space-y-3">
            {w.asks_of_davide.map((a, i) => (
              <li key={i} className="text-[13px] leading-relaxed">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-ink-900">{a.ask}</span>
                  <Badge tone="violet" size="xs">
                    By {fmtDate(a.by)}
                  </Badge>
                </div>
                <p className="text-[12.5px] text-ink-700 mt-1">{a.context}</p>
              </li>
            ))}
          </ul>
        </WeeklySection>
      )}

      {/* Themes tracking */}
      {w.themes_tracking_into_next_month && w.themes_tracking_into_next_month.length > 0 && (
        <WeeklySection
          title="Themes tracking into next month"
          Icon={Compass}
          tone="ink"
          count={w.themes_tracking_into_next_month.length}
          subtitle="Longer-arc patterns worth flagging now so they don't surprise us"
        >
          <ul className="space-y-2">
            {w.themes_tracking_into_next_month.map((theme, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-ink-700 flex gap-2.5">
                <span className="text-ink-400 mt-0.5 shrink-0">·</span>
                <span>{theme}</span>
              </li>
            ))}
          </ul>
        </WeeklySection>
      )}

      {/* Footer */}
      <footer className="text-[11px] text-ink-500 pt-4 pb-2 text-center border-t border-line">
        Weekly roll-up generated from 2K BeatBoard ·{" "}
        <Link href="/brief" className="text-accent-primary hover:underline">
          Daily standup agenda
        </Link>{" "}
        ·{" "}
        <Link href="/brief/digest" className="text-accent-primary hover:underline">
          Daily digest
        </Link>
      </footer>
    </div>
  );
}

function WeeklySection({ title, Icon, tone, count, subtitle, children }) {
  const toneClass = {
    success: "text-accent-success border-l-accent-success",
    amber: "text-accent-amber border-l-accent-amber",
    primary: "text-accent-primary border-l-accent-primary",
    red: "text-accent-red border-l-accent-red",
    violet: "text-accent-violet border-l-accent-violet",
    ink: "text-ink-700 border-l-ink-300",
  }[tone] || "text-ink-700 border-l-ink-300";

  const [titleColor, borderClass] = toneClass.split(" ");

  return (
    <section className={`panel p-5 border-l-4 ${borderClass}`}>
      <div className="mb-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className={`text-[13px] font-bold flex items-center gap-2 ${titleColor}`}>
            <Icon className="h-4 w-4" />
            {title}
            {typeof count === "number" && (
              <span className="text-[11px] mono text-ink-500 font-normal ml-1">
                ({count})
              </span>
            )}
          </h2>
        </div>
        {subtitle && (
          <p className="text-[11.5px] text-ink-500 mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function WeeklyItem({ item }) {
  const t = titleForId(item.title_id);
  return (
    <li className="text-[13px] leading-relaxed">
      <div className="flex items-baseline gap-2 flex-wrap">
        {t && (
          <span
            className="text-[10px] uppercase tracking-wider font-bold"
            style={{ color: t.brand_color }}
          >
            {t.title_name}
          </span>
        )}
        <span className="font-semibold text-ink-900">{item.headline}</span>
        {item.linked_ticket_ids && item.linked_ticket_ids.length > 0 && (
          <span className="text-[11px] mono text-ink-500">
            {item.linked_ticket_ids.join(" · ")}
          </span>
        )}
      </div>
      <p className="text-[12.5px] text-ink-700 mt-1">{item.detail}</p>
    </li>
  );
}

// -------------------------------------------------------------------
// buildEmailMarkdown — paste-into-Gmail format for Copy as email
// -------------------------------------------------------------------
function buildEmailMarkdown(w) {
  const lines = [];

  lines.push(`Subject: ${w.subject_line}`);
  lines.push(`To: ${w.to.join(", ")}`);
  if (w.cc && w.cc.length > 0) {
    lines.push(`Cc: ${w.cc.join(", ")}`);
  }
  lines.push("");
  lines.push(`Davide, team —`);
  lines.push("");
  lines.push(w.headline);
  lines.push("");
  lines.push(w.narrative_arc);
  lines.push("");

  if (w.wins_this_week && w.wins_this_week.length > 0) {
    lines.push(`WINS THIS WEEK`);
    for (const item of w.wins_this_week) {
      const t = titleForId(item.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• ${name}${item.headline}`);
      lines.push(`  ${item.detail}`);
    }
    lines.push("");
  }

  if (w.intentional_holds && w.intentional_holds.length > 0) {
    lines.push(`INTENTIONAL HOLDS`);
    for (const item of w.intentional_holds) {
      const t = titleForId(item.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• ${name}${item.headline}`);
      lines.push(`  ${item.detail}`);
    }
    lines.push("");
  }

  if (w.decisions_made_this_week && w.decisions_made_this_week.length > 0) {
    lines.push(`DECISIONS MADE THIS WEEK`);
    for (const d of w.decisions_made_this_week) {
      const outcome = d.outcome === "go" ? "GO" : d.outcome === "no_go" ? "NO-GO" : "DEFER";
      lines.push(`• ${d.what} — ${outcome} (${d.decided_by}, ${fmtDate(d.decided_at)})`);
      lines.push(`  Rationale: ${d.rationale}`);
    }
    lines.push("");
  }

  if (w.decisions_open_into_next_week && w.decisions_open_into_next_week.length > 0) {
    lines.push(`DECISIONS OPEN INTO NEXT WEEK`);
    for (const d of w.decisions_open_into_next_week) {
      lines.push(`• ${d.what} — ${d.owner} by ${fmtDate(d.by)}`);
      if (d.alex_recommendation) lines.push(`  My read: ${d.alex_recommendation}`);
    }
    lines.push("");
  }

  if (w.kpi_movements_week && w.kpi_movements_week.length > 0) {
    lines.push(`KPI MOVEMENTS`);
    for (const k of w.kpi_movements_week) {
      const arrow = k.direction === "up" ? "↑" : "↓";
      lines.push(`• ${arrow} ${k.kpi}: ${k.value} (${k.delta})`);
    }
    lines.push("");
  }

  if (w.coming_up_next_week) {
    lines.push(`COMING UP NEXT WEEK · ${w.coming_up_next_week.week_label}`);
    for (const b of w.coming_up_next_week.headline_beats) {
      const t = titleForId(b.title_id);
      const name = t ? `[${t.title_name}] ` : "";
      lines.push(`• ${fmtDate(b.date)} — ${name}${b.what} (owner: ${b.owner})`);
    }
    if (w.coming_up_next_week.watch_items && w.coming_up_next_week.watch_items.length > 0) {
      lines.push("");
      lines.push(`Watch:`);
      for (const item of w.coming_up_next_week.watch_items) {
        lines.push(`• ${item}`);
      }
    }
    lines.push("");
  }

  if (w.asks_of_davide && w.asks_of_davide.length > 0) {
    lines.push(`ASKS OF DAVIDE`);
    for (const a of w.asks_of_davide) {
      lines.push(`• ${a.ask} (by ${fmtDate(a.by)})`);
      lines.push(`  ${a.context}`);
    }
    lines.push("");
  }

  if (w.themes_tracking_into_next_month && w.themes_tracking_into_next_month.length > 0) {
    lines.push(`THEMES TRACKING INTO NEXT MONTH`);
    for (const theme of w.themes_tracking_into_next_month) {
      lines.push(`• ${theme}`);
    }
    lines.push("");
  }

  lines.push(`—`);
  lines.push(`Alex`);
  lines.push("");
  lines.push(`Generated from 2K BeatBoard: https://2k-beatboard.vercel.app/brief/weekly`);

  return lines.join("\n");
}
