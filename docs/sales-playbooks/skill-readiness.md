# Sales skills: completion and readiness

Updated 18 September 2026. The book synthesis and six-role application integration are complete locally. No additional core books are needed. The skills are ready for a controlled operator rehearsal; this work does not establish production call quality or increased conversion.

The source-completion work initially remained local. The user subsequently authorized publication to `codex/compiled-sales-skills` in `zagolo/Mantis`. This branch publication is separate from production deployment; no prospects were contacted and no real Sheet/calendar data was changed. The local model configuration was updated as described below.

## Completed source work

The three supplied PDFs were processed with the installed book-to-skill extractor and folded into the existing combined skills:

| New source | Contribution | Coverage audit |
|---|---|---|
| Sam Richter, *Take the Cold Out of Cold Calling* | Purposeful research, Fourth R, CRMT, query refinement, source judgment, dated evidence and relevance | [Richter audit](richter-book-foldin.md) |
| Jeb Blount, *Objections* | Prospecting, micro-commitment and buying-commitment frameworks; distinguish concerns from refusal | [Objections/Gap audit](objections-gap-foldin.md) |
| Keenan, *Gap Selling* | Problem Identification Chart, current/future state, business impact, root cause and four question types | [Objections/Gap audit](objections-gap-foldin.md) |

These PDFs total 768 pages and approximately 201,003 extracted source words. Relevant original sections were inspected and synthesized; this is not an every-page or every-illustration reading claim. Extraction had image/encoding limitations documented in the audits. Original PDFs remain in Downloads; the temporary extraction directories were removed.

The two five-book curricula now draw on seven unique supplied books: *Smart Calling*, *Cold Calling Sucks*, *Take the Cold Out of Cold Calling*, *New Sales. Simplified.*, *Fanatical Prospecting*, *Objections* and *Gap Selling*. [Resource guide](resource-guide.md) gives the two ranked lists. [Auxiliary notes](auxiliary-source-notes.md) cover six retrieved articles, three actual YouTube transcripts and one publisher-hosted podcast transcript, plus explicitly limited/gated sources. Deliverables contain original synthesis and citations, not full books or transcripts.

## What the application actually uses

| Role | Selected skill | Version |
|---|---|---|
| Offering intake | mantis-campaign-intake | 1.0.0 |
| Campaign strategy | mantis-campaign-strategy | 1.1.4 |
| Prospect preparation | prospect-research-playbook | 1.1.1 |
| Live coaching | live-cold-call-coach | 1.1.3 |
| Post-call extraction | mantis-post-call-evidence | 1.0.2 |
| Operator review | mantis-call-review | 1.1.0 |

Each role has exactly one explicit `skills.json` selection. The Mantis loader adds its description and compact `cheatsheet.md` to every relevant model request alongside the role instructions and actual schema. This is automatic; the operator need not manually ask the application to invoke a skill. Full chapter files remain reference material rather than being read on every turn.

Startup fails when a role is missing its selected pack or runtime procedure. Docker builds and the production release script run the same offline skill preflight. Research prompt/schema fingerprints invalidate old generated preparation when active rules change; historical call snapshots remain intact. Existing campaigns still need operator review or regeneration to use newly generated campaign wording.

Both combined research/coach packs are also discoverable in this local agent installation through verified `~/.agents/skills` links to their canonical repo folders. Natural-language requests to research a prospect or coach a cold call can select them; explicitly naming `prospect-research-playbook` or `live-cold-call-coach` removes ambiguity. The four application workflow packs are selected by Mantis, rather than installed globally.

See [agent inventory](../../agents/README.md) and [integration details](mantis-integration.md). Publish the loader, runtime changes, selected packs/manifests, tests and documentation together; upstream's older loader does not honor the new selection manifests on its own.

## Runtime fixes supporting the skills

- Qualification evidence must come from contact speech; seller assertions and CRM job titles cannot qualify a lead.
- An explicit no-contact request latches the live session, including pending model/calendar results, and prevents later coaching from restarting the pitch. The post-call deterministic detector scans contact speech only.
- The approved-claim check no longer lets one approved sentence authorize an additional invented numerical claim. Diagnostic questions are accepted as first-objection responses.
- Review approval applies the same editable-field allowlist as draft edits. Connected conversations cannot use the non-connect skip path.
- Model-generated approve/retry/skip actions cannot write to the Sheet. Explicit operator commands or approval controls authorize the external write; drafts and calendar proposals remain reviewable.

