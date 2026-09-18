import { describe, expect, it } from "vitest";
import { liveCoachOutputSchema } from "../../src/server/coach/schema.js";
import { evidenceInContext } from "../../src/server/coach/evidence.js";
import { cueClaimsApproved } from "../../src/server/coach/claims.js";
import { validateLiveCoachOutput } from "../../src/server/coach/validate.js";
import { loadCampaigns } from "../../src/server/config/campaigns.js";
import { loadPlaybook } from "../../src/server/config/playbook.js";
import type { LeadSnapshot } from "../../src/server/calls/ledger.js";
import type { PublicUtterance } from "../../src/server/transcript/utterances.js";

const snapshot: LeadSnapshot = {
  leadId: "L-100",
  fullName: "Ada Example",
  phone: "+14155550100",
  phoneE164: "+14155550100",
  company: "Example Co",
  role: "Founder"
};

const utterance: PublicUtterance = {
  id: "u1",
  sessionId: "s",
  speaker: "contact",
  text: "we already use an in-house checker",
  startedAtMs: 0,
  endedAtMs: 50,
  confidence: 1,
  isFinal: true,
  sequence: 1
};

function baseOutput(overrides: Record<string, unknown> = {}) {
  return {
    basedOnSequence: 1,
    stage: "objection",
    shouldShow: true,
    cueType: "clarify",
    cue: "What does that checker still miss?",
    reason: "existing solution",
    detectedObjection: "existing_solution",
    qualificationUpdates: [],
    recommendedOutcome: null,
    confidence: 0.8,
    ...overrides
  };
}

describe("Live-coach schema and validators", () => {
  const campaign = loadCampaigns("./config/campaigns").find((item) => item.id === "lamina-sales")!;
  const playbook = loadPlaybook("./config/playbooks/cold-calling.yaml");

  it("rejects oversized cues and unknown criteria", () => {
    expect(liveCoachOutputSchema.safeParse(baseOutput({ cue: "x".repeat(401) })).success).toBe(false);
    const parsed = liveCoachOutputSchema.parse(
      baseOutput({
        qualificationUpdates: [{ criterion: "made_up", state: "yes", evidence: "we already use an in-house checker", confidence: 0.9 }]
      })
    );
    const result = validateLiveCoachOutput(parsed, {
      campaign,
      playbook,
      utterances: [utterance],
      snapshot,
      firstObjection: true
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/unknown criterion/);
    }
  });

  it("rejects qualification evidence absent from contact speech", () => {
    expect(evidenceInContext("totally invented pain", [utterance], snapshot)).toBe(false);
    const parsed = liveCoachOutputSchema.parse(
      baseOutput({
        qualificationUpdates: [
          { criterion: "relevant_problem", state: "yes", evidence: "totally invented pain", confidence: 0.9 }
        ]
      })
    );
    const result = validateLiveCoachOutput(parsed, {
      campaign,
      playbook,
      utterances: [utterance],
      snapshot,
      firstObjection: true
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/evidence/);
    }
  });

  it.each([
    { label: "caller-only", evidence: '"we have painful weekly regressions"', speaker: "caller" as const, valid: false },
    { label: "CRM role", evidence: snapshot.role, speaker: "contact" as const, valid: false },
    { label: "contact quote", evidence: '"we have painful weekly regressions"', speaker: "contact" as const, valid: true }
  ])("validates $label qualification evidence by speaker", ({ evidence, speaker, valid }) => {
    const parsed = liveCoachOutputSchema.parse(baseOutput({
      qualificationUpdates: [{ criterion: "relevant_problem", state: "yes", evidence, confidence: 0.9 }]
    }));
    const result = validateLiveCoachOutput(parsed, {
      campaign,
      playbook,
      utterances: [{ ...utterance, speaker, text: "we have painful weekly regressions" }],
      snapshot,
      firstObjection: true
    });
    expect(result.ok).toBe(valid);
    if (!valid && !result.ok) expect(result.reason).toBe("evidence not in context");
  });

  it("rejects a first-objection rebuttal", () => {
    const parsed = liveCoachOutputSchema.parse(
      baseOutput({
        cueType: "cta",
        cue: "Book a meeting because we guaranteed 40% faster shipping"
      })
    );
    const result = validateLiveCoachOutput(parsed, {
      campaign,
      playbook,
      utterances: [utterance],
      snapshot,
      firstObjection: true
    });
    expect(result.ok).toBe(false);
  });

  it("allows a diagnostic question on the first objection while rejecting an immediate CTA", () => {
    const context = { campaign, playbook, utterances: [utterance], snapshot, firstObjection: true };
    expect(validateLiveCoachOutput(liveCoachOutputSchema.parse(baseOutput({
      cueType: "question", cue: "How does the current checker cover those handoffs?"
    })), context).ok).toBe(true);
    const result = validateLiveCoachOutput(liveCoachOutputSchema.parse(baseOutput({
      cueType: "cta", cue: "Let's book the meeting anyway."
    })), context);
    expect(result).toEqual({ ok: false, reason: "first objection must clarify or diagnose" });
  });

  it("does not let approved wording conceal an additional invented claim", () => {
    const approved = { ...campaign, approved_claims: [{ id: "mapping", text: "We map the current workflow.", evidence: "Approved scope" }] };
    expect(cueClaimsApproved("We map the current workflow. Is that useful?", approved)).toBe(true);
    expect(cueClaimsApproved("We map the current workflow. You get guaranteed 50% savings.", approved)).toBe(false);
    const priced = { ...campaign, approved_claims: [{ id: "price", text: "The assessment costs $500.", evidence: "Approved price" }] };
    expect(cueClaimsApproved("The assessment costs $500. Would you like the scope?", priced)).toBe(true);
    expect(cueClaimsApproved("The assessment costs $500. Then you save $5000.", priced)).toBe(false);
  });
});
