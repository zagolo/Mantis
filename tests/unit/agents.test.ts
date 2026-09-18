import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { agentPromptFingerprint, listAgentSkills, renderAgentSystem, validateAgentSkills, type AgentName } from "../../src/server/agents/loader.js";
import liveCoachAgent from "../../agents/live-coach/agent.js";
import postCallAgent from "../../agents/post-call/agent.js";
import campaignAgent from "../../agents/campaign-generation/agent.js";
import interviewAgent from "../../agents/campaign-interview/agent.js";
import researchAgent from "../../agents/prospect-research/agent.js";
import reviewAgent from "../../agents/call-review/agent.js";
import { liveCoachOutputSchema } from "../../src/server/coach/schema.js";
import { postCallOutcomeSchema, reviewInterviewTurnSchema } from "../../src/shared/schemas.js";
import { campaignInterviewTurnSchema, campaignStrategySchema, prospectBriefSchema } from "../../src/shared/campaigns.js";

const agents: AgentName[] = ["live-coach", "post-call", "campaign-generation", "campaign-interview", "prospect-research", "call-review"];

const skillMap: Record<AgentName, string[]> = {
  "live-coach": ["live-cold-call-coach"],
  "post-call": ["mantis-post-call-evidence"],
  "campaign-generation": ["mantis-campaign-strategy"],
  "campaign-interview": ["mantis-campaign-intake"],
  "prospect-research": ["prospect-research-playbook"],
  "call-review": ["mantis-call-review"]
};

describe("eve agent instructions", () => {
  it("validates all deployed roles before startup", () => {
    expect(validateAgentSkills().map(row => [row.agent, row.skill]).sort())
      .toEqual(Object.entries(skillMap).map(([agent, names]) => [agent, names[0]]).sort());
  });
  it("renders every agent with its schema slotted in and no placeholder left", () => {
    for (const name of agents) {
      const system = renderAgentSystem(name, "SCHEMA-LINE");
      expect(system).toContain("SCHEMA-LINE");
      expect(system).not.toContain("{{SCHEMA}}");
      expect(system.length).toBeGreaterThan(200);
    }
  });

  it("keeps identity, stakes, and the output contract", () => {
    expect(renderAgentSystem("live-coach", "S")).toContain("in-ear coach");
    expect(renderAgentSystem("live-coach", "S")).toContain("400 characters");
    expect(renderAgentSystem("post-call", "S")).toContain("forensic CRM extractor");
    expect(renderAgentSystem("campaign-generation", "S")).toContain("campaign architect");
    expect(renderAgentSystem("campaign-interview", "S")).toContain("You do not generate strategy");
    expect(renderAgentSystem("prospect-research", "S")).toContain("pre-call strategist");
    expect(renderAgentSystem("prospect-research", "S")).toContain("one breath");
    expect(renderAgentSystem("prospect-research", "S")).toContain("lastTouch");
    expect(renderAgentSystem("live-coach", "S")).toContain("lastTouch");
    expect(renderAgentSystem("call-review", "S")).toContain("post-call review partner");
    for (const name of ["live-coach", "post-call"] as const) {
      expect(renderAgentSystem(name, "S")).toContain("Never invent customer names, results, prices, integrations, guarantees, or unapproved claims.");
    }
  });

  it("scopes skills to each agent and preloads cheatsheets without chapters or SKILL.md dumps", () => {
    for (const name of agents) {
      const packs = listAgentSkills(name).map((pack) => pack.name).sort();
      expect(packs).toEqual(skillMap[name]);
      const system = renderAgentSystem(name, "S");
      expect(system).not.toContain("chapters/");
      expect(system).not.toContain("This skill covers the book content only");
      expect(system).not.toContain("Covers Sobczak’s Smart Calling process only");
      if (packs.length) {
        expect(system).toContain("Available skills");
        expect(system).toContain("Loaded procedures");
        for (const pack of packs) expect(system).toContain(pack);
      } else {
        expect(system).not.toContain("Available skills");
      }
    }
    expect(renderAgentSystem("live-coach", "S")).not.toContain("### farrokh-cold-calling-sucks");
    expect(renderAgentSystem("live-coach", "S")).not.toContain("### blount-fanatical-prospecting");
    expect(renderAgentSystem("prospect-research", "S")).not.toContain("### sobczak-smart-calling");
    expect(renderAgentSystem("campaign-generation", "S")).not.toContain("farrokh-cold-calling-sucks");
    expect(renderAgentSystem("post-call", "S")).not.toContain("farrokh-cold-calling-sucks");
    expect(renderAgentSystem("campaign-interview", "S")).not.toContain("farrokh-cold-calling-sucks");
  });
});