These are code-enforced boundaries, not merely instructions in a book summary. They do not provide full semantic verification; see the remaining limits below.

## Verification

- **232 tests passed across 45 files**, including the six real service-to-model invocation paths and evidence, DNC, claims and review-write regressions.
- Type checking and the client build passed. The existing large client-bundle warning remains.
- All six selected skills pass structural validation. The three book-derived packs pass book-to-skill's advisory scan; its scanner excludes `sources.md`, which was inspected as provenance material.
- `npm run skills:check` renders all six selected procedures with their actual output schemas, without model credentials or external services. Release-script shell syntax and Git whitespace checks passed.
- Actual provider rehearsals exposed errors that fake-client tests cannot reveal. The latest 15-case composite passes every output schema, and all five final coach outputs pass the real live-coach validator. These are several recorded batches, not one perfect run. Remaining behavioral issues and all earlier failures are preserved in [model evaluation](model-evaluation/README.md).

## Local model setup

The local `.env` now uses `LLM_MODEL=gpt-5.6-luna`, `LLM_API_MODE=responses`, and `LLM_TIMEOUT_MS=6000`. Credentials and endpoint were preserved. This reversible local setting followed better grounding/review behavior in the synthetic Luna comparison than the existing gpt-4.1-mini setup. It is not included in Git and does not alter a remote deployment or an already-running server process.

Restart the local application to load these settings. A future deployment has its own shared environment, which must be checked separately. The rehearsal used the existing account; it did not modify real campaigns or contacts. [Official model reference](https://developers.openai.com/api/docs/models/gpt-5.6-luna) describes model capabilities; our local evidence is in the evaluation report.

Latest live-model requests took 2.703–6.450 seconds. One exceeded the new six-second live deadline, so it could be suppressed during an actual call. Calendar lookup and transcription add latency and were not included. A useful first rehearsal should verify actual speaker mapping and time from the contact finishing to a visible cue.

## Remaining operating limits

Generated campaigns still need review before calling. In the final synthetic sales strategy, an opt-out appears in the generic disqualifier list despite the improved fit/readiness criteria. Treat it as contact suppression, not proof that the business is outside the target. One final refusal cue also includes a coaching preface before the spoken line. The application is a human coach, not an autonomous caller.

Research currently supplies short search snippets, and citation validation checks source IDs rather than whether the source supports every claim. Contact evidence validation checks speaker and text overlap rather than full meaning. Claims checks can reject truthful numeric denials and cannot detect every unsupported assertion. Calendar lookup can delay cues, rapid contact turns can be skipped by the rate limiter, and the live DNC latch is in memory; durable suppression follows the reviewed CRM outcome. [Engine assessment](engine-assessment.md) separates completed fixes from this remaining work.

Before a prospect calling block, use an internal consenting rehearsal to check research identity, audio/speaker mapping, cue latency, refusal/DNC behavior and a reviewed follow-up. Nothing in this work tested real telephony, attendee delivery, production deployment or sales conversion. No additional books are the blocker for that rehearsal.

## Commands and publication scope

```bash
npm run skills:check
npm run typecheck
npm test
npm run build
```

Optional explicit provider rehearsal, using synthetic fixtures and incurring model usage:

```bash
npm run skills:eval -- --live docs/sales-playbooks/book-foldin-cases.json .firecrawl/new-model-check.json
```

The local origin remains the shiv-eshwar/Mantis fork. Publication targets the user's designated zagolo/Mantis repository on `codex/compiled-sales-skills`; its `main` still matched the reviewed base when rechecked for publication. Credentials, source PDFs, extraction text, raw third-party transcripts and local `.firecrawl` research are excluded from the commit. `.firecrawl` is excluded from Git, Docker context and the release copy. The repository deploys on pushes to `main`, so this branch publication does not deploy the application.
