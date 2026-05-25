"use client";

import { X, Mail, MessageSquare } from "lucide-react";
import { useEffect } from "react";

export default function EscalationModal({ draft, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!draft) return null;

  const Icon = draft.channel === "email" ? Mail : MessageSquare;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm animate-fade-in flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-2xl bg-white border border-line rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-line">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">
                Claude-drafted {draft.channel}
              </div>
              <div className="text-sm font-semibold mt-0.5">
                To: {draft.recipient}
              </div>
              {draft.subject && (
                <div className="text-[13px] text-ink-700 mt-0.5">
                  Subject: {draft.subject}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="h-8 w-8 rounded-md hover:bg-ink-300/20 text-ink-500 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="text-[13.5px] leading-relaxed text-ink-900 whitespace-pre-wrap">
            {draft.body}
          </div>
        </div>
        <div className="border-t border-line px-5 py-3 flex items-center justify-between bg-base/60">
          <div className="text-[11px] text-ink-500">
            Demo — drafts are not sent.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-sm font-medium border border-line text-ink-700 hover:bg-ink-300/20"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary/90"
            >
              Send to {draft.recipient}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
