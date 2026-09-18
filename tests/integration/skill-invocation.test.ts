import { describe, expect, it } from "vitest";
import { listAgentSkills, type AgentName } from "../../src/server/agents/loader.js";
import { interviewCampaignTurn } from "../../src/server/campaigns/interview.js";
import { generateCampaign } from "../../src/server/campaigns/generate.js";
import { interviewReviewTurn } from "../../src/server/review/interview.js";
import { applyTransportStatus } from "../../src/server/calls/ledger.js";
import { toPublicLead } from "../../src/server/leads/nextLead.js";
import { insertUtterance } from "../../src/server/transcript/utterances.js";
import type { PublicProposal } from "../../src/shared/contracts.js";
import { startConnectedCall } from "../helpers/call.js";
import { coachOutput, postCallOutput } from "../helpers/llm.js";
import { offering, strategy, interviewTurn, prospectBrief } from "../helpers/campaigns.js";

describe("selected skill invocation in the application", () => {
  it("delivers each role's full selected procedure to the LLM through its real service path", async () => {
    // All services use synthetic data, an in-memory database/Sheet and a fake
    // LLM. This checks transport of instructions, not model judgment.
    const call = await startConnectedCall({ media: false });
    const { app, ctx, llm, sessionId, cookie } = call;
    const invoked: AgentName[] = [];
    function checkLastRequest(agent: AgentName) {
      const packs = listAgentSkills(agent);
      expect(packs).toHaveLength(1);
      const request = llm.calls.at(-1)!;
      expect(request.system).toContain(packs[0]!.cheatsheet);
      expect(request.system).toContain(`### ${packs[0]!.name}`);
      expect(request.system).not.toContain("{{SCHEMA}}");
      invoked.push(agent);
    }
    try {
      const brief = offering();
      llm.enqueueJson(interviewTurn(brief));
      await interviewCampaignTurn(llm, [{ role: "user", content: "Use this approved invoice-workflow offering." }], 1000);
      checkLastRequest("campaign-interview");

      llm.enqueueJson(strategy());
      const campaign = await generateCampaign(llm, brief, 1000);
      ctx.campaignStore.save(campaign);
      checkLastRequest("campaign-generation");

      llm.enqueueJson(prospectBrief(false));
      const lead = await ctx.adapter!.findLeadById("L-100");
      expect(lead).not.toBeNull();
      await ctx.preparation.prepare(campaign, toPublicLead(lead!));
      checkLastRequest("prospect-research");

      insertUtterance(ctx.db, {
        sessionId, speaker: "contact", text: "We currently verify user-facing behavior by hand every week.",
        startMs: 0, endMs: 1000, confidence: 0.99
      });
      llm.enqueueJson(coachOutput());
      await ctx.coachEngine.chat(sessionId, "Help me ask about the workflow.");
      checkLastRequest("live-coach");

      applyTransportStatus(ctx.db, sessionId, "completed");
      llm.enqueueJson(postCallOutput());
      const finalized = await app.inject({
        method: "POST", url: `/api/calls/${sessionId}/finalize`, headers: { cookie }
      });
      expect(finalized.statusCode, finalized.body).toBe(200);
      checkLastRequest("post-call");

      llm.enqueueJson({ message: "The update is pending review.", action: "none" });
      await interviewReviewTurn(llm, [{ role: "user", content: "Explain this proposal; do not write it." }], finalized.json() as PublicProposal, 1000);
      checkLastRequest("call-review");
      expect(llm.calls).toHaveLength(6);
      expect(new Set(invoked).size).toBe(6);
    } finally {
      await app.close();
    }
  });
});
