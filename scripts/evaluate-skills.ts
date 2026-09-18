// Explicit, bounded model rehearsal with synthetic fixtures. Does not invoke
// Twilio, web research, a database, a Sheet, or a calendar action.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { AGENT_NAMES, agentPromptFingerprint, renderAgentSystem, validateAgentSkills, type AgentName } from "../src/server/agents/loader.js";
import { loadEnv } from "../src/server/env.js";
import { createLlmClient } from "../src/server/llm/client.js";
import { LlmError } from "../src/server/llm/errors.js";
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
const fixtureSchema = z.object({ cases: z.array(z.object({
  id: z.string().min(1), agent: z.enum(AGENT_NAMES), input: z.unknown()
})).min(1).max(30) });

async function main() {
  const [flag, inputPath, outputPath, ...extra] = process.argv.slice(2);
  if (flag !== "--live" || !inputPath || !outputPath || extra.length) {
    throw new Error("Usage: npm run skills:eval -- --live <synthetic-cases.json> <output.json>. This calls the configured model and may incur usage charges.");
  }
  if (resolve(inputPath) === resolve(outputPath)) throw new Error("Choose a separate output file; fixtures must remain unchanged.");
  const fixtureText = readFileSync(inputPath, "utf8");
  const fixtures = fixtureSchema.parse(JSON.parse(fixtureText));
  if (new Set(fixtures.cases.map(item => item.id)).size !== fixtures.cases.length) throw new Error("Case IDs must be unique.");
  const skills = validateAgentSkills();
  const env = loadEnv(process.env.AI_ENV_FILE || ".env");
  const llm = createLlmClient(env);
  if (!llm) throw new Error("The model is not configured. Set the application LLM connection first.");
  const results: Array<Record<string, unknown>> = [];
  const report = {
    method: "Configured-model synthetic rehearsal through the real agent loader; no call, CRM, calendar or web-research actions. Acceptance checks are not sent to the model.",
    model: env.LLM_MODEL, apiMode: env.LLM_API_MODE,
    fixtureHash: createHash("sha256").update(fixtureText).digest("hex"),
    generatedAt: new Date().toISOString(), skills, cases: results
  };
  mkdirSync(dirname(resolve(outputPath)), { recursive: true });
  for (const item of fixtures.cases) {
    const schema = schemas[item.agent];
    const schemaLine = JSON.stringify(z.toJSONSchema(schema));
    const system = renderAgentSystem(item.agent, schemaLine);
    const fingerprint = agentPromptFingerprint(item.agent, schemaLine);
    const start = Date.now();
    let entry: Record<string, unknown>;
    try {
      const raw = await llm.completeJson({ system, user: JSON.stringify(item.input), timeoutMs: 60000 });
      let output: unknown;
      try { output = JSON.parse(raw); } catch { output = raw; }
      const parsed = schema.safeParse(output);
      entry = {
        id: item.id, agent: item.agent, fingerprint, elapsedMs: Date.now() - start,
        schemaValid: parsed.success, output,
        ...(parsed.success ? { parsingChangedOutput: JSON.stringify(parsed.data) !== JSON.stringify(output) } : { issues: parsed.error.issues })
      };
    } catch (error) {
      entry = {
        id: item.id, agent: item.agent, fingerprint, elapsedMs: Date.now() - start,
        schemaValid: false,
        error: error instanceof LlmError ? { code: error.code, message: error.message } : { code: "evaluation_failed", message: "Evaluation could not complete." }
      };
    }
    results.push(entry);
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`${item.id}: ${entry.schemaValid ? "schema PASS" : "FAIL"}; ${entry.elapsedMs} ms. Behavioral review still required.`);
    // Repeated auth/network failures will not be repaired by more scenarios.
    if (entry.error) break;
  }
  const passed = results.filter(item => item.schemaValid).length;
  console.log(`${passed}/${fixtures.cases.length} schema-valid outputs. Saved ${outputPath}. This is not a conversion or live-call performance test.`);
  if (passed !== fixtures.cases.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error instanceof Error && !(error instanceof z.ZodError) ? error.message : "Invalid evaluation fixtures or application configuration.");
  process.exitCode = 1;
});
