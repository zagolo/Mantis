# Mantis role integration validation

> Historical offline rehearsal. See [current skill readiness](skill-readiness.md) for the later original-book fold-in, real configured-model failures and reruns, and final software checks.

Reviewed 18 September 2026 against local changes on base `f99777f30d4128ffc6fa016686efb1d76ffea28b`.

## Software and package checks

- Full test suite after all six role integrations: **44 files, 207 tests passed**.
- TypeScript checking and `git diff --check` passed.
- All six selected skills passed the skill-creator structural validator. The three book-derived packs also passed book-to-skill advisory scans over the defined content scope; `sources.md` was reviewed separately.
- Internal links resolve. New skill and documentation files were checked for personal absolute paths and secret-like content.
- The separate upstream inspection checkout remained clean at the verified base. Local Git remotes were not changed. No commit, push or deployment occurred.

The earlier client build and ten research/coaching rehearsals are recorded in the [original evaluation report](evaluation-report.md). This follow-up did not change client code or repeat that build.

## Eight additional role scenarios

A separate assistant received synthetic inputs, each role's wrapper and selected runtime cheat sheet, and the exact output schemas. The acceptance checks were withheld. It drafted the outputs without external actions or access to earlier evaluation reports. The parent then assessed those outputs against the withheld checks.

This was an **offline assistant rehearsal**, not a run of the configured production model and not an end-to-end execution of the application. Schema conformance and these scenario results do not establish live reliability or sales conversion.

Artifacts: [inputs and acceptance checks](mantis-role-cases.json), [unchanged first-attempt outputs](mantis-role-outputs.json).

| Case | Observed result | Assessment |
|---|---|---|
| Vague intake | Asks about the buyer group and actual workflow; keeps `ready: false`, with no invented positioning | Pass; objective still needs clarification on a later turn |
| Existing brief update | Changes only the requested target; empty optional website/proof remain empty | Pass |
| Research campaign | Uses neutral experience questions and follow-up permission without adding a sales close, budget gate or product promise | Pass; strict leadership target follows the supplied brief |
| No proof or metrics | Uses the supplied mechanism, asks about possible problems, and separates confirmed mismatch from uncertain readiness | Pass |
| Seller asserts pain/budget | Keeps qualification unknown; preserves the contact's correction and the specific outline request | Pass; permission covers that outline only |
| Incomplete transcript with DNC | Preserves DNC and the transcript gap, leaves business evidence unknown, and does not claim removal was executed | Pass |
| Edit without write | Proposes only `next_step`; leaves external approval pending | Pass |
| Failed write and vague calendar request | Reports the failed write, does not retry, and asks for the missing date/time/duration/timezone | Pass |

All eight outputs passed their exact local Zod schemas on the first attempt. Parsing made no transformations, inserted no defaults and stripped no keys. No output corrections were needed. Post-call confidence values are qualitative judgments, not calibrated probabilities.

The original ten research/coach scenarios plus these eight cover all six selected roles. They leave deterministic evidence validation, action execution, transcription, cue latency and production-model behavior untested by this rehearsal. The [Mantis review](mantis-integration.md#important-limits-left-in-the-code) records the inherited code gaps; passing prompt scenarios does not repair those gaps.
