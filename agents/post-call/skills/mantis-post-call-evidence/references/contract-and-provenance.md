# Contract and provenance

The historical upstream baseline is `zagolo/Mantis` commit `f99777f30d4128ffc6fa016686efb1d76ffea28b`, read from the local review checkout on 18 September 2026. The pinned links below describe that baseline. Subsequent local runtime changes are documented separately; they have not been attributed to the old upstream commit. Rules are repository-grounded workflow analysis authored for this installation. No book, blog, or video is claimed as a source for this skill.

## Historical baseline contracts

- [PostCallOutcome schema](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/shared/schemas.ts): fields, enums, maxima, and nullable values.
- [Extraction prompt](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/review/prompt.ts): receives campaign type/objective/outcomes/criteria/approved claims, lead name/company/role, liveState, playbook, transcriptComplete and up to the last 200 non-gap transcript utterances. Speaker, text, id and sequence are available. The prompt has no current timestamp or call-date field.
- [Finalizer](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/review/finalize.ts): stops coaching, flushes transcription and requires a terminal call. Non-connects skip LLM extraction and preserve semantic fields. Connected DNC uses a deterministic conservative outcome. Extraction failure or unsupported output falls back or is sanitized.
- [Validation and sanitization](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/review/validate.ts): campaign outcome restrictions, required criteria for qualified, ISO followUpAt, known criterion IDs and context matching. Invalid criteria can be downgraded without dropping the whole useful record.
- [Field mapping](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/review/fields.ts): application owns attempt count, timestamps, provider IDs and DNC call status. The extractor does not generate those fields.

## Complete output shape

All these fields are required: `semanticOutcome`, `qualification`, `qualificationReason`, `criteria`, `painOrResearchFindings`, `objections`, `nextStep`, `followUpAt`, `summary`, `callerCommitments`, `contactCommitments`, `transcriptComplete`, `confidence`.

`criteria` maps configured IDs to `{state: "yes" | "no" | "unknown", evidence: string | null, confidence: number}`. Overall qualification is `qualified | disqualified | defer | unknown`.

The semantic enum is `meeting_booked`, `permission_to_follow_up`, `reference_received`, `callback_later`, `not_interested`, `disqualified`, `do_not_contact`, `wrong_person`, `wrong_number`, `conversation_incomplete`, `unknown`. The chosen value must also pass the current campaign's allowed outcomes; membership in this enum alone does not authorize it.

## Local runtime changes after the baseline

The local [evidence matcher](../../../../../src/server/coach/evidence.ts) now filters to non-gap contact utterances. Caller assertions and CRM identity values cannot satisfy the matcher used by live qualification and post-call validation/sanitization. This fixes evidence provenance; it does not prove semantic entailment, negation, or relevance to a particular criterion. A matching quote or phrase can still be used in an unsupported broader assertion. Contact commitments and narrative claims also need the skill's careful interpretation; the shared criterion matcher is not a validator for every string in the output.

The local [finalizer](../../../../../src/server/review/finalize.ts) scans only contact speech for deterministic DNC, while also honoring the live DNC outcome. The [live coach](../../../../../src/server/coach/engine.ts) now latches DNC for the current in-memory session, suppresses later contact/chat coaching and discards pending model/calendar work. Recognition remains phrase/model based; durable cross-session suppression still follows the reviewed CRM write. These local code changes do not alter the output schema or let the extractor claim the Sheet has already been written.

## Maintenance checks

Review the supplied schema before changing field names. Check `tests/unit/postcall-evidence.test.ts`, `tests/integration/coaching.test.ts`, `tests/integration/review.test.ts`, `tests/integration/review-hardening.test.ts`, and the research/networking holdouts after a change. Existing regressions cover contact-only grounding and DNC races. Replay ambiguous refusal, conditional follow-up, short direct answers, missing transcript segments, and quote polarity before claiming semantic extraction quality improved.

The latest full local suite passed 232 tests across 45 files; type checking and the client build passed with the existing bundle-size warning. These are software checks. See [skill readiness](../../../../../docs/sales-playbooks/skill-readiness.md) for configured-model results, failures and evaluation scope.
