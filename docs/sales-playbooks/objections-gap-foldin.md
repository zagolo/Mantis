# Objections and Gap Selling fold-in audit

Updated 2026-09-18. The operator supplied both PDFs to complete the existing compiled skills. The installed book-to-skill converter ran in **Update / Fold-in**, text-heavy mode. Existing skill destinations and application purpose were already specified. Document contents were treated as source material, not instructions to execute or contact anyone.

The resulting methods were merged into the existing [live-coach skill](../../agents/live-coach/skills/live-cold-call-coach/SKILL.md) and [campaign-strategy skill](../../agents/campaign-generation/skills/mantis-campaign-strategy/SKILL.md). No additional automatically loaded author packs were created. The live curriculum now has supplied text coverage for all five books; this does not imply every page or image was read.

## Sources and extraction quality

| Source | Edition evidence | Extraction |
|---|---|---|
| *Objections: The Ultimate Guide for Mastering the Art and Science of Getting Past No* — Jeb Blount | Wiley copyright 2018; printed cloth ISBN 9781119477389 | 248 PDF pages; 59,456 source words; estimated 79,274 source tokens; pypdf |
| *Gap Selling* — Keenan | Copyright 2018 Jim Keenan, **FIRST EDITION**, ISBN 9781732891012 on PDF p207 | 208 PDF pages; 61,718 source words; estimated 82,290 source tokens; pypdf |

The exact user-supplied filenames were matched to each converter run's metadata before writing skills. pdftotext was unavailable, so the installed extractor used its pypdf fallback. Combined source corpus: 456 PDF pages, 121,174 words, approximately 161,564 tokens. Converter overall counts add source-header text (Objections 59,500 words; Gap 61,766), which explains the difference from the source-only counts above. Estimates are extraction statistics, not model billing measurements.

- **Objections:** readable body text with OCR errors, noisy blank/graphic pages and occasional damaged page labels. Its actual contents lists 16 chapters; the automatic heading heuristic reported 15.
- **Gap Selling:** readable prose with HTML layout remnants, broken spacing and missing graphic/table content. A manual heading scan found 21 chapters across four parts. The extractor's four-heading result and missing-TOC warning are not the book's true structure.
- Both per-source image counters are unknown. An aggregate `images_dropped: 0` does not establish that images were inspected. No comprehensive image, layout or audio review was performed.
- Full text was extracted into separate private temporary work areas. Bounded relevant sections, tables of contents/copyright where available and named-framework locators were read; this was not a page-by-page book review. Only original synthesis and references belong in Git, never the PDFs or raw extraction.

## Verified decisions and locators

Objections locators below use printed pages; the matching one-based PDF page is printed page +16 in these sections. Gap locators are one-based PDF pages because this supplied export has no dependable print pagination.

| Decision in the skill | Source locator | What changed |
|---|---|---|
| Match the objection to its stage | Objections ch3 pp23–25 (PDF39–41) | Separate prospecting, red herring, micro-commitment and buying commitment |
| Pause rather than react | Objections ch8 pp76–78 (PDF92–94) | Ledge and internal This-or-That technique support composure without evasion |
| Prospecting resistance | Objections ch10 pp103–114 (PDF119–130) | Exact **Ledge → Disrupt → Ask**, adapted to one welcome clarification |
| Side issues | Objections ch12 pp134–136 (PDF150–152) | Preserve **PAIS — Pause, Acknowledge, Ignore, Save** attribution; use direct answers or agreed deferral for material concerns |
| Next-step hesitation | Objections ch13 pp150–157 (PDF166–173) | Exact **Ledge → Explain value → Ask**; benefit is for the buyer and must be real |
| Purchase concern | Objections ch14 pp159–181 (PDF175–197), especially p163/PDF179 | Exact **Relate → Isolate and clarify → Minimize → Ask → Fall back to an alternative**; isolate/clarify are one stage, fallback fifth |
| Prepare problem hypotheses | Gap ch2 PDF30–31, ch8 PDF65–69 | **Problem Identification Chart: problem / impact / root cause**, initially hypotheses |
| Current/future state | Gap ch3–4 PDF38–45; ch6 PDF51–52 | Facts, problems, impact, root cause, emotional state; desired outcome; small gap can mean no useful fit |
| Willingness and qualification | Gap ch7–8 PDF56–64 | Discovery follows willingness; avoid universal early BANT gates while preserving real constraints |
| Select the next question | Gap ch8 PDF69–81 | **Probing / process / provoking / validating**; technical symptom differs from business consequence |
| Specific notes, flexible conversation | Gap ch8 PDF87–88 | **CRM Challenge** tests specificity; discovery is not a linear interrogation |
| Quantify the gap | Gap ch9 PDF89–91 | Compare like units/time periods; desired gap is not guaranteed recoverable benefit or ROI |
| Why the change matters | Gap ch10 PDF98–100 | Ask the buyer's motivation; do not infer emotional or strategic priorities |
| Concern versus genuine constraint | Gap ch13 PDF123–130 | Revisit confirmed outcomes respectfully; distinguish budget allocation from affordability; allow corrections and no fit |
| Targeting and proportionate ask | Gap ch15 PDF137–141; ch16 PDF146–152 | Prioritize plausible impact without fabricated pain scores; **Offer − Ask = Value** is a qualitative value exchange |

