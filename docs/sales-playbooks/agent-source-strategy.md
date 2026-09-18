# Source strategy for the six sales agents

Reviewed 2026-09-18 against the local `agents/` instructions, agent output schemas, loader, campaign generators and post-call/review implementation. The upstream comparison verified that `zagolo/Mantis` main, the `shiv-eshwar` fork's origin head and the local base share commit `f99777f30d4128ffc6fa016686efb1d76ffea28b`. The six selected skills and instruction corrections described below are local updates, not changes already pushed upstream. The later book fold-in and focused runtime fixes are incorporated below; source books remain untouched.

**Recommendation:** keep six bounded roles, each with one selected skill. Use book synthesis for campaign strategy, prospect research and live coaching. Use concise, schema-backed workflow skills for campaign intake, post-call extraction and CRM approval. Five books is a useful curriculum for the two original knowledge tasks; it is not a quota for every agent.

## Role and source mapping

| Existing role | Actual responsibility | Selected local skill | Primary source type | Books needed now |
|---|---|---|---|---|
| `campaign-interview` | Elicit the operator's offering, target customer, objective, campaign type and approved facts; return a complete brief | `mantis-campaign-intake` | Brief schema, conversational elicitation and provenance rules | None beyond existing material; do not load a sales strategy library |
| `campaign-generation` | Turn the approved brief into positioning, a short opener, questions, fit criteria, objections and a next step | `mantis-campaign-strategy` | Combined book framework adapted to the strategy schema | Existing Weinberg + Sobczak + Farrokh/Cegelski are sufficient to start |
| `prospect-research` | Produce a short, evidence-linked account/person brief and a hypothesis to test | Existing `prospect-research-playbook` | Combined book framework plus source-verification and research workflow | All five source books supplied; Richter folded into the existing pack |
| `live-coach` | Suggest the next useful utterance or silence during a human call | Existing `live-cold-call-coach` | Combined book framework plus transcript/evidence and cue rules | All five source books supplied; *Gap Selling* and *Objections* folded in |
| `post-call` | Extract a conservative, auditable outcome proposal after the call | `mantis-post-call-evidence` | Transcript semantics, campaign criteria, schema, validators and examples | None; selling heuristics should not govern extraction |
| `call-review` | Help the operator inspect/edit the proposal and explicitly approve a Sheet write or draft a calendar action | `mantis-call-review` | Field ownership, action/state contracts, approval boundaries and execution results | None; API/workflow behavior is the source of truth |

All six packs now exist locally and are selected through their roles' `skills.json` manifests. The four `mantis-` packs implement the additional role boundaries identified by this review; the research and live-coach names remain unchanged.

## What each skill should contain

### Campaign intake

The current mission explicitly says this role does not generate strategy. `campaignBriefSchema` requires offering name, description, target customer and objective, with campaign type and optional website, approved facts and Sheet campaign value. Its output is a short message plus readiness and the brief.

The skill should ask one or two missing-field questions at a time, preserve existing offering details unless changed, distinguish an operator's approved fact from an unapproved hypothesis, and stop collecting once the brief is sufficient. A website URL alone is not researched evidence. A clear reformulation is useful; invented capabilities, ROI, customer results or pricing are not.

Weinberg's issues-first thinking can inform a question about the problem solved, but the entire sales-story/phone/closing playbook is unnecessary. The baseline loaded Weinberg cheatsheet included target selection, asking three times and sales-call structure, which exceeded this role's job. The local update selects `mantis-campaign-intake` instead. No additional book purchase is needed for intake.

### Campaign strategy

This role now uses the combined `mantis-campaign-strategy` skill. Weinberg's **New Sales Driver**, **Finite, Focused, Written, Workable** targeting and client-issues-first **Power Statement** provide its strategic backbone. Sobczak's **Possible Value Proposition** keeps assumed buyer value provisional; Farrokh/Cegelski's **Problem Proposition** and interest before scheduling inform a short usable call path. Keenan's PIC and gap methods are now checked against the supplied first-edition book and inform questions about current work, impact, cause and desired change.

