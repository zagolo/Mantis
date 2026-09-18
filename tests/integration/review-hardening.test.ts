import { describe, expect, it } from "vitest";
import { applyTransportStatus } from "../../src/server/calls/ledger.js";
import { insertUtterance } from "../../src/server/transcript/utterances.js";
import { EXAMPLE_HEADERS } from "../../src/server/sheets/fixture.js";
import { MemorySheetStore } from "../../src/server/sheets/memory.js";
import { expectedTwilioSignature } from "../../src/server/twilio/signature.js";
import { getProposal, markProposalRetry } from "../../src/server/review/store.js";
import {
  extractStreamToken,
  getAppContext,
  loginCookie,
  startTestApp,
  TEST_AUTH_TOKEN
} from "../helpers/app.js";
import { createFakeDeepgramFactory, type FakeDeepgramConnection } from "../helpers/deepgram.js";
import { FakeLlmClient, postCallOutput } from "../helpers/llm.js";
import type { PublicProposal } from "../../src/shared/contracts.js";

function signedForm(path: string, params: Record<string, string>) {
  const url = `http://127.0.0.1:3000${path}`;
  return {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-twilio-signature": expectedTwilioSignature(TEST_AUTH_TOKEN, url, params)
    },
    payload: new URLSearchParams(params).toString()
  };
}

