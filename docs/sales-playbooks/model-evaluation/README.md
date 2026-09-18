# Configured-model rehearsal evidence

18 September 2026. All contacts, companies and conversations in these fixtures are synthetic. Outputs are preserved as returned, including mistakes. No calls, web searches, CRM writes or calendar actions were performed by this harness.

## Method

`scripts/evaluate-skills.ts` sends fixture input to the actual selected skill loader, wrapper instructions and Zod output schema through the application's configured LLM client. It withholds the fixture's acceptance checks. It records schema validity, prompt fingerprint and elapsed request time. Later runs also record API mode and fixture hash. Each request has a 60-second evaluation deadline, rather than the live coach's shorter deadline.

This isolates model behavior. It does **not** replay the entire service input builder, calendar availability, transcription, rate limiter, output sanitization or CRM executor. Separately, `tests/integration/skill-invocation.test.ts` exercises all six actual service-to-model boundaries with deterministic fake responses. The two types of evidence should not be conflated.

## Preserved runs

| Run | Schema-valid | Findings and changes |
|---|---:|---|
| [4.1-mini initial](gpt-4.1-mini-initial.json) | 12/15 | False role citation, invented claims, invalid fields, unsupported qualification and calendar output. Used [initial fixtures](initial-fixtures.json). |
| [4.1-mini revised](gpt-4.1-mini-revised.json) | 14/15 | Narrower instructions and production-style fixture envelopes; false citation, unsupported commitments and unsolicited retry still occurred. |
| [Luna first](luna-first.json) | 15/15 | Better identity grounding, unknowns and write status. Still had qualification, commitment and coaching compatibility problems. |
| [Luna affected rerun](luna-affected-rerun.json) | 11/11 | [Fixtures](affected-rerun-fixtures.json). Fixed commitment extraction and review behavior. Independent review found refusal continuation, short-meeting scope, qualification ambiguity and a numeric-denial false positive. [Runtime check](coach-runtime-validation.json): 4/5 coach outputs accepted. |
| [Luna script rerun](luna-script-rerun.json) | 7/7 | [Fixtures](script-rerun-fixtures.json). Refusal, meeting scope and discount wording corrected. [Runtime check](coach-runtime-validation-final.json): 5/5 coach outputs accepted. Qualification-list inconsistencies remained. |
| [Luna strategy rerun](luna-strategy-rerun.json) | 2/2 | [Fixtures](strategy-rerun-fixtures.json). Per-criterion fit/readiness split corrected; research contradiction removed. Sales still puts an opt-out in the generic disqualifier list. |

The first fixture envelopes were corrected before later runs: post-call campaign field casing, review conversation structure, live stage names and configured objection labels. Prompts also changed between runs. Therefore this is iterative debugging, **not** a randomized A/B comparison, a statistical reliability estimate or proof that a model is universally better.

[Latest composite](latest-composite.json) takes the latest unedited response for each of the [15 current cases](../book-foldin-cases.json). Each item names its source run. All 15 pass the schema, but this is four batches and does not mean all behavior is perfect. No generated output was repaired to make a test pass.

## Behavioral review

The final cases preserve seller/contact separation, company versus industry facts, stale identity uncertainty, no invented quantified impact, clear refusal/DNC, draft-only review edits and truthful failed-write status. The five live outputs pass the actual configured-playbook validator after normalizing fixture campaign keys to runtime names.

Two residual presentation/decision issues remain visible: the firm-refusal cue includes a coaching preface before the spoken line, and one sales strategy's disqualifier list includes a contact's opt-out. The latter must be treated as contact suppression, not evidence of a business-fit mismatch. Operators should review a generated campaign's criteria and disqualifiers before calling. No existing campaign was automatically regenerated or activated by these checks.

Latest live requests took 2.703–6.450 seconds; the six-second local live deadline could suppress the slowest. These times exclude transcription and preceding calendar lookup. The smaller sample cannot establish p95 latency or conversion performance.

The latest composite is evidence for human-assisted rehearsal. It does not justify reading generated scripts unquestioningly or removing deterministic validation and operator controls.