The output contract constrains the implementation: opening at most 280 characters; three or four questions; one to eight criteria with at least one required; at most three objections; short next step; unique IDs. The skill should distinguish fit from timing, with criteria's `onNo` mapping to disqualified, defer or unknown. A criterion is a condition to investigate, never a claim that a prospect already satisfies it.

Sales, research and networking need different objectives. Do not reuse a sales close or `meeting_booked` outcome for the two non-sales modes. Reconcile author differences before loading: a client-issue story does not justify invented customer testimony, an assumed problem does not establish pain, and older repeated-ask tactics do not override a refusal.

The supplied library is sufficient for campaign strategy; no additional book purchase is recommended now.

### Prospect research and live coaching

Keep the two compiled skills already created, with one selected pack per role. The research handoff should explicitly separate observation, hypothesis, unknown and source. The live skill should use those hypotheses to ask a question, then update from what the contact actually says.

A five-book curriculum does not mean every author needs equal runtime weight. For research, Sobczak and Richter are most directly about intelligence; Weinberg selects the right accounts; Farrokh/Cegelski connect signals to a call; Blount prevents unlimited preparation. For coaching, Farrokh/Cegelski supplies mechanics, Sobczak supplies relevance/listening, Blount supplies composure and practice, and Keenan supports receptive discovery. The two added full coach books have been extracted and relevant original sections synthesized; public-source contributions retain their separate provenance.

Do not aim to close a complex AI-service purchase during every interruption. The current success outcomes largely represent meeting, callback, permission and referral progress. A paid pilot requires actual scope, price, ownership and success criteria. Adding a won-deal or revenue stage would be a separate product/data-model decision, not something a skill can silently introduce.

### Post-call evidence extraction

This agent should explain what happened, not what a sales trainer thinks should have happened. Its `PostCallOutcome` includes semantic outcome, qualification, criterion evidence, findings, objections, next step, follow-up date, summary and separate caller/contact commitments.

Use the actual transcript, speaker identity, campaign criteria and conservative fallbacks. Preserve exact quotations and distinguish research hypotheses from buyer statements. Silence and missing transcript segments do not establish a negative criterion. “Not interested” is an observed refusal, not proof of poor fit or a hidden buying signal. An information request is what was requested; its strength depends on context and stated commitments rather than a universal “brush-off” rule.

The baseline instructions contained two persuasive defaults — a first no is usually a reflex, and send-info is a brush-off unless a document is named. These were removed in the local update and replaced by neutral extraction rules in the instructions and `mantis-post-call-evidence`. A genuine firm refusal must not disappear from CRM because a book teaches persistence. The validator now requires contact-speech grounding; semantic meaning and polarity remain limitations, as described below.

Source the skill from `postCallOutcomeSchema`, `buildExtractionPrompt`, `validatePostCallOutcome`, `sanitizePostCallOutcome`, DNC handling and realistic annotated call examples. Sobczak-style action notes are optional organizational inspiration; they do not override the schema or supply missing facts. The non-connect path already avoids an LLM and preserves semantic fields; keep that deterministic behavior.

### CRM review and approval

This is an operator-facing transaction workflow. It should present current versus proposed fields, explain the supporting evidence, permit only the appropriate editable keys and distinguish editing from approval. `none`, `propose_fields`, `approve`, `retry_write`, `skip`, `retry_processing` and `discard` have distinct meanings and state requirements.

Explicit operator corrections can change the proposal, but they must not be mislabeled as transcript quotes. Do not edit transport IDs, attempt counts or timestamps through natural-language semantic edits. Calendar meeting, callback and reminder intents remain separate; a draft is not a sent invitation or a Sheet write. Confirm ambiguous time/date/time-zone details instead of accepting a schema default as evidence of user intent.

