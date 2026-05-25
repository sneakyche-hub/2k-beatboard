import Link from "next/link";
import { titles, getTitleStandup, fmtMoney } from "@/lib/data";
import Badge from "@/components/Badge";

const STATUS_LABEL = {
  on_track: "On track",
  at_risk: "At risk",
  blocked: "Blocked",
  delayed: "Delayed",
};

export default function TitlesIndex() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-5 md:py-7 max-w-[1500px] mx-auto space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
          Titles
        </div>
        <h1 className="display text-[26px] md:text-[32px] font-bold tracking-tight mt-1">
          Eight titles, one operating picture.
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {titles.map((t) => {
          const s = getTitleStandup(t.title_id);
          const pct = Math.round(
            (t.budget_spent_usd / t.budget_committed_usd) * 100
          );
          return (
            <Link
              key={t.title_id}
              href={`/titles/${t.franchise_slug}`}
              className="panel p-4 hover:shadow-md hover:border-ink-300 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: t.brand_color }}
                  />
                  <span className="font-semibold truncate">
                    {t.title_name}
                  </span>
                </div>
                <Badge status={t.campaign_status} size="xs">
                  {STATUS_LABEL[t.campaign_status] || t.campaign_status}
                </Badge>
              </div>
              <div className="text-[11px] text-ink-500 uppercase tracking-wider mb-2">
                Phase · {t.current_phase.replace(/_/g, " ")}
              </div>
              <div className="text-[12.5px] text-ink-700 line-clamp-4">
                {s?.claude_blurb}
              </div>
              <div className="mt-3 pt-2 border-t border-line flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-500">
                    Budget
                  </div>
                  <div className="mono text-[12px] font-semibold">
                    {fmtMoney(t.budget_spent_usd)} /{" "}
                    {fmtMoney(t.budget_committed_usd)}
                  </div>
                </div>
                <div className="w-24">
                  <div className="h-1.5 bg-ink-300/40 rounded">
                    <div
                      className="h-1.5 rounded"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: t.brand_color,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-500 mono text-right mt-0.5">
                    {pct}%
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
