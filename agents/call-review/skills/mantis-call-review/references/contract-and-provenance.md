# Contract and provenance

The historical upstream baseline is `zagolo/Mantis` commit `f99777f30d4128ffc6fa016686efb1d76ffea28b`, read from the local review checkout on 18 September 2026. Pinned links below describe that baseline; later local runtime changes are identified separately. This skill is original workflow analysis of the application. It does not claim book-based sales authority.

## Historical baseline contracts and timing

- [Review schemas](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/shared/schemas.ts): `ReviewInterviewTurn` is `{message, action, fields?, calendarProposal?}`. The `action` enum is `none | propose_fields | approve | retry_write | skip | retry_processing | discard`. A propose_fields turn needs a nonempty fields object; discard must not contain fields. There is no calendarReminder field.
- [Interview implementation](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/review/interview.ts): the model sees the conversation plus a compact proposal, including status, kind, semantic fields, warnings, proposed fields, diff, lastError and up to 40 recent utterances. It does not receive calendar availability, a current-time anchor, operator timezone, or a future action result. The model reply is generated before applyReviewInterviewAction. At the baseline, that reply was retained even if a write returned pending_retry. The later local guard below now replaces messages for blocked model-origin write actions; other generated messages still need truthful pre-action wording.
- [Review actions](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/review/actions.ts): approval writes pending_review/pending_retry proposals; a successful verified write marks applied, a failed write can mark pending_retry. Edits are saved before attempting the write. Reprocessing is connected-only and unavailable after applied/discarded. Discarding an applied proposal is rejected.
- [Review API](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/api/review.ts): known operator phrases can bypass the model. The baseline did not distinguish operator/model origin in the executor; the local implementation now does.
- [Calendar draft parsing](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/calendar/draft.ts) and [calendar insert behavior](https://github.com/zagolo/Mantis/blob/f99777f30d4128ffc6fa016686efb1d76ffea28b/src/server/calendar/insert.ts): drafts are proposals. Callback/reminder clear attendees and disable meeting links; their insert sends no attendee updates. A meeting may notify supplied attendees only after the separate calendar approval.

## Field ownership

The generic writeFields schema is broader than the operator-facing editing policy. The local code now applies this narrow allowlist during both draft edits and approval:

| Proposal | Editable keys |
| --- | --- |
| connected | call_status, call_outcome, qualification, qualification_reason, objections, next_step, follow_up_at, call_summary |
| non_connect | call_status, call_outcome |

All values are strings. An explicit clear uses the empty string; omitted keys retain current proposed values. Objections use semicolon-separated text in Sheet fields. Changing a qualification field does not synthesize new quoted evidence or rewrite the criteria object. The application handles attempt increments, timestamps, provider IDs, field ownership, identity verification and write verification.

At the upstream baseline, `propose_fields` used the allowlist but `approve` with fields bypassed that helper, and `skipNonConnect` delegated directly to approval without its own kind check. The local [review actions](../../../../../src/server/review/actions.ts) now filter approval edits with `operatorEdits`, synchronize stored semantic outcome fields, and reject skip for a connected proposal. These restrictions are now enforced by code, not only the skill.

## Local review write authorization

The local [review executor](../../../../../src/server/review/interview.ts) defaults its action source to model. For model-origin `approve`, `retry_write` or `skip`, it makes no Sheet write and replaces any generated success claim with an accurate response. A pending model-origin approval that includes fields can become `propose_fields`; that changes the draft only and uses its allowlist. Other blocked writes become `none`. A requested calendar draft may still be returned for separate review.

The local [review API](../../../../../src/server/api/review.ts) supplies `source: "operator"` only after its exact-command resolver recognizes the operator's message. For example, `Write this update`, `Retry write` and `Skip this contact` use that deterministic route. A model cannot grant itself operator origin through its output. The explicit approval/retry/skip endpoints remain separate paths with their existing state checks. Natural-language requests that produce model-selected write actions therefore remain drafts/no-write responses until a supported operator command or endpoint is used.

This guard concerns the three Sheet-write actions; it does not claim a general approval gate around every local proposal edit, reprocessing or discard action. Actual result and persisted status remain authoritative: `applied` confirms the Sheet write and `pending_retry` means it failed. The model's statement alone never establishes completion.

## Calendar payload

`calendarProposal` accepts `intent`, optional `title`, required `start` and `end`, `timezone`, optional `attendees`, `meet`, and `notes`. Timezone defaults to UTC in the schema, but that default is not evidence of the operator's or contact's intended timezone. Avoid ambiguous relative dates. A meeting and a separate reminder require separate review turns under this role's current schema.

## Maintenance checks

Recheck the implementation if action names, states or write fields change. Relevant tests: `tests/integration/review.test.ts`, `tests/integration/review-hardening.test.ts`, `tests/integration/calendar.test.ts`, and `tests/unit/calendar-intent.test.ts`. Regressions now cover model-origin write blocking, deterministic operator commands, approval field ownership and connected-call skip rejection. Continue evaluating edit-only instructions, pending write failure, DNC review and unresolved calendar dates; schema validity alone does not prove a useful model decision.

The latest full local suite passed 232 tests across 45 files; type checking and the client build passed with the existing bundle-size warning. See [skill readiness](../../../../../docs/sales-playbooks/skill-readiness.md) for configured-model results, failures and evaluation scope, separately from software checks.