The local executor now prevents model-origin `approve`, `retry_write` and `skip` from performing a Sheet write. The server recognizes exact operator commands and marks that path as operator-origin; explicit write endpoints remain separate. A model-proposed approval with edits may update the pending draft only, with a response stating that no Sheet write occurred. The per-kind field allowlist applies to approval as well as editing, and connected conversations cannot be skipped.

No sales book determines field ownership, idempotency, write success or calendar behavior. Source this skill from the actual code contracts and examples. Training material about “closing” creates unnecessary risk when this role's job is to approve the correct record.

## Post-call and call-review are not duplicates

They occupy different stages:

`terminal call → evidence extraction → stored proposal and diff → operator review/edit → approved write`

`post-call` is the unattended extractor that produces the first proposal after a connected call. `call-review` is the interactive reviewer that receives that proposal, its warnings and evidence. It can request reprocessing and edit supported fields; Sheet approval, write retry and non-connect skip must pass the deterministic operator-command route or an explicit write endpoint. Keeping the boundary makes the proposed change reviewable before external state changes.

They do overlap on facts and terminology, so share the outcome schema, evidence rules and deterministic validators. Do not make call-review rerun extraction on every chat message. The current implementation already has a specific `retry_processing` path for that operation.

The name `call-review` can sound like performance coaching, but that is not its present responsibility. If the product later needs graded call debriefs, objection practice or rep development, make that a clearly separate optional capability with its own evaluation. Do not blend a persuasive performance assessment into the factual CRM approval step.

## Completed book corpus

**No additional book is required for this integration.** The user supplied the three remaining books, and their relevant original sections were folded into the existing packs:

| Priority | Added book | Why add it | Status and use |
|---|---|---|---|
| 1 | *Gap Selling* — Keenan | Deeper current-state, problem, impact and change-value discovery; useful for eventual paid-pilot scoping | Full PDF extracted; current/future-state and question methods folded into coach and campaign strategy |
| 2 | *Take the Cold Out of Cold Calling* — Sam Richter | Dedicated sales intelligence and research technique | Full PDF extracted; Fourth R, CRMT and source judgment folded into research |
| 3 | *Objections* — Jeb Blount | Deeper objection psychology and response judgment | Full PDF extracted; prospecting, micro-commitment and buying-commitment methods distinguished in the coach |

