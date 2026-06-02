"use client";

import { ExternalLink } from "lucide-react";
import { jiraTicketHref } from "@/lib/data";

// Renders a Jira ticket key as a link to the ACTUAL Jira ticket, opened in a
// new tab — the single place that defines what "click a ticket key" does.
// Falls back to plain text when the id doesn't resolve to a real ticket
// (e.g. proposed/extracted tickets that haven't been created yet).
export default function JiraLink({
  ticketId,
  className = "",
  fallbackClassName,
  showIcon = true,
  children,
}) {
  if (!ticketId) return null;
  const href = jiraTicketHref(ticketId);
  if (!href) {
    // Not a real ticket yet (e.g. a proposed/extracted id) — plain text,
    // styled muted so it never reads as a broken link.
    return (
      <span className={fallbackClassName ?? className}>
        {children ?? ticketId}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${ticketId} in Jira`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {children ?? ticketId}
      {showIcon && <ExternalLink className="h-3 w-3 shrink-0" />}
    </a>
  );
}
