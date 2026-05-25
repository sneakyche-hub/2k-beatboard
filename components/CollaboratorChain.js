"use client";

import { Users, Building2, Briefcase, ArrowRight } from "lucide-react";

// Renders the per-beat collaborator graph: who's involved (internal + external),
// what each is responsible for, and the dependency/handoff sequencing between them.
//
// Expects a beat object with shape:
//   { beat_name, manager_owner, collaborators: [{ name, type, role, responsible_for, depends_on, delivers_to }] }
export default function CollaboratorChain({ beat }) {
  if (!beat || !beat.collaborators || beat.collaborators.length === 0) {
    return null;
  }

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-accent-violet" />
            Collaborator chain
          </h3>
          <div className="text-[11px] text-ink-500 mt-0.5">
            {beat.beat_name}
          </div>
        </div>
        {beat.manager_owner && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
              Marketing owner
            </div>
            <div className="text-[12.5px] font-semibold mt-0.5">
              {beat.manager_owner}
            </div>
          </div>
        )}
      </div>

      <ol className="space-y-3">
        {beat.collaborators.map((c, idx) => {
          const isInternal = c.type === "internal";
          const Icon = isInternal ? Briefcase : Building2;
          return (
            <li
              key={`${c.name}-${idx}`}
              className="relative pl-6 border-l-2"
              style={{ borderColor: isInternal ? "#7C3AED" : "#1F4FDB" }}
            >
              <span
                className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white shadow"
                style={{
                  backgroundColor: isInternal ? "#7C3AED" : "#1F4FDB",
                }}
              />
              <div className="flex items-baseline gap-2 flex-wrap">
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isInternal ? "text-accent-violet" : "text-accent-primary"
                  }`}
                />
                <span className="text-[13.5px] font-semibold text-ink-900">
                  {c.name}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                    isInternal
                      ? "bg-accent-violet/10 text-accent-violet"
                      : "bg-accent-primary/10 text-accent-primary"
                  }`}
                >
                  {c.type}
                </span>
                <span className="text-[12px] text-ink-500">{c.role}</span>
              </div>

              {c.responsible_for && c.responsible_for.length > 0 && (
                <div className="mt-2">
                  <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold mb-1">
                    Responsible for
                  </div>
                  <ul className="space-y-1">
                    {c.responsible_for.map((task, i) => (
                      <li
                        key={i}
                        className="text-[12.5px] text-ink-900 flex gap-2 leading-relaxed"
                      >
                        <span className="text-ink-400 mt-1">•</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {c.depends_on && c.depends_on.length > 0 && (
                  <div className="rounded-md bg-base border border-line px-2.5 py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                      Depends on
                    </div>
                    <div className="text-[11.5px] text-ink-700 mt-0.5 leading-snug">
                      {c.depends_on.join(", ")}
                    </div>
                  </div>
                )}
                {c.delivers_to && c.delivers_to.length > 0 && (
                  <div className="rounded-md bg-twok-gold-soft/30 border border-twok-gold/40 px-2.5 py-1.5">
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
          );
        })}
      </ol>
    </div>
  );
}
