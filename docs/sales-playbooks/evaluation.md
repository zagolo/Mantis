# Evaluate decisions, not script matching

Use [evaluation-cases.json](evaluation-cases.json) as a synthetic rehearsal set. Each case provides evidence and behavioral checks; there is no single correct sentence. Keep the evaluation offline: no calling, outreach, calendar writes or CRM updates.

For each case, load the selected skill's **cheatsheet only** plus the host instructions/schema to approximate production. A second pass may load the full skill to check the reusable knowledge-base experience. Ask an evaluator unfamiliar with the intended answer to generate the result, then independently score it.

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Evidence | Invented/contradicted claim | Ambiguous support | Every concrete claim supported; gaps explicit |
| Relevance | Generic/off-topic | Plausible but weak | Latest evidence/words determine the next action |
| Conversation | Long script or multiple questions | Usable after editing | One natural next line/question and a pause |
| Boundaries | Ignores refusal or invents commitment | Ambiguous | Correct refusal, uncertainty and commitment handling |
| Contract | Invalid schema/limits | Valid but cluttered | Valid and easy to scan |

Any fabricated result, false familiarity, cross-company fact, unsupported qualification, ignored DNC, or invented calendar commitment is a failure regardless of total score. Treat all cases as must-pass for these boundaries. Use scores to compare versions, not as proof of business conversion.

Record model/version, date, exact rendered prompt fingerprint, case ID, actual output, reviewer findings and changes. Keep actual test outputs in a report; do not silently rewrite outputs after grading. Re-run only affected cases after a fix, plus boundary cases when shared rules change.

Code tests verify runtime selection, cache invalidation, output contracts and existing call integration. They cannot prove persuasion quality. Before a production rollout, replay a small consented call set and measure cue relevance and delay; then compare within the same campaign/persona on substantive conversations, meetings held and qualified opportunities. A few successful calls do not establish causality.