## Application synthesis

The live decision card contains the essential new decisions because Mantis injects that card into the model prompt. Chapters hold the fuller reasoning and original illustrative dialogues for preparation/review. Campaign strategy receives the PIC, question-type selection, proportionate next-step value and objection-stage distinctions. Its output still follows the campaign schema; a new book does not add unsupported fields or exceed the 3–4-question limit.

The coach does not recite a book framework. It chooses one next utterance from the latest reliable conversation. The newly separated objection stages prevent a purchase-closing tactic from being used on an interruption refusal, and prevent a vague “let's meet” request from substituting for actual buyer value.

Original examples use maintenance-request handoffs, stated task volumes and a pilot rollout concern. They are teaching examples, not source quotations, customer testimonials, actual account facts or approved product claims.

## Deliberate exclusions and conflicts

- Objections permits further turnarounds and describes callback-after-hangup tactics in places. Mantis keeps its stricter stop rule: one clarification for a genuinely ambiguous first brush-off, immediate end for a firm refusal/repeated brush-off, and immediate stop-contact handling. No promised removal from lists in exchange for an answer.
- PAIS's default “ignore” can conceal a real buyer constraint. Material price, capability, trust or provenance questions are answered directly or explicitly deferred with agreement. They are not discarded as red herrings.
- A fallback offer is permitted only while welcome. It does not obligate the buyer to agree to something, turn previous yeses into ongoing consent, or authorize discounts/free work/unapproved pilot terms.
- Keenan's adversarial “defend the objection” rhetoric becomes a respectful check against confirmed priorities. The buyer may correct the diagnosis or reasonably prefer the status quo. The agent does not manufacture urgency, emotional state, numerical impact or proof of causality.
- The source books' illustrative revenue/savings/customer claims, historical conversion fractions, neurological explanations and sweeping outcome promises are not transferable proof for this seller and were not independently validated here.
- Gap's PIC graphic tables, email scorecards, chapter17 cadence and chapters18–21 sales management/hiring are outside this workflow fold-in. Objections' broader rejection psychology, exhaustive persuasion theory and later training/management material are not represented as fully analyzed chapters. The relevant excerpts are sufficient for the selected decision scope; omitted topics are not silently claimed as coverage.

## Verification scope

Source names and edition evidence were checked. Named sequences were checked against the actual definitions; in particular, the buying-commitment method includes fallback as its fifth step, not five isolated later subheadings. Both skill packs retain compact runtime cards, discoverable reference links and attributed glossary/patterns.

Both skill-creator structural validations and both book-to-skill advisory scans passed after the fold-in. The scanner explicitly excludes `sources.md`; both source files were manually reviewed. All 19 Markdown files in these two packs and this audit had valid relative links and no machine-specific source paths; the working-tree whitespace check passed. Model behavior and application prompt transport are evaluated separately by the integrating task and reported in final validation notes. Neither structural validity nor supplied-book coverage establishes improved conversion performance.