describe("Post-call CRM hardening", () => {
  async function startSession(llm: FakeLlmClient, leadId = "L-100") {
    const fakes: FakeDeepgramConnection[] = [];
    const { app } = await startTestApp({}, { deepgramFactory: createFakeDeepgramFactory(fakes), llmClient: llm });
    const cookie = await loginCookie(app);
    const created = await app.inject({
      method: "POST",
      url: "/api/calls/sessions",
      headers: { cookie },
      payload: { leadId, campaignId: "lamina-sales" }
    });
    expect(created.statusCode).toBe(201);
    const sessionId = (created.json() as { id: string }).id;
    const twiml = await app.inject({
      method: "POST",
      url: "/twilio/voice/outbound",
      ...signedForm("/twilio/voice/outbound", {
        sessionId,
        CallSid: `CA${sessionId.slice(0, 8)}`,
        CallStatus: "queued"
      })
    });
    const ctx = getAppContext(app);
    const socket = ctx.mediaHub.createSocket();
    socket.handle({
      event: "start",
      start: {
        tracks: ["inbound", "outbound"],
        customParameters: { streamToken: extractStreamToken(twiml.body), sessionId }
      }
    });
    return { app, cookie, ctx, sessionId };
  }

  function connectSession(ctx: ReturnType<typeof getAppContext>, sessionId: string) {
    applyTransportStatus(ctx.db, sessionId, "in_progress");
    applyTransportStatus(ctx.db, sessionId, "completed");
    insertUtterance(ctx.db, {
      sessionId,
      speaker: "contact",
      text: "we currently verify user-facing behavior by hand every week",
      startMs: 0,
      endMs: 1200,
      confidence: 0.9
    });
  }

  it("keeps the extraction when one criterion lacks grounded evidence instead of discarding everything", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(
      postCallOutput({
        criteria: {
          relevant_problem: { state: "yes", evidence: "verify user-facing behavior by hand", confidence: 0.8 },
          meaningful_cost: { state: "yes", evidence: "operates five hundred doors on AppFolio", confidence: 0.9 },
          influence: { state: "unknown", evidence: null, confidence: 0 },
          timing: { state: "unknown", evidence: null, confidence: 0 }
        }
      })
    );
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    connectSession(ctx, sessionId);
    const finalized = await app.inject({
      method: "POST",
      url: `/api/calls/${sessionId}/finalize`,
      headers: { cookie }
    });
    expect(finalized.statusCode).toBe(200);
    const proposal = finalized.json() as {
      semanticOutcome: string;
      summary: string;
      warnings: string[];
      criteria: Array<{ id: string; state: string }>;
    };
    // Regression: this used to come back as conversation_incomplete with
    // "Post-call extraction was skipped or failed." because the whole LLM
    // outcome was discarded over one ungrounded criterion.
    expect(proposal.semanticOutcome).toBe("permission_to_follow_up");
    expect(proposal.summary).toContain("manual verification");
    expect(proposal.criteria.find((c) => c.id === "relevant_problem")?.state).toBe("yes");
    expect(proposal.criteria.find((c) => c.id === "meaningful_cost")?.state).toBe("unknown");
    expect(proposal.warnings.join(" ")).toMatch(/reset to unknown|grounded/i);
    await app.close();
  });

  it("does not turn caller opt-out wording into a contact do-not-contact request", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(postCallOutput());
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    try {
      connectSession(ctx, sessionId);
      insertUtterance(ctx.db, {
        sessionId,
        speaker: "caller",
        text: "You can ask us to stop calling at any time.",
        startMs: 1300,
        endMs: 1800,
        confidence: 1
      });
      const finalized = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/finalize`,
        headers: { cookie }
      });
      expect(finalized.statusCode).toBe(200);
      const proposal = finalized.json() as PublicProposal;
      expect(llm.calls).toHaveLength(1);
      expect(proposal.semanticOutcome).toBe("permission_to_follow_up");
      expect(proposal.proposedFields.call_status).toBe("Completed");
    } finally {
      await app.close();
    }
  });

  it.each(["connected", "non_connect"] as const)("limits approve edits for a %s proposal to its review fields", async (kind) => {
    const llm = new FakeLlmClient();
    if (kind === "connected") llm.enqueueJson(postCallOutput());
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    try {
      if (kind === "connected") connectSession(ctx, sessionId);
      else applyTransportStatus(ctx.db, sessionId, "no-answer");
      const finalized = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/finalize`,
        headers: { cookie }
      });
      expect(finalized.statusCode).toBe(200);
      const before = finalized.json() as PublicProposal;
      const approved = await app.inject({
        method: "POST",
        url: `/api/proposals/${before.id}/approve`,
        headers: { cookie },
        payload: { fields: {
          call_status: kind === "connected" ? "Completed" : "Retry",
          call_attempts: "999",
          last_called_at: "2001-01-01T00:00:00.000Z",
          twilio_call_sid: "CAforged",
          recording_sid: "REforged",
          qualification: "defer",
          next_step: "Operator chose a Tuesday callback",
          call_summary: "Operator corrected summary"
        } }
      });
      expect(approved.statusCode).toBe(200);
      const after = (approved.json() as { proposal: PublicProposal }).proposal;
      expect(after.status).toBe("applied");
      const store = ctx.adapter?.store as MemorySheetStore;
      const row = (await store.getDataRows()).find((item) => item.values[0] === "L-100");
      for (const key of ["call_attempts", "last_called_at", "twilio_call_sid", "recording_sid"] as const) {
        expect(after.proposedFields[key]).toBe(before.proposedFields[key]);
        expect(row?.values[EXAMPLE_HEADERS.indexOf(ctx.sheetsConfig!.write_columns[key])]).toBe(before.proposedFields[key]);
      }
      if (kind === "connected") {
        expect(after.nextStep).toBe("Operator chose a Tuesday callback");
        expect(after.summary).toBe("Operator corrected summary");
        expect(after.qualification).toBe("defer");
      } else {
        for (const key of ["qualification", "next_step", "call_summary"] as const) {
          expect(after.proposedFields[key]).toBe(before.proposedFields[key]);
          expect(row?.values[EXAMPLE_HEADERS.indexOf(ctx.sheetsConfig!.write_columns[key])]).toBe(before.proposedFields[key]);
        }
      }
    } finally {
      await app.close();
    }
  });

  it.each(["direct", "chat"] as const)("rejects a connected-call skip through the %s route without writing", async (route) => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(postCallOutput());
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    try {
      connectSession(ctx, sessionId);
      const finalized = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/finalize`,
        headers: { cookie }
      });
      const proposal = finalized.json() as PublicProposal;
      const before = getProposal(ctx.db, proposal.id)!;
      const store = ctx.adapter?.store as MemorySheetStore;
      const writesBefore = store.writeCount;
      const skipped = route === "direct"
        ? await app.inject({ method: "POST", url: `/api/proposals/${proposal.id}/skip`, headers: { cookie } })
        : await app.inject({
            method: "POST",
            url: `/api/calls/${sessionId}/review/interview`,
            headers: { cookie },
            payload: { messages: [{ role: "user", content: "skip" }] }
          });
      expect(skipped.statusCode).toBe(400);
      expect(skipped.json().error).toMatch(/non-connect/i);
      expect(store.writeCount).toBe(writesBefore);
      expect(getProposal(ctx.db, proposal.id)?.status).toBe("pending_review");
      expect(getProposal(ctx.db, proposal.id)?.proposed_json).toBe(before.proposed_json);
    } finally {
      await app.close();
    }
  });

  it("still allows skipping a non-connect proposal", async () => {
    const llm = new FakeLlmClient();
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    try {
      applyTransportStatus(ctx.db, sessionId, "no-answer");
      const finalized = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/finalize`,
        headers: { cookie }
      });
      const proposal = finalized.json() as PublicProposal;
      const skipped = await app.inject({
        method: "POST",
        url: `/api/proposals/${proposal.id}/skip`,
        headers: { cookie }
      });
      expect(skipped.statusCode).toBe(200);
      const after = (skipped.json() as { proposal: PublicProposal }).proposal;
      expect(after.status).toBe("applied");
      expect(after.proposedFields.call_status).toBe("Skipped");
      expect(after.proposedFields.call_summary).toBe(proposal.proposedFields.call_summary);
      expect(llm.calls).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  it.each([
    { action: "approve", kind: "connected", question: "Explain this proposal.", command: "Write this update", status: "pending_review" },
    { action: "retry_write", kind: "connected", question: "Did the Sheet update? Also remind me Wednesday afternoon to call them.", command: "Retry write", status: "pending_retry" },
    { action: "skip", kind: "non_connect", question: "What would skipping this contact do?", command: "Skip this contact", status: "pending_review" }
  ] as const)("blocks provider-origin $action until the operator sends its explicit command", async ({ action, kind, question, command, status }) => {
    const llm = new FakeLlmClient();
    if (kind === "connected") llm.enqueueJson(postCallOutput());
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    try {
      if (kind === "connected") connectSession(ctx, sessionId);
      else applyTransportStatus(ctx.db, sessionId, "no-answer");
      const finalized = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/finalize`,
        headers: { cookie }
      });
      const proposal = finalized.json() as PublicProposal;
      if (status === "pending_retry") markProposalRetry(ctx.db, proposal.id, "Sheet write failed: rate limit");
      const before = getProposal(ctx.db, proposal.id)!;
      const store = ctx.adapter?.store as MemorySheetStore;
      const writesBefore = store.writeCount;
      llm.enqueueJson({ message: "The Sheet was written successfully.", action });
      const suggested = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/review/interview`,
        headers: { cookie },
        payload: { messages: [{ role: "user", content: question }] }
      });
      expect(suggested.statusCode, suggested.body).toBe(200);
      expect(suggested.json()).toMatchObject({ wrote: false, leftReview: false, proposal: { status } });
      expect(suggested.json().text).toContain(command);
      expect(suggested.json().text).not.toContain("written successfully");
      expect(store.writeCount).toBe(writesBefore);
      expect(getProposal(ctx.db, proposal.id)?.proposed_json).toBe(before.proposed_json);

      const modelCalls = llm.calls.length;
      const confirmed = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/review/interview`,
        headers: { cookie },
        payload: { messages: [{ role: "user", content: command }] }
      });
      expect(confirmed.statusCode, confirmed.body).toBe(200);
      expect(confirmed.json()).toMatchObject({ wrote: true, leftReview: true, proposal: { status: "applied" } });
      expect(store.writeCount).toBe(writesBefore + 1);
      expect(llm.calls).toHaveLength(modelCalls);
      if (action === "skip") expect(confirmed.json().proposal.proposedFields.call_status).toBe("Skipped");
    } finally {
      await app.close();
    }
  });

  it("still returns a requested calendar draft without writing the Sheet", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(postCallOutput());
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    try {
      connectSession(ctx, sessionId);
      await app.inject({ method: "POST", url: `/api/calls/${sessionId}/finalize`, headers: { cookie } });
      const store = ctx.adapter?.store as MemorySheetStore;
      const writesBefore = store.writeCount;
      llm.enqueueJson({
        message: "Here is the reminder draft for your approval.",
        action: "none",
        calendarProposal: {
          intent: "reminder",
          title: "Review the outline",
          start: "2026-10-01T14:00:00Z",
          end: "2026-10-01T14:15:00Z",
          timezone: "UTC",
          attendees: [],
          meet: false
        }
      });
      const drafted = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/review/interview`,
        headers: { cookie },
        payload: { messages: [{ role: "user", content: "Remind me to review the outline on October 1, 2026 at 14:00 UTC for 15 minutes. Do not write the Sheet." }] }
      });
      expect(drafted.statusCode, drafted.body).toBe(200);
      expect(drafted.json()).toMatchObject({
        wrote: false,
        leftReview: false,
        proposal: { status: "pending_review" },
        calendarProposal: { intent: "reminder", status: "pending" }
      });
      expect(store.writeCount).toBe(writesBefore);
    } finally {
      await app.close();
    }
  });

  it("preserves operator edits across a failed Sheet write and applies them on retry", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(
      postCallOutput({
        criteria: {
          relevant_problem: { state: "yes", evidence: "verify user-facing behavior by hand", confidence: 0.8 },
          meaningful_cost: { state: "unknown", evidence: null, confidence: 0 },
          influence: { state: "unknown", evidence: null, confidence: 0 },
          timing: { state: "unknown", evidence: null, confidence: 0 }
        }
      })
    );
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    connectSession(ctx, sessionId);
    const store = ctx.adapter?.store as MemorySheetStore;
    const original = store.batchUpdate.bind(store);
    store.batchUpdate = async () => {
      const error = new Error("Sheets API 503 Service Unavailable") as Error & { code?: number };
      error.code = 503;
      throw error;
    };
    const finalized = await app.inject({
      method: "POST",
      url: `/api/calls/${sessionId}/finalize`,
      headers: { cookie }
    });
    const proposal = finalized.json() as { id: string };
    const failed = await app.inject({
      method: "POST",
      url: `/api/proposals/${proposal.id}/approve`,
      headers: { cookie },
      payload: { fields: { call_summary: "Operator edited summary", next_step: "Call back Tuesday" } }
    });
    expect(failed.statusCode).toBe(200);
    expect((failed.json() as { proposal: { status: string } }).proposal.status).toBe("pending_retry");
    // Regression: edits used to live only in memory and were lost on retry.
    const stored = getProposal(ctx.db, proposal.id);
    expect(stored).not.toBeNull();
    expect(stored!.proposed_json).toContain("Operator edited summary");
    store.batchUpdate = original;
    const retried = await app.inject({
      method: "POST",
      url: `/api/proposals/${proposal.id}/retry-write`,
      headers: { cookie }
    });
    expect(retried.statusCode).toBe(200);
    expect((retried.json() as { proposal: { status: string } }).proposal.status).toBe("applied");
    const rows = await store.getDataRows();
    const row = rows.find((item) => item.values[0] === "L-100");
    expect(row?.values[EXAMPLE_HEADERS.indexOf("Call Summary")]).toBe("Operator edited summary");
    expect(row?.values[EXAMPLE_HEADERS.indexOf("Next Step")]).toBe("Call back Tuesday");
    await app.close();
  });

  it("retries transient Sheet failures instead of failing the CRM update", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(postCallOutput());
    const { app, cookie, ctx, sessionId } = await startSession(llm);
    connectSession(ctx, sessionId);
    const store = ctx.adapter?.store as MemorySheetStore;
    let attempts = 0;
    const original = store.batchUpdate.bind(store);
    store.batchUpdate = async (updates) => {
      attempts += 1;
      if (attempts <= 2) {
        const error = new Error("Sheets API 503 Service Unavailable") as Error & { code?: number };
        error.code = 503;
        throw error;
      }
      return original(updates);
    };
    const finalized = await app.inject({
      method: "POST",
      url: `/api/calls/${sessionId}/finalize`,
      headers: { cookie }
    });
    const proposal = finalized.json() as { id: string };
    const approved = await app.inject({
      method: "POST",
      url: `/api/proposals/${proposal.id}/approve`,
      headers: { cookie },
      payload: {}
    });
    expect(approved.statusCode).toBe(200);
    expect((approved.json() as { proposal: { status: string } }).proposal.status).toBe("applied");
    expect(attempts).toBe(3);
    await app.close();
  });
});
