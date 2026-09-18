import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

// Eve-framework agents live in reviewable directories at the repo root:
// agents/<name>/agent.ts, instructions.md, and optional skills/<pack>/SKILL.md.
// The local runner keeps the existing OpenAI-compatible LLM transport.
const AGENTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "agents");

export const AGENT_NAMES = [
  "campaign-interview", "campaign-generation", "prospect-research",
  "live-coach", "post-call", "call-review"
] as const;
export type AgentName = typeof AGENT_NAMES[number];

const SCHEMA_SLOT = "{{SCHEMA}}";

type SkillPack = {
  name: string;
  description: string;
  version?: string;
  cheatsheet: string | null;
};

function parseFrontmatter(raw: string): { name?: string; description?: string; version?: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const yamlBlock = match?.[1];
  if (!yamlBlock) return {};
  const parsed = parseYaml(yamlBlock);
  if (!parsed || typeof parsed !== "object") return {};
  const record = parsed as Record<string, unknown>;
  const metadata = record.metadata && typeof record.metadata === "object"
    ? record.metadata as Record<string, unknown>
    : {};
  return {
    name: typeof record.name === "string" ? record.name.trim() : undefined,
    description: typeof record.description === "string" ? record.description.trim() : undefined,
    version: typeof metadata.version === "string" ? metadata.version.trim() : undefined
  };
}

function activeSkillNames(agentDir: string): string[] | null {
  const manifestPath = join(agentDir, "skills.json");
  if (!existsSync(manifestPath)) return null;
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  const active = manifest && typeof manifest === "object" && "active" in manifest ? manifest.active : null;
  if (!Array.isArray(active) || active.some(name => typeof name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) ||
    new Set(active).size !== active.length) {
    throw new Error(`Invalid agent skill selection in ${manifestPath}. Expected unique skill directory names in active.`);
  }
  return active;
}

export function listAgentSkills(name: AgentName, agentsDir = AGENTS_DIR): SkillPack[] {
  const agentDir = join(agentsDir, name);
  const skillsDir = join(agentDir, "skills");
  const selected = activeSkillNames(agentDir);
  const names = selected ?? (existsSync(skillsDir)
    ? readdirSync(skillsDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)
    : []);
  return names
    .map((skillName) => {
      const packDir = join(skillsDir, skillName);
      const skillPath = join(packDir, "SKILL.md");
      if (!existsSync(skillPath)) {
        if (selected) throw new Error(`Agent ${name} selected missing skill ${skillName}: SKILL.md is required.`);
        return null;
      }
      const meta = parseFrontmatter(readFileSync(skillPath, "utf8"));
      const cheatsheetPath = join(packDir, "cheatsheet.md");
      const cheatsheet = existsSync(cheatsheetPath) ? readFileSync(cheatsheetPath, "utf8").trim() : null;
      if (selected && (meta.name !== skillName || !cheatsheet)) {
        throw new Error(`Agent ${name} selected incomplete skill ${skillName}: matching frontmatter name and nonempty cheatsheet.md are required.`);
      }
      return {
        name: meta.name || skillName,
        description: meta.description || `Instructions for the ${skillName} skill.`,
        ...(meta.version ? { version: meta.version } : {}),
        cheatsheet
      };
    })
    .filter((pack): pack is SkillPack => pack !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readInstructions(name: AgentName, agentsDir: string): string {
  const raw = readFileSync(join(agentsDir, name, "instructions.md"), "utf8").trim();
  if (!raw.includes(SCHEMA_SLOT)) {
    throw new Error(`Agent ${name} instructions are missing the ${SCHEMA_SLOT} slot.`);
  }
  return raw;
}

function renderSkills(name: AgentName, agentsDir: string): string {
  const packs = listAgentSkills(name, agentsDir);
  if (!packs.length) return "";
  const catalog = packs.map((pack) => `- ${pack.name}${pack.version ? ` (version ${pack.version})` : ""}: ${pack.description}`).join("\n");
  const loaded = packs
    .filter((pack) => pack.cheatsheet)
    .map((pack) => `### ${pack.name}\n${pack.cheatsheet}`)
    .join("\n\n");
  return `\n\nAvailable skills (loaded procedures below; never invent from unlisted books):\n${catalog}\n\nLoaded procedures:\n${loaded}`;
}

export function renderAgentSystem(name: AgentName, schemaLine: string, agentsDir = AGENTS_DIR): string {
  return `${readInstructions(name, agentsDir).replaceAll(SCHEMA_SLOT, schemaLine)}${renderSkills(name, agentsDir)}`;
}

export function agentPromptFingerprint(name: AgentName, schemaLine: string, agentsDir = AGENTS_DIR): string {
  return createHash("sha256").update(renderAgentSystem(name, schemaLine, agentsDir)).digest("hex");
}

/** Check the deployed six-role setup before a call can begin. */
export function validateAgentSkills(agentsDir = AGENTS_DIR) {
  return AGENT_NAMES.map(agent => {
    const selected = activeSkillNames(join(agentsDir, agent));
    if (!selected || selected.length !== 1) {
      throw new Error(`Agent ${agent} must select exactly one compiled skill in skills.json.`);
    }
    const [pack] = listAgentSkills(agent, agentsDir);
    if (!pack) throw new Error(`Agent ${agent} has no usable skill.`);
    readInstructions(agent, agentsDir);
    return {
      agent, skill: pack.name, version: pack.version ?? null,
      procedureChars: pack.cheatsheet!.length
    };
  });
}
