import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTransportStatus, getSession } from "../../src/server/calls/ledger.js";
import { listCoachingEvents } from "../../src/server/coach/store.js";
import { listCoachMessages } from "../../src/server/coach/messages.js";
import { listCalendarProposals } from "../../src/server/calendar/proposals.js";
import { expectedTwilioSignature } from "../../src/server/twilio/signature.js";
import {
  extractStreamToken,
  getAppContext,
  loginCookie,
  startTestApp,
  TEST_AUTH_TOKEN
} from "../helpers/app.js";
import { createFakeDeepgramFactory, type FakeDeepgramConnection } from "../helpers/deepgram.js";
import { coachOutput, FakeLlmClient } from "../helpers/llm.js";

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

describe("Live coaching", () => {
  afterEach(async () => {
    vi.useRealTimers();
  });

  async function startCall(llm: FakeLlmClient) {
    const fakes: FakeDeepgramConnection[] = [];
    const { app } = await startTestApp({}, { deepgramFactory: createFakeDeepgramFactory(fakes), llmClient: llm });
    const cookie = await loginCookie(app);
    const created = await app.inject({
      method: "POST",
      url: "/api/calls/sessions",
      headers: { cookie },
      payload: { leadId: "L-100", campaignId: "lamina-sales" }
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
    applyTransportStatus(ctx.db, sessionId, "in_progress");
    const socket = ctx.mediaHub.createSocket();
    socket.handle({
      event: "start",
      start: {
        tracks: ["inbound", "outbound"],
        customParameters: { streamToken: extractStreamToken(twiml.body), sessionId }
      }
    });
    const outbound = fakes.find((item) => item.speaker === "contact") ?? fakes[1];
    return { app, cookie, ctx, sessionId, outbound, socket };
  }

  it("shows a clarify cue for the first existing_solution objection and does not rebut", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(
      coachOutput({
        stage: "objection",
        cueType: "clarify",
        cue: "What does your current solution still miss?",
        detectedObjection: "existing_solution"
      })
    );
    const { app, cookie, sessionId, outbound } = await startCall(llm);
    outbound?.emitFinal("we already have an existing solution that covers this");
    await vi.waitFor(() => {
      expect(llm.calls.length).toBe(1);
    });
    const loaded = await app.inject({ method: "GET", url: `/api/calls/${sessionId}`, headers: { cookie } });
    const body = loaded.json() as {
      status: string;
      coach: { cue: { cueType: string; text: string } | null };
    };
    expect(body.status).toBe("in_progress");
    expect(body.coach.cue?.cueType).toBe("clarify");
    expect(body.coach.cue?.text).toMatch(/current solution/i);
    await app.close();
  });

  it("discards a stale slower response when a newer sequence arrives", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(coachOutput({ basedOnSequence: 1, cue: "Old cue from sequence one" }), 80);
    llm.enqueueJson(coachOutput({ basedOnSequence: 2, cue: "Ask about a recent incident." }));
    const { app, cookie, sessionId, outbound } = await startCall(llm);
    outbound?.emitFinal("we ship web apps every week");
    outbound?.emitFinal("last month a checkout bug reached customers");
    await vi.waitFor(() => {
      expect(llm.calls.length).toBe(2);
    });
    await vi.waitFor(async () => {
      const loaded = await app.inject({ method: "GET", url: `/api/calls/${sessionId}`, headers: { cookie } });
      const cue = (loaded.json() as { coach: { cue: { text: string; basedOnSequence: number } | null } }).coach.cue;
      expect(cue?.text).toBe("Ask about a recent incident.");
      expect(cue?.basedOnSequence).toBe(2);
    });
    await app.close();
  });

  it("produces no live cue on invalid model JSON and does not end the call", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueRaw("{not-json");
    const { app, cookie, ctx, sessionId, outbound } = await startCall(llm);
    outbound?.emitFinal("can you tell me more about what you do");
    await vi.waitFor(() => {
      expect(llm.calls.length).toBe(1);
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const loaded = await app.inject({ method: "GET", url: `/api/calls/${sessionId}`, headers: { cookie } });
    expect(loaded.json()).toMatchObject({ status: "in_progress", coach: { cue: null } });
    expect(listCoachingEvents(ctx.db, sessionId)).toHaveLength(0);
    expect(getSession(ctx.db, sessionId)?.status).toBe("in_progress");
    await app.close();
  });

  it("does not treat interim text as qualification evidence", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(
      coachOutput({
        qualificationUpdates: [
          { criterion: "relevant_problem", state: "yes", evidence: "only in the interim", confidence: 0.9 }
        ]
      })
    );
    const { app, cookie, sessionId, outbound } = await startCall(llm);
    outbound?.emitInterim("only in the interim");
    outbound?.emitFinal("we are just browsing options today");
    await vi.waitFor(() => {
      expect(llm.calls.length).toBe(1);
    });
    const loaded = await app.inject({ method: "GET", url: `/api/calls/${sessionId}`, headers: { cookie } });
    const qual = (
      loaded.json() as {
        coach: { qualification: Array<{ id: string; state: string }> };
      }
    ).coach.qualification;
    expect(qual.find((item) => item.id === "relevant_problem")?.state).toBe("unknown");
    await app.close();
  });

  it("appends coach turns and drops a stale slower response from the feed", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(coachOutput({ basedOnSequence: 1, cue: "How do you currently verify user-facing behavior?" }));
    llm.enqueueJson(coachOutput({ basedOnSequence: 2, cue: "What does a miss cost in a typical week?" }));
    const { app, cookie, ctx, sessionId, outbound } = await startCall(llm);
    outbound?.emitFinal("we currently verify user-facing behavior by hand");
    await vi.waitFor(() => {
      expect(listCoachMessages(ctx.db, sessionId).filter((item) => item.role === "assistant")).toHaveLength(1);
    });
    outbound?.emitFinal("the misses still hurt every week");
    await vi.waitFor(() => {
      expect(listCoachMessages(ctx.db, sessionId).filter((item) => item.role === "assistant")).toHaveLength(2);
    });
    const texts = listCoachMessages(ctx.db, sessionId)
      .filter((item) => item.role === "assistant")
      .map((item) => item.text);
    expect(texts).toEqual([
      "How do you currently verify user-facing behavior?",
      "What does a miss cost in a typical week?"
    ]);

    llm.enqueueJson(coachOutput({ basedOnSequence: 3, cue: "Old stale cue" }), 80);
    llm.enqueueJson(coachOutput({ basedOnSequence: 4, cue: "Ask about timing this quarter." }));
    outbound?.emitFinal("we ship weekly");
    outbound?.emitFinal("next quarter is already planned");
    await vi.waitFor(() => {
      expect(llm.calls.length).toBe(4);
    });
    await vi.waitFor(() => {
      const assistant = listCoachMessages(ctx.db, sessionId).filter((item) => item.role === "assistant").map((item) => item.text);
      expect(assistant).toContain("Ask about timing this quarter.");
      expect(assistant).not.toContain("Old stale cue");
    });
    const loaded = await app.inject({ method: "GET", url: `/api/calls/${sessionId}`, headers: { cookie } });
    expect((loaded.json() as { coachMessages: Array<{ text: string }> }).coachMessages.map((item) => item.text)).not.toContain(
      "Old stale cue"
    );
    await app.close();
  });

  it("runs an operator composer turn without the transcript rate limit", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(coachOutput({ cue: "Offer Thursday at 2pm and wait." }));
    const { app, cookie, sessionId } = await startCall(llm);
    const chat = await app.inject({
      method: "POST",
      url: `/api/calls/${sessionId}/coach/chat`,
      headers: { cookie },
      payload: { text: "offer Thursday 2pm" }
    });
    expect(chat.statusCode, chat.body).toBe(200);
    const body = chat.json() as { coachMessages: Array<{ role: string; text: string }> };
    expect(body.coachMessages.some((item) => item.role === "user" && item.text === "offer Thursday 2pm")).toBe(true);
    expect(body.coachMessages.some((item) => item.role === "assistant" && /Thursday/i.test(item.text))).toBe(true);
    expect(llm.calls.length).toBe(1);
    await app.close();
  });

  it("keeps DNC terminal across pending model output, later contact speech, and operator chat", async () => {
    const llm = new FakeLlmClient();
    let finish!: (value: string) => void;
    const pendingOutput = new Promise<string>((resolve) => { finish = resolve; });
    const complete = vi.spyOn(llm, "completeJson").mockReturnValueOnce(pendingOutput);
    const { app, cookie, ctx, sessionId, outbound } = await startCall(llm);
    try {
      const pendingChat = ctx.coachEngine.chat(sessionId, "Help me choose the next question.");
      await vi.waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
      outbound?.emitFinal("Please stop calling me.");
      await vi.waitFor(() => expect(ctx.coachEngine.getSnapshot(sessionId)?.recommendedOutcome).toBe("do_not_contact"));
      const closed = ctx.coachEngine.getSnapshot(sessionId);

      outbound?.emitFinal("Thank you, goodbye.");
      const laterChat = await app.inject({
        method: "POST",
        url: `/api/calls/${sessionId}/coach/chat`,
        headers: { cookie },
        payload: { text: "Can we ask one more question?" }
      });
      expect(laterChat.statusCode).toBe(200);
      expect(complete).toHaveBeenCalledTimes(1);

      finish(JSON.stringify(coachOutput({
        stage: "cta",
        cue: "Ask for a meeting.",
        calendarProposal: {
          intent: "meeting",
          title: "Late model draft",
          start: "2026-10-01T10:00:00Z",
          end: "2026-10-01T10:30:00Z",
          timezone: "UTC"
        }
      })));
      await pendingChat;

      const snapshot = ctx.coachEngine.getSnapshot(sessionId);
      expect(snapshot).toMatchObject({ stage: "closed", recommendedOutcome: "do_not_contact", cue: closed?.cue });
      expect(listCoachingEvents(ctx.db, sessionId)).toHaveLength(1);
      expect(listCalendarProposals(ctx.db, sessionId)).toHaveLength(0);
      expect(listCoachMessages(ctx.db, sessionId).filter((message) => message.role === "assistant").map((message) => message.text))
        .toEqual([closed!.cue!.text]);
    } finally {
      finish(JSON.stringify(coachOutput()));
      await app.close();
    }
  });

  it("does not dispatch a model request after DNC arrives during calendar availability", async () => {
    const llm = new FakeLlmClient();
    const { app, ctx, sessionId, outbound } = await startCall(llm);
    let finishAvailability!: () => void;
    const pendingAvailability = new Promise<[]>((resolve) => { finishAvailability = () => resolve([]); });
    vi.spyOn(ctx.calendar, "status").mockReturnValue({ configured: true, connected: true, email: "operator@test.local" });
    const availability = vi.spyOn(ctx.calendar, "getAvailability").mockReturnValueOnce(pendingAvailability);
    try {
      const pendingChat = ctx.coachEngine.chat(sessionId, "Help me plan the next step.");
      await vi.waitFor(() => expect(availability).toHaveBeenCalledTimes(1));
      outbound?.emitFinal("Do not contact me again.");
      finishAvailability();
      await pendingChat;
      expect(llm.calls).toHaveLength(0);
      expect(ctx.coachEngine.getSnapshot(sessionId)).toMatchObject({ stage: "closed", recommendedOutcome: "do_not_contact" });
    } finally {
      finishAvailability();
      await app.close();
    }
  });

  it("normalizes a model-detected DNC into a closing cue without a calendar draft", async () => {
    const llm = new FakeLlmClient();
    llm.enqueueJson(coachOutput({
      stage: "objection",
      cueType: "warning",
      cue: "Ask one more question.",
      detectedObjection: "do_not_contact",
      calendarProposal: {
        intent: "callback",
        start: "2026-10-01T10:00:00Z",
        end: "2026-10-01T10:15:00Z",
        timezone: "UTC"
      }
    }));
    const { app, ctx, sessionId, outbound } = await startCall(llm);
    try {
      outbound?.emitFinal("Lose my number.");
      await vi.waitFor(() => expect(ctx.coachEngine.getSnapshot(sessionId)?.recommendedOutcome).toBe("do_not_contact"));
      expect(ctx.coachEngine.getSnapshot(sessionId)).toMatchObject({ stage: "closed", cue: { cueType: "warning" } });
      expect(ctx.coachEngine.getSnapshot(sessionId)?.cue?.text).toMatch(/end respectfully/);
      expect(listCalendarProposals(ctx.db, sessionId)).toHaveLength(0);
      await ctx.coachEngine.chat(sessionId, "Can I ask something else?");
      expect(llm.calls).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it.each(["stopped", "disconnected"] as const)("drops pending output when %s without changing the outcome to DNC", async (state) => {
    const llm = new FakeLlmClient();
    let finish!: (value: string) => void;
    const pendingOutput = new Promise<string>((resolve) => { finish = resolve; });
    const complete = vi.spyOn(llm, "completeJson").mockReturnValueOnce(pendingOutput);
    const { app, ctx, sessionId } = await startCall(llm);
    try {
      const pendingChat = ctx.coachEngine.chat(sessionId, "Help me ask about the workflow.");
      await vi.waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
      if (state === "stopped") ctx.coachEngine.stop(sessionId);
      else applyTransportStatus(ctx.db, sessionId, "completed");
      finish(JSON.stringify(coachOutput({ cue: "A late cue that should not appear." })));
      await pendingChat;
      expect(listCoachingEvents(ctx.db, sessionId)).toHaveLength(0);
      expect(ctx.coachEngine.getSnapshot(sessionId)).toMatchObject({ cue: null, recommendedOutcome: "unknown" });
    } finally {
      finish(JSON.stringify(coachOutput()));
      await app.close();
    }
  });
});
