# Mantis skill integration

Reviewed 18 September 2026. Target repository: [zagolo/Mantis](https://github.com/zagolo/Mantis). Its default `main` HEAD was `f99777f30d4128ffc6fa016686efb1d76ffea28b`, identical to this checkout's committed base and the `shiv-eshwar/Mantis` fork's HEAD at review time. Upstream was cloned separately for inspection. The initial source-completion work remained local; a later user request authorized branch publication.

The local `origin` still points at the `shiv-eshwar` fork. The authorized publication destination is `zagolo/Mantis`, branch `codex/compiled-sales-skills`; its `main` was rechecked and still matched the reviewed base. Branch publication is separate from production deployment, which the repository triggers on pushes to `main`. Refresh upstream again before a later merge because it can move after this review.

## Decision: one selected skill for each of six roles

See the [agent inventory](../../agents/README.md) for exact paths. Two original combined skills are retained and four focused skills are added:

| Role | Skill | How it improves the existing setup |
|---|---|---|
| Offering intake | mantis-campaign-intake | Asks only for missing meaningful inputs; avoids loading a full selling script into a fact-collection conversation |
| Campaign strategy | mantis-campaign-strategy | Combines targeting, client issues, possible value and qualification into one short campaign method |
| Prospect research | prospect-research-playbook | Connects verified evidence to a possible problem and question; keeps unsupported facts out |
| Live coach | live-cold-call-coach | Uses the latest words to choose one relevant cue; preserves correction, refusal and uncertainty |
| Post-call extraction | mantis-post-call-evidence | Reports what the contact actually said without reinterpreting refusal or information requests through sales heuristics |
| CRM review | mantis-call-review | Separates edits, approval, retries, skip, discard and calendar drafts; speaks truthfully about execution status |

Keep post-call and call-review separate. One creates the evidence-based proposal after the call; the other lets the operator inspect it and choose an external action. Neither needs five sales books. Calendar handling is a workflow contract shared with deterministic application code, not a seventh sales methodology.

## What changed locally

- Six `skills.json` manifests select one pack each; legacy author packs remain intact.
- The loader reads selected descriptions and compact cheat sheets, and fails visibly if a selected skill is missing/incomplete. Deep source notes stay outside each live turn.
- The research cache key includes the rendered prompt/schema fingerprint so revised procedures regenerate the brief. Raw web evidence still has its own freshness policy.
- Campaign strategy preserves sales/research/networking differences and treats criteria as questions to investigate. Intake no longer needs unrelated sales-call tactics.
- Post-call instructions remove assumptions that a first refusal is reflexive or that a generic information request must be a brush-off.
- Review instructions stop advertising unsupported `calendarReminder`; this role has one `calendarProposal` which can have meeting, callback or reminder intent.
- Review messages describe an intended action before execution, and report completion only from actual result/state. Choosing `approve` does not itself prove a successful write.
- Personal absolute paths were removed from new source documentation. Original books, full retrievals and machine-local skill links remain outside the future tracked publication set.
- All seven core books are supplied. The three new PDFs were extracted and their relevant original sections folded into the research, live-coach and campaign-strategy packs.
- Application startup now validates all six explicit skill selections. `npm run skills:check` repeats that check offline; an integration test verifies all six service paths deliver the complete selected procedure to the LLM.
- Qualification grounding now excludes caller statements and CRM identity fields. The finalizer's deterministic DNC scan uses contact speech, and live DNC remains terminal across later contact/chat and pending model/calendar work.
- Approval now uses the same semantic field allowlist as proposal edits, synchronizes the stored outcome, and rejects skip on connected-call proposals.
- Review chat blocks model-origin `approve`, `retry_write` and `skip` from writing to the Sheet. Recognized exact operator commands are routed by the server with `source: "operator"`; the explicit write endpoints remain separate. Model-proposed approval with fields can change a pending draft only. The executor replaces premature completion claims with an accurate no-write response and a supported next action.
- The cue claim check removes approved literal spans and scans the residual text. Approved wording no longer permits an added unapproved numeric promise or guarantee in the same cue. This is still a lexical check with false positives and semantic limits.

These are local changes. The read-only upstream clone still reflects the original remote code.

## Source completion

The original four books are *Smart Calling*, *Cold Calling Sucks*, *Fanatical Prospecting*, and *New Sales. Simplified.* The user has now supplied the remaining three:

| Priority | Added full text | Main use | Why it matters |
|---|---|---|---|
| 1 | **Gap Selling — Keenan** | Live coach and campaign strategy | Deeper problem/impact/current-to-desired-state discovery and a sound basis for pilot scoping |
| 2 | **Take the Cold Out of Cold Calling — Sam Richter** | Prospect research | Dedicated public-source sales intelligence and relevance |
| 3 | **Objections — Jeb Blount** | Live coach | Deeper resistance, composure and objection judgment |

All three were processed with book-to-skill in Update / Fold-in mode. The research skill incorporates Richter's Fourth R, CRMT, source judgment and company-versus-industry context. Coaching distinguishes Blount's prospecting, micro-commitment and buying-commitment methods, and adds Keenan's current/future state and four question types. Campaign strategy uses the PIC and appropriate next-step value. No additional author-only runtime packs were introduced.

The supplied PDFs remain private outside this repository. Their 768 pages yielded about 201,000 source words. Relevant sections were directly checked; this is not a claim of exhaustive reading or image inspection. [Richter coverage](richter-book-foldin.md) and [Objections/Gap coverage](objections-gap-foldin.md) record edition, page mapping, methods adopted, adaptations and extraction limits.

The completed source curriculum contains **seven unique core books** across the two five-book curricula. No additional book download is required for this integration. Additional titles should respond to an observed decision gap, not a quota per agent.

## Maintaining the combined skills

1. Inventory the supplied editions; run the installed book-to-skill extractor and inspect its output/metadata for missing text or images.
2. Read the relevant original sections, preserving exact framework names and source attribution. Do not import every technique indiscriminately.
3. Add or revise the relevant workflow chapter/reference and source ledger. Resolve disagreements with existing advice explicitly.
4. Distill only the decisions that affect this role into its runtime cheat sheet. Keep examples, deep explanation and longer source analysis on demand.
5. Re-run a fixed scenario set and schema/integration checks. Record what was actually read and what remains uncertain. Update a version if useful; prompt content also drives research-brief invalidation.

Public articles and interviews remain separately attributed. Do not promote them to book passages when updating source notes.

## Invocation and deployment check

The Mantis application injects each selected `cheatsheet.md` into the actual system prompt on every relevant model request. It does not depend on the model choosing to open a skill file. The six-role startup check rejects missing manifests, multiple selections, absent skill files and empty procedures. Reference chapters support maintenance and interactive agent use; they are not read during every call.

Run `npm run skills:check`, `npm run typecheck`, `npm test` and `npm run build` in a candidate checkout. `tests/integration/skill-invocation.test.ts` exercises all six service-to-model boundaries with synthetic responses. The optional `npm run skills:eval -- --live docs/sales-playbooks/book-foldin-cases.json .firecrawl/skill-evaluation.json` calls the configured model with synthetic cases; inspect its outputs for meaning as well as schema conformance. It performs no prospect, Sheet or calendar actions.

The latest full local verification passed **232 tests across 45 files**, type checking and the client build. The existing bundle-size warning remains. These results cover software behavior; configured-model outcomes and open failures are reported separately in [skill readiness](skill-readiness.md).

Restart the application after deploying the complete change. Prepare a fresh prospect brief before the next call; the research prompt fingerprint prevents an old brief from silently using previous procedures. Existing historical call snapshots remain unchanged.

## Future publication must include the integration

Uploading just the new `SKILL.md` files would not activate them correctly. A later reviewed change needs the selected packs, manifests, agent wrappers, relevant playbook changes, loader and fingerprint integration, runtime guards, tests, agent inventory and source/evaluation docs. The inspected upstream baseline at `f99777f` discovers every author folder and does not understand the new manifests; the fixes described here are local changes beyond that baseline.

Do not include `.env`, `.firecrawl/` (including the review clone), local databases, real transcripts/recordings, source PDFs/EPUBs, or personal skill symlinks. They are local inputs/artifacts, not runtime dependencies. Keep the original generated author packs as inactive references in this change; a future consolidation of duplicates can be reviewed separately.

## Important limits left in the code

The local runtime fixes above address specific failures. These limitations remain separate follow-up work:

1. `src/server/coach/evidence.ts` now grounds evidence only in contact speech, but a matching quote or phrase does not establish its meaning, polarity or relevance to a particular criterion. Operator review remains necessary.
2. DNC recognition is still phrase/model based. The new terminal flag is per in-memory call session; durable cross-session suppression follows the application's reviewed CRM path.
3. Source collection still passes short search snippets rather than bounded page evidence; rich skills cannot recover facts that were never retrieved. Citation IDs are checked, but that alone does not prove claim support.
4. Calendar availability is still awaited before each model turn, and newer utterances can invalidate a pending response while being skipped by rate limiting. These scheduling paths need the improvements detailed in the [engine assessment](engine-assessment.md); phone/audio latency has not been measured here.
5. The rolling transcript summary still keeps only the first 1,500 characters of older turns, so a commitment from the middle of a call can fall out of context.
6. The residual claim scan does not prove semantic truth. It can reject a denial that mentions an unapproved percentage or guarantee, and miss unsupported claims outside its patterns.
7. The review write guard covers `approve`, `retry_write` and `skip` selected by the model. It is not a blanket guarantee about all local draft actions or every generated message. Exact operator commands and explicit write endpoints still depend on their existing state checks.
8. Model responses can violate even correctly loaded procedures. See [skill readiness](skill-readiness.md) for the configured-model evaluation rather than inferring its outcome from software checks.

My next priority is stronger source support, semantic evidence checks and cue timing. Source volume should grow only when it fixes an observed decision gap. Measure qualified conversations, meetings held and paid pilots, rather than assuming a larger library increases conversion.

See [source strategy](agent-source-strategy.md) for the role-by-role rationale, [resource guide](resource-guide.md) for the book/article/video curriculum, [Mantis validation](mantis-validation.md) for the six-role checks, and [skill readiness](skill-readiness.md) for model results and their limits.
