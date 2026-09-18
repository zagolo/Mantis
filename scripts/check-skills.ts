// Offline deployment check. Does not read credentials or call a model.
import { z } from "zod";
import { agentPromptFingerprint, renderAgentSystem, validateAgentSkills, type AgentName } from "../src/server/agents/loader.js";
import { liveCoachOutputSchema } from "../src/server/coach/schema.js";
import { postCallOutcomeSchema, reviewInterviewTurnSchema } from "../src/shared/schemas.js";
import { campaignInterviewTurnSchema, campaignStrategySchema, prospectBriefSchema } from "../src/shared/campaigns.js";

const schemas: Record<AgentName, z.ZodType> = {
  "campaign-interview": campaignInterviewTurnSchema,
  "campaign-generation": campaignStrategySchema,
  "prospect-research": prospectBriefSchema,
  "live-coach": liveCoachOutputSchema,
  "post-call": postCallOutcomeSchema,
  "call-review": reviewInterviewTurnSchema
};

try {
  for (const row of validateAgentSkills()) {
    const schema = JSON.stringify(z.toJSONSchema(schemas[row.agent]));
    const prompt = renderAgentSystem(row.agent, schema);
    if (prompt.includes("{{SCHEMA}}")) throw new Error(`Unresolved schema in ${row.agent}`);
    console.log(`${row.agent}: ${row.skill} ${row.version ? `v${row.version}` : "(unversioned)"}; procedure ${row.procedureChars} chars; prompt ${agentPromptFingerprint(row.agent, schema).slice(0, 12)}`);
  }
  console.log("PASS: all six selected procedures render with their real output schemas. No model or external service was called.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Agent skill validation failed");
  process.exitCode = 1;
}
