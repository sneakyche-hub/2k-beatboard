"use client";

import { Users2, Briefcase, ArrowRight, Crown } from "lucide-react";

// Aggregates internal collaborators across all the title's featured beats.
// Dedupes by name; merges role(s), responsibilities, and dependencies per person.
function aggregate(beats) {
  const map = new Map();
  for (const beat of beats) {
    if (!beat.collaborators) continue;
    for (const c of beat.collaborators) {
      if (c.type !== "internal") continue;
      const existing = map.get(c.name) || {
        name: c.name,
        roles: new Set(),
        beats: [],
        responsible_for: [],
        depends_on: new Set(),
        delivers_to: new Set(),
      };
      if (c.role) existing.roles.add(c.role);
      existing.beats.push(beat.beat_name);
      (c.responsible_for || []).forEach((r) =>
        existing.responsible_for.push({ beat: beat.beat_name, task: r })
      );
      (c.depends_on || []).forEach((d) => existing.depends_on.add(d));
      (c.delivers_to || []).forEach((d) => existing.delivers_to.add(d));
      map.set(c.name, existing);
    }
  }
  return Array.from(map.values()).map((p) => ({
    name: p.name,
    roles: Array.from(p.roles),
    beats: p.beats,
    responsible_for: p.responsible_for,
    depends_on: Array.from(p.depends_on),
    delivers_to: Array.from(p.delivers_to),
  }));
}

// Inferred function map for the standard internal partner functions, used to
// surface a baseline org view even for collaborators who don't show up in any
// featured beat's collaborator graph yet.
const STANDARD_FUNCTIONS = [
  "Brand Creative",
  "Product / Live Service",
  "Community Lead",
  "Performance Marketing",
  "Legal",
  "Engineering",
];

export default function TitleInternalCollaborators({ beats, title }) {
  const collaborators = aggregate(beats);

  // Anchor: the marketing manager_owner across beats (usually Alex, sometimes
  // Marketing Mgr II). Pick the first non-null.
  const anchor =
    beats.find((b) => b.manager_owner)?.manager_owner || "Alex Akiyama";

  const presentNames = new Set(collaborators.map((c) => c.name));
  const missingFunctions = STANDARD_FUNCTIONS.filter(
    (fn) => !presentNames.has(fn)
  );

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Users2 className="h-3.5 w-3.5 text-twok-red" />
            Internal collaborators · this title
          </h3>
          <div className="text-[11px] text-ink-500 mt-0.5">
            Aggregated across {beats.filter((b) => b.collaborators).length}{" "}
            featured beat
            {beats.filter((b) => b.collaborators).length === 1 ? "" : "s"} on{" "}
            {title.title_name}
          </div>
        </div>
        <div
          className="rounded-lg border px-3 py-2"
          style={{
            borderColor: title.brand_color,
            backgroundColor: `${title.brand_color}10`,
          }}
        >
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold flex items-center gap-1">
            <Crown className="h-3 w-3" /> Marketing owner
          </div>
          <div className="text-[13px] font-semibold mt-0.5">{anchor}</div>
        </div>
      </div>

      {collaborators.length === 0 ? (
        <div className="text-[12px] text-ink-400 italic">
          No internal collaborators mapped on featured beats yet.
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {collaborators.map((c) => (
            <li
              key={c.name}
              className="border border-line rounded-lg p-3.5 space-y-2.5"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <Briefcase className="h-3.5 w-3.5 text-twok-red" />
                <span className="text-[13.5px] font-semibold text-ink-900">
                  {c.name}
                </span>
                <span className="text-[9.5px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-twok-red/10 text-twok-red border border-twok-red/30">
                  Internal
                </span>
              </div>
              {c.roles.length > 0 && (
                <div className="text-[12px] text-ink-700 leading-relaxed">
                  {c.roles.join(" · ")}
                </div>
              )}

              {c.responsible_for.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-1">
                    Responsible for · this cycle
                  </div>
                  <ul className="space-y-1">
                    {c.responsible_for.map((r, i) => (
                      <li
                        key={i}
                        className="text-[12px] text-ink-900 flex gap-2 leading-relaxed"
                      >
                        <span className="text-ink-400 mt-1">·</span>
                        <span>
                          {r.task}
                          <span className="text-ink-500 ml-1">
                            ({r.beat})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {c.depends_on.length > 0 && (
                  <div className="rounded-md bg-base border border-line px-2.5 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                      Depends on
                    </div>
                    <div className="text-[11.5px] text-ink-700 mt-0.5 leading-snug">
                      {c.depends_on.join(", ")}
                    </div>
                  </div>
                )}
                {c.delivers_to.length > 0 && (
                  <div className="rounded-md bg-twok-red/10 border border-twok-red/30 px-2.5 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-ink-700 font-semibold flex items-center gap-1">
                      Delivers to <ArrowRight className="h-2.5 w-2.5" />
                    </div>
                    <div className="text-[11.5px] text-ink-900 mt-0.5 leading-snug">
                      {c.delivers_to.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {missingFunctions.length > 0 && (
        <div className="border-t border-line pt-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">
            Standard partner functions · not engaged on featured beats this cycle
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingFunctions.map((fn) => (
              <span
                key={fn}
                className="text-[11px] text-ink-500 border border-line rounded px-1.5 py-0.5"
              >
                {fn}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