describe("explicit agent skill selection", () => {
  const fixtureDirs: string[] = [];
  afterEach(() => {
    for (const dir of fixtureDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function fixture(active?: string[]) {
    const dir = mkdtempSync(join(tmpdir(), "sales-agent-skills-"));
    fixtureDirs.push(dir);
    const agentDir = join(dir, "prospect-research");
    mkdirSync(agentDir);
    writeFileSync(join(agentDir, "instructions.md"), "Research instructions. {{SCHEMA}}");
    if (active) writeFileSync(join(agentDir, "skills.json"), JSON.stringify({ active }));
    function addSkill(name: string, procedure: string, version = "1.0.0") {
      const packDir = join(agentDir, "skills", name);
      mkdirSync(packDir, { recursive: true });
      writeFileSync(join(packDir, "SKILL.md"), `---\nname: ${name}\ndescription: Evidence procedure\nmetadata:\n  version: "${version}"\n---\nReference body is not loaded.`);
      writeFileSync(join(packDir, "cheatsheet.md"), procedure);
      return packDir;
    }
    return { dir, agentDir, addSkill };
  }

  it("loads only the selected procedure while preserving inactive reference packs", () => {
    const { dir, addSkill } = fixture(["compiled-research"]);
    addSkill("compiled-research", "Separate facts from hypotheses.");
    addSkill("legacy-author", "Inactive legacy advice.");
    const system = renderAgentSystem("prospect-research", "S", dir);
    expect(system).toContain("Separate facts from hypotheses.");
    expect(system).not.toContain("Inactive legacy advice.");
    expect(system).not.toContain("Reference body is not loaded.");
    expect(listAgentSkills("prospect-research", dir).map(pack => pack.name)).toEqual(["compiled-research"]);
  });

  it("fails visibly for a missing selected skill or an empty runtime procedure", () => {
    const { dir, addSkill } = fixture(["compiled-research"]);
    expect(() => renderAgentSystem("prospect-research", "S", dir)).toThrow(/selected missing skill compiled-research/);
    addSkill("compiled-research", "  ");
    expect(() => renderAgentSystem("prospect-research", "S", dir)).toThrow(/nonempty cheatsheet/);
  });

  it("rejects incomplete deployment before startup instead of silently using no skills", () => {
    const { dir } = fixture();
    expect(() => validateAgentSkills(dir)).toThrow(/campaign-interview.*exactly one compiled skill/);
    const roleDir = join(dir, "campaign-interview");
    mkdirSync(roleDir);
    writeFileSync(join(roleDir, "skills.json"), JSON.stringify({ active: [] }));
    expect(() => validateAgentSkills(dir)).toThrow(/exactly one compiled skill/);
  });

  it("rejects invalid selection paths and keeps discovery for agents without a manifest", () => {
    const invalid = fixture(["../outside"]);
    expect(() => listAgentSkills("prospect-research", invalid.dir)).toThrow(/Invalid agent skill selection/);
    const fallback = fixture();
    fallback.addSkill("second-author", "Second procedure.");
    fallback.addSkill("first-author", "First procedure.");
    expect(listAgentSkills("prospect-research", fallback.dir).map(pack => pack.name)).toEqual(["first-author", "second-author"]);
  });

  it("changes the prompt fingerprint for deployed procedure, version, instruction, or schema changes only", () => {
    const { dir, agentDir, addSkill } = fixture(["compiled-research"]);
    addSkill("compiled-research", "Verify current responsibilities.");
    addSkill("legacy-author", "Old reference.");
    const fingerprint = (schema = "S") => agentPromptFingerprint("prospect-research", schema, dir);
    const initial = fingerprint();
    addSkill("legacy-author", "Revised reference.");
    expect(fingerprint()).toBe(initial);
    addSkill("compiled-research", "Verify current responsibilities and dates.");
    const procedureChanged = fingerprint();
    expect(procedureChanged).not.toBe(initial);
    addSkill("compiled-research", "Verify current responsibilities and dates.", "1.1.0");
    const versionChanged = fingerprint();
    expect(versionChanged).not.toBe(procedureChanged);
    writeFileSync(join(agentDir, "instructions.md"), "Revised instructions. {{SCHEMA}}");
    const instructionChanged = fingerprint();
    expect(instructionChanged).not.toBe(versionChanged);
    expect(fingerprint("NEW-SCHEMA")).not.toBe(instructionChanged);
  });
});

describe("eve agent definitions", () => {
  it("declares a description, model, and the exact output contract", () => {
    const cases = [
      { agent: liveCoachAgent, schema: liveCoachOutputSchema },
      { agent: postCallAgent, schema: postCallOutcomeSchema },
      { agent: campaignAgent, schema: campaignStrategySchema },
      { agent: interviewAgent, schema: campaignInterviewTurnSchema },
      { agent: researchAgent, schema: prospectBriefSchema },
      { agent: reviewAgent, schema: reviewInterviewTurnSchema }
    ];
    for (const { agent, schema } of cases) {
      expect(agent.description.length).toBeGreaterThan(10);
      expect(agent.model.length).toBeGreaterThan(0);
      expect(agent.outputSchema).toBe(schema);
      expect(() => z.toJSONSchema(schema)).not.toThrow();
    }
  });
});
