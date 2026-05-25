import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KpiCard({ label, value, trend, delta, hint }) {
  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const tone =
    trend === "up"
      ? "text-accent-success"
      : trend === "down"
      ? "text-accent-red"
      : "text-ink-500";

  return (
    <div className="kpi-tile">
      <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-1.5">
        <div className="display text-[22px] font-bold leading-tight">
          {value}
        </div>
        {delta != null && (
          <div className={clsx("flex items-center gap-0.5 text-[11px]", tone)}>
            <Icon className="h-3 w-3" />
            <span className="mono">{delta}</span>
          </div>
        )}
      </div>
      {hint && (
        <div className="text-[11px] text-ink-500 mt-0.5">{hint}</div>
      )}
    </div>
  );
}
