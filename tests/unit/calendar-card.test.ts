import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalendarEventCard } from "../../src/client/components/CalendarEventCard.js";
import type { PublicCalendarProposal } from "../../src/shared/contracts.js";

const draft: PublicCalendarProposal = {
  id: "draft-1",
  sessionId: "call-1",
  source: "call_review",
  status: "pending",
  intent: "meeting",
  linkedProposalId: null,
  title: "Intro",
  start: "2026-09-25T14:00:00.000Z",
  end: "2026-09-25T14:30:00.000Z",
  timezone: "UTC",
  attendees: ["contact@example.com"],
  meet: true,
  notes: "",
  htmlLink: null,
  lastError: null
};

describe("Calendar draft controls", () => {
  it("exposes an editable Meet checkbox only for pending meeting drafts", () => {
    const render = (proposal: PublicCalendarProposal) => renderToStaticMarkup(createElement(CalendarEventCard, {
      proposal,
      calendar: { configured: true, connected: true, email: "op@example.com" },
      onProposal: () => undefined
    }));
    const pending = render(draft);
    expect(pending).toMatch(/<input[^>]*type="checkbox"[^>]*checked=""/);
    expect(pending).toContain("Google Meet");
    expect(render({ ...draft, status: "sent" })).not.toContain('type="checkbox"');
    expect(render({ ...draft, intent: "callback" })).not.toContain('type="checkbox"');
  });
});
