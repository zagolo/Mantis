# Mantis agent skills

Each agent has its own output contract and one selected operational skill. The short `cheatsheet.md` is loaded on every model turn. `SKILL.md`, source notes, chapters and references support maintenance and deeper study; they are not automatically read by the production model.

| Agent | Selected skill | Responsibility | Source basis |
|---|---|---|---|
| campaign-interview | [mantis-campaign-intake](campaign-interview/skills/mantis-campaign-intake/SKILL.md) | Collect/update an offering brief | Brief schema and intake workflow |
| campaign-generation | [mantis-campaign-strategy](campaign-generation/skills/mantis-campaign-strategy/SKILL.md) | Turn the brief into an actionable campaign | Combined book methods and campaign schema |
| prospect-research | [prospect-research-playbook](prospect-research/skills/prospect-research-playbook/SKILL.md) | Evidence-backed relevance and a first question | Combined book/public-source methods |
| live-coach | [live-cold-call-coach](live-coach/skills/live-cold-call-coach/SKILL.md) | One useful next utterance or silence | Combined book/public-source methods |
| post-call | [mantis-post-call-evidence](post-call/skills/mantis-post-call-evidence/SKILL.md) | Transcript → factual outcome proposal | Evidence, outcome and qualification contracts |
| call-review | [mantis-call-review](call-review/skills/mantis-call-review/SKILL.md) | Operator corrections/approval → requested action | Field ownership, proposal state and action contracts |

The original author packs are retained in their existing locations as references. `skills.json` lists the active directory for each agent. The Mantis loader in `src/server/agents/loader.ts` honors this selection and rejects a missing pack, mismatched name or empty runtime procedure. The application validates exactly one selected pack per role at startup. Lower-level legacy directory discovery remains available to callers of the loader, but cannot silently substitute for missing application manifests.

Run `npm run skills:check` to verify the deployed procedures and actual output schemas without credentials or network access. All six service-to-model paths are exercised by `tests/integration/skill-invocation.test.ts`. Deep chapters are reference material; the app does not need filesystem-reading tools or a separate skill invocation API to use the selected runtime procedure.

**Ship the loader changes with the manifests.** Upstream at `f99777f` ignores manifests and would load both new and legacy packs. These manifests configure Mantis's local runner; they are not a claim about native `eve dev` skill selection.

## Maintaining a skill

1. Keep identity/output contract in `instructions.md` and reusable decisions in the selected `cheatsheet.md`.
2. Put deeper source explanations in the skill's references or chapters; keep essential rules in the runtime procedure.
3. Distinguish supplied original books, prior generated analysis, public excerpts/articles and actual transcripts. Recommended but unread books must not contribute attributed chapter claims.
4. Resolve conflicts between authors, wrapper instructions, playbook and schema before enabling a pack. Do not simply concatenate source cheat sheets.
5. Keep prompts small enough for the role. The loader renders the supplied schema separately; the skill should not paste another schema dump.
6. Run agent/integration checks and realistic evidence/action scenarios when behavior changes. An instruction is not a substitute for a deterministic validator.

No source PDFs, EPUBs, complete third-party transcripts, real call data or personal installation symlinks are part of these packs. Relative files inside each skill are portable within the repository. Supporting provenance notes are in `docs/sales-playbooks/`.

The role split, completed seven-book corpus and future publishing scope are documented in [the Mantis integration plan](../docs/sales-playbooks/mantis-integration.md).

See the [current readiness report](../docs/sales-playbooks/skill-readiness.md) for final checks, configured-model rehearsals, local model settings and remaining operating limits. The Docker build and production release script also run `skills:check` before release; no deployment was performed during this work.