Already present: *Smart Calling*, *Cold Calling Sucks (And That's Why It Works)*, *Fanatical Prospecting*, and *New Sales. Simplified.* Do not ask the user to download those again.

The complete target library is therefore **seven unique core books**:

- Research five: Smart Calling; Cold Calling Sucks; Take the Cold Out of Cold Calling; New Sales. Simplified.; Fanatical Prospecting.
- Coach five: Cold Calling Sucks; Smart Calling; Objections; Gap Selling; Fanatical Prospecting.

Do not expand the purchase list now. Evaluate the completed skills on actual supported call decisions. Intake, Sheet writes, meeting reminders and extraction do not need extra books. A future observed gap can justify another source; adding titles alone is not an improvement.

## Runtime and implementation observations

1. `src/server/agents/loader.ts` currently loads each selected skill's metadata and **cheatsheet**, not its full `SKILL.md` body or all chapter files. Essential evidence, refusal, claim and action rules must therefore live in the cheatsheet or agent instructions. Deep chapters support development and interactive reference; they are not automatically present in every model call.
2. All six application roles now require one explicit manifest selection at startup. The lower-level loader retains legacy discovery, but the application cannot silently fall back to all author packs when a manifest is missing. `npm run skills:check` verifies the deployed selection offline.
3. **Provenance corrected locally; semantic limits remain:** `evidenceInContext` now matches contact speech only, excluding caller assertions and CRM identity fields from live and post-call qualification. It still does not prove that a quote entails the proposed result or preserve semantic polarity automatically. The finalizer's deterministic DNC scan also uses contact speech. A live-session DNC latch blocks later turns and pending model/calendar results; it is in memory, while durable suppression follows reviewed CRM state.
4. **Corrected locally:** baseline `call-review/instructions.md` mentioned `calendarReminder`, while `reviewInterviewTurnSchema` exposes `calendarProposal` only. The revised instructions and `mantis-call-review` use the supported field and explicitly exclude `calendarReminder` from this role.
5. **Review execution corrected locally:** the review model drafts its message before any action occurs. Model-origin `approve`, `retry_write` and `skip` now cannot write the Sheet; the executor replaces their success claims with an accurate no-write response. Only the server's recognized exact operator-command route opts into those chat writes. Explicit write endpoints remain separate. Approval now applies the proposal-edit allowlist and synchronizes stored semantic outcomes; a kind guard rejects connected-call skip. Other generated messages still need prospective wording, with actual result/persisted state as the authority for success.
6. **Approved-plus-invented loophole corrected locally:** the claim validator removes approved literal spans and scans the remaining cue for flagged numbers, guarantees and proof phrases. It no longer approves an entire cue merely because one approved sentence appears. The scan remains lexical: numeric denials can be false positives, and unsupported assertions outside its patterns can pass.
7. **Research and latency limitations remain:** research still uses a single combined Firecrawl search and short snippets; a known citation ID does not prove support for a claim. Each live turn still awaits calendar availability, rate limiting can leave a newer utterance without a replacement cue, and the rolling summary can omit middle-of-call commitments. See the [engine assessment](engine-assessment.md) for the next implementation steps.

## Evaluation by role

| Role | Discriminating cases | Useful quality measure |
|---|---|---|
| Intake | Missing objective; amended existing offer; empty approved facts; operator offers unsupported ROI | Correct readiness, preserved facts, concise questions, no strategy leakage |
| Campaign strategy | Sales versus research; missing proof; unrealistic target; no-budget versus no-fit | Schema validity, objective fit, speakable wording, useful criteria and no invented claims |
| Research | Same-name company; stale hiring page; no sources; colleague follow-up | Citation correctness, identity accuracy, hypothesis separation and usable first question |
| Live coach | False hypothesis corrected; firm no; repeated brush-off; DNC; busy buyer; uncertain transcript | Correct next move or silence, brevity, evidence use and boundary adherence |
| Post-call | Seller asks a leading question; contact never answers; information request; incomplete transcript; non-connect | Speaker-correct evidence, conservative unknowns, accurate commitments/outcome and no fabricated follow-up |
| CRM review | Edit without approval; approval with failed write; wrong proposal state; callback versus invitation | Correct action/state, field whitelist, explicit authorization and truthful execution status |

Measure downstream meeting attendance, qualified opportunities and paid pilots separately from prompt compliance. A source-rich skill can improve behavior without yet proving a conversion lift. Use actual call outcomes to decide whether another book or a product change is the next investment.

The latest full local software suite passed **232 tests across 45 files**; type checking and the client build passed with the existing bundle-size warning. Configured-model outcomes, failures and readiness judgments are tracked separately in [skill readiness](skill-readiness.md). Those judgments are not inferred from source completeness or the software test count.

## Local evidence examined

- All six `agents/<role>/instructions.md` files and their `agent.ts` output-schema bindings.
- `src/shared/campaigns.ts`: brief, campaign strategy and prospect preparation contracts.
- `src/shared/schemas.ts`: post-call outcomes, qualification, review actions and calendar proposal contract.
- `src/server/agents/loader.ts`: active selection, cheatsheet loading and prompt fingerprinting.
- `src/server/campaigns/interview.ts` and `generate.ts`: intake/generation handoff.
- `src/server/review/prompt.ts`, `finalize.ts`, `validate.ts`, `interview.ts` and `actions.ts`: extraction, review and write flow.
- `src/server/coach/evidence.ts`: current evidence matching limits.
- [Book-source notes](book-source-notes.md) and [auxiliary-source notes](auxiliary-source-notes.md): actual source availability, selected original checks and public-source access limits.
