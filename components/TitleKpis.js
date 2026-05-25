"use client";

import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import { standup } from "@/lib/data";
import Sparkline from "./Sparkline";

// KPI metadata: maps title.current_phase_kpis/actuals key → display config + category.
// `higher_better: true` means clearing happens when actual ≥ target.
const KPI_DEFS = {
  // Acquisition
  wishlist_velocity_daily: {
    target_key: "wishlist_velocity_target_daily",
    label: "Wishlist velocity (daily)",
    category: "acquisition",
    higher_better: true,
    fmt: (v) => v?.toLocaleString(),
    suffix: " / day",
  },
  wishlist_total: {
    target_key: "wishlist_total_target",
    label: "Wishlist bank",
    category: "acquisition",
    higher_better: true,
    fmt: (v) => v?.toLocaleString(),
  },
  capsule_ctr_pct: {
    target_key: "capsule_ctr_target_pct",
    label: "Capsule CTR",
    category: "acquisition",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
  store_to_wishlist_cvr_pct: {
    target_key: "store_to_wishlist_cvr_target_pct",
    label: "Store → wishlist CVR",
    category: "acquisition",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
  ccu_peak: {
    target_key: "ccu_peak_target",
    label: "CCU peak",
    category: "acquisition",
    higher_better: true,
    fmt: (v) => v?.toLocaleString(),
  },
  free_weekend_concurrent: {
    target_key: "free_weekend_concurrent_target",
    label: "Free Weekend CCU",
    category: "acquisition",
    higher_better: true,
    fmt: (v) => (v == null ? "n/a" : v.toLocaleString()),
  },
  // Retention
  d7_retention_pct: {
    target_key: "d7_retention_target_pct",
    label: "D7 retention",
    category: "retention",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
  d30_retention_pct: {
    target_key: "d30_retention_target_pct",
    label: "D30 retention",
    category: "retention",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
  // Monetization
  roas: {
    target_key: "roas_target",
    label: "ROAS",
    category: "monetization",
    higher_better: true,
    fmt: (v) => v?.toFixed(2),
  },
  cpi_usd: {
    target_key: "cpi_ceiling_usd",
    label: "CPI",
    category: "monetization",
    higher_better: false,
    fmt: (v) => `$${v?.toFixed(2)}`,
  },
  conversion_to_paid_pct: {
    target_key: "conversion_to_paid_target_pct",
    label: "Free → paid conversion",
    category: "monetization",
    higher_better: true,
    fmt: (v) => (v == null ? "n/a" : `${v}%`),
  },
  catalog_revenue_yoy_pct: {
    target_key: "catalog_revenue_yoy_pct",
    label: "Catalog revenue YoY",
    category: "monetization",
    higher_better: true,
    fmt: (v) => `+${v}%`,
  },
  // Sentiment
  review_score_pct: {
    target_key: "review_score_target_pct",
    label: "Review score",
    category: "sentiment",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
  sentiment_positive_share_pct: {
    target_key: "sentiment_positive_share_target_pct",
    label: "Positive sentiment share",
    category: "sentiment",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
  narrative_seo_share_pct: {
    target_key: "narrative_seo_share_target_pct",
    label: "Narrative SEO share",
    category: "sentiment",
    higher_better: true,
    fmt: (v) => `${v}%`,
  },
};

const CATEGORY_META = {
  acquisition: { label: "Acquisition", color: "#3b82f6" },
  retention: { label: "Retention", color: "#8b5cf6" },
  monetization: { label: "Monetization", color: "#10b981" },
  sentiment: { label: "Sentiment", color: "#FFC72C" },
};

const GATE_META = {
  on_track: { label: "Clearing gate", tone: "text-accent-success", bg: "bg-accent-success/10", icon: CheckCircle2 },
  at_risk: { label: "Gate at risk", tone: "text-accent-amber", bg: "bg-accent-amber/10", icon: AlertTriangle },
  blocked: { label: "Gate blocked", tone: "text-accent-red", bg: "bg-accent-red/10", icon: Ban },
};

function statusFor(actual, target, higherBetter) {
  if (actual == null || target == null) return "no_data";
  const clears = higherBetter ? actual >= target : actual <= target;
  if (clears) return "clearing";
  // distance from target
  const ratio = higherBetter ? actual / target : target / actual;
  if (ratio >= 0.9) return "near";
  return "missing";
}

const STATUS_TONE = {
  clearing: "text-accent-success",
  near: "text-accent-amber",
  missing: "text-accent-red",
  no_data: "text-ink-500",
};

function getKpiCards(title) {
  const actuals = title.current_phase_actuals || {};
  const targets = title.current_phase_kpis || {};
  const cards = [];
  for (const [actualKey, def] of Object.entries(KPI_DEFS)) {
    if (!(actualKey in actuals)) continue;
    const actual = actuals[actualKey];
    const target = targets[def.target_key];
    cards.push({
      key: actualKey,
      def,
      actual,
      target,
      status: statusFor(actual, target, def.higher_better),
    });
  }
  return cards;
}

function groupByCategory(cards) {
  const order = ["acquisition", "retention", "monetization", "sentiment"];
  const groups = {};
  for (const c of cards) {
    const cat = c.def.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(c);
  }
  return order.filter((k) => groups[k]).map((k) => ({ category: k, cards: groups[k] }));
}

export default function TitleKpis({ title }) {
  if (!title) return null;

  const cards = getKpiCards(title);
  const groups = groupByCategory(cards);
  const gate = GATE_META[title.phase_gate_status] || GATE_META.on_track;
  const GateIcon = gate.icon;

  // Find this title's sparkline from the standup by_title block
  const standupBlock = standup.by_title?.find((b) => b.title_id === title.title_id);

  const clearing = cards.filter((c) => c.status === "clearing").length;
  const atRisk = cards.filter((c) => c.status === "near" || c.status === "missing").length;

  return (
    <div className="space-y-5">
      {/* Phase gate hero */}
      <div className="panel p-5 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-1 w-full"
          style={{ backgroundColor: title.brand_color }}
        />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div
              className="text-[10.5px] uppercase tracking-wider font-semibold"
              style={{ color: title.brand_color }}
            >
              {title.title_name} · phase: {title.current_phase.replace(/_/g, " ")}
            </div>
            <h2 className="display text-[22px] font-bold tracking-tight mt-1">
              {title.next_milestone_name}
            </h2>
            <div className="text-[12px] text-ink-500 mt-1">
              Next milestone:{" "}
              <span className="mono text-ink-700">{title.next_milestone_date}</span>
            </div>
          </div>
          <div className={`px-3 py-2 rounded-lg ${gate.bg} flex items-center gap-2`}>
            <GateIcon className={`h-4 w-4 ${gate.tone}`} />
            <span className={`text-[12px] font-semibold ${gate.tone}`}>
              {gate.label}
            </span>
          </div>
        </div>
        {title.phase_gate_blocker && (
          <p className="text-[12.5px] text-ink-700 leading-relaxed mt-3 border-t border-line pt-3">
            {title.phase_gate_blocker}
          </p>
        )}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
              KPIs clearing
            </div>
            <div className="display text-[22px] font-bold text-accent-success mt-0.5">
              {clearing}
              <span className="text-[12px] text-ink-500 font-normal ml-1">
                / {cards.length}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
              At risk / missing
            </div>
            <div className="display text-[22px] font-bold text-accent-amber mt-0.5">
              {atRisk}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
              Budget remaining
            </div>
            <div className="display text-[22px] font-bold mt-0.5">
              ${(title.budget_remaining_usd / 1000).toFixed(0)}K
              <span className="text-[12px] text-ink-500 font-normal ml-1">
                of ${(title.budget_committed_usd / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Standup trend strip */}
      {standupBlock && (
        <div className="panel p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
              Trend · {standupBlock.sparkline_metric_label}
            </div>
            <div className="text-[12.5px] text-ink-700 mt-1 leading-relaxed">
              {standupBlock.claude_blurb}
            </div>
          </div>
          <Sparkline
            values={standupBlock.sparkline_values}
            color={title.brand_color}
            width={140}
            height={44}
          />
        </div>
      )}

      {/* KPI groups by category */}
      {groups.map(({ category, cards }) => {
        const meta = CATEGORY_META[category];
        return (
          <div key={category}>
            <h3 className="section-title flex items-center gap-2 mb-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {meta.label}
              <span className="text-[10.5px] mono text-ink-500 font-normal ml-1">
                {cards.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((c) => {
                const StatusIcon =
                  c.status === "clearing"
                    ? TrendingUp
                    : c.status === "missing"
                    ? TrendingDown
                    : Minus;
                const tone = STATUS_TONE[c.status];
                return (
                  <div key={c.key} className="panel p-3.5">
                    <div className="text-[10.5px] uppercase tracking-wider text-ink-500 font-semibold">
                      {c.def.label}
                    </div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="display text-[24px] font-bold leading-tight">
                        {c.def.fmt(c.actual)}
                      </span>
                      <StatusIcon className={`h-4 w-4 ${tone}`} />
                    </div>
                    <div className="text-[11.5px] text-ink-500 mt-1 flex items-center gap-1.5">
                      <Target className="h-3 w-3" />
                      Target: <span className="mono text-ink-700">
                        {c.def.higher_better ? "≥ " : "≤ "}
                        {c.def.fmt(c.target)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
