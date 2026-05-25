import clsx from "clsx";

const TONE_CLASSES = {
  success:
    "bg-accent-success/10 text-accent-success border-accent-success/20",
  amber: "bg-accent-amber/10 text-accent-amber border-accent-amber/20",
  red: "bg-accent-red/10 text-accent-red border-accent-red/20",
  violet: "bg-accent-violet/10 text-accent-violet border-accent-violet/20",
  primary:
    "bg-accent-primary/10 text-accent-primary border-accent-primary/20",
  neutral: "bg-ink-300/30 text-ink-700 border-ink-300/40",
};

const STATUS_TO_TONE = {
  on_track: "success",
  at_risk: "amber",
  blocked: "red",
  delayed: "red",
  active: "primary",
  in_progress: "primary",
  scheduled: "neutral",
  planning: "neutral",
  completed: "success",
  open: "neutral",
  P0: "red",
  P1: "amber",
  P2: "neutral",
};

export default function Badge({ children, tone, status, size = "sm" }) {
  const resolved = tone || STATUS_TO_TONE[status] || "neutral";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        TONE_CLASSES[resolved],
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
      )}
    >
      {children}
    </span>
  );
}
