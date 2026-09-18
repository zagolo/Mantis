# Sources, coverage and choices

Updated 2026-09-18 with the installed book-to-skill converter's **Update / Fold-in** workflow. The initial three-book contribution used prior analysis plus original passage checks; the newly supplied *Objections* and *Gap Selling* PDFs were extracted and their relevant sections verified directly. All five curriculum books now have supplied source coverage. This is a focused, cross-author workflow synthesis, not an exhaustive conversion of every chapter or image.

## Five-book curriculum

| Rank | Book | Use in this skill | Actual coverage |
|---|---|---|---|
| 1 | *Cold Calling Sucks (And That's Why It Works)* — Armand Farrokh and Nick Cegelski | Opening, Problem Proposition, Mr. Miyagi, interest before scheduling | Local EPUB and existing generated skill; selected original passages in ch01–03 and ch06 verified |
| 2 | *Smart Calling* — Art Sobczak, 2nd ed. | Intelligence, Possible Value Proposition, questions, listening and next-action commitment | Local PDF and existing generated skill; selected original passages in ch02, ch03, ch10 verified; other topics use prior analysis |
| 3 | *Objections* — Jeb Blount, Wiley, 2018 | Stage-specific resistance, next-step value and purchase-concern diagnosis | Supplied PDF; B4 below. Original ch3, 8, 10 and 12–14 relevant passages verified; public A1 remains a companion |
| 4 | *Gap Selling* — Keenan, 1st ed., 2018 | PIC, current/future state, four question types, gap and proportionate asks | Supplied PDF; B5 below. Original ch2–4, 6–10, 13, 15–16 relevant passages verified; public A2–A3 remain companions |
| 5 | *Fanatical Prospecting* — Jeb Blount | Call structure, RBO composure, preparation and practice | Local PDF and existing generated skill; selected original passages in ch15–16 verified; preparation topics use prior analysis |

This order prioritizes real-time coaching. Activity discipline is essential operationally but not a substitute for relevant words, listening or fit.

## Local evidence

The operator supplied the original three books from a private local library and the two additional PDFs for this fold-in. Prior analysis came from the existing `farrokh-cold-calling-sucks`, `sobczak-smart-calling` and `blount-fanatical-prospecting` skills, generated 2026-09-12. These paths are provenance, not runtime dependencies; the combined pack is stored in this repository.

- **B1 — Farrokh/Cegelski:** chapter 1 Tailored Permission and honest context; chapter 2 Problem Proposition; chapter 3 Mr. Miyagi; chapter 6 account fit and signal prioritization. EPUB extraction omitted 138 images. Diagrams, data charts and linked audio were not validated by extraction.
- **B2 — Sobczak:** chapter 2 printed pp. 26–29, PVP and buyer-perceived value; chapter 3 pp. 37–41, fact/situation distinction and proportional research depth; chapter 10 pp. 125–127, opening into questions. Existing chapters 5, 12–17 supply call objectives, Smart Questions, listening, next action and voice practice as prior analysis.
- **B3 — Blount:** chapter 15 printed pp. 164–168, telephone framework and truthful identification; chapter 16 pp. 186–188, Anchor–Disrupt–Ask. Existing chapter notes supply Golden/Platinum Hours, Power Hours and activity/effectiveness distinction. PDF graphics were not inspected.

- **B4 — Blount, *Objections*:** 2018 Wiley copyright, cloth ISBN 9781119477389; 248 PDF pages, 59,456 source-text words, approximately 79,274 source tokens. Text mode fell back from unavailable pdftotext to pypdf. Chapter 3 printed pp23–25 distinguishes four objection contexts; ch8 pp76–77 the Ledge; ch10 pp103–114 RBOs and Ledge → Disrupt → Ask; ch12 pp134–136 PAIS; ch13 pp150–157 Ledge → Explain value → Ask; ch14 pp159–181 buying decisions, the exact five-step sequence on p163, clarification, evidence and fallback. PDF page = printed page +16 in these sections. The actual contents has 16 chapters; the extractor heuristic reported 15.
- **B5 — Keenan, *Gap Selling*:** first edition, copyright 2018 Jim Keenan, ISBN 9781732891012; 208 PDF pages, 61,718 source-text words, approximately 82,290 source tokens. pypdf text extraction includes HTML layout remnants and broken word spacing. A manual heading map identifies 21 chapters in four parts; the automatic four-heading result and missing-TOC warning are not the book structure. Relevant locators use one-based **PDF pages**, not print pagination: ch2 pp30–31 PIC; ch3–4 pp38–45 current/future state; ch6 pp51–52 small/large gap; ch7–8 pp56–81 willingness, qualification, question types, technical/business problems and validation; ch8 pp87–88 CRM Challenge and non-linear conversation; ch9 pp89–91 gap calculation/change cost; ch10 pp98–100 motivation; ch13 pp123–130 objections/affordability; ch15 pp137–141 targeting; ch16 pp146–152 proportional ask/value. PIC image tables and email scorecard graphics were not analyzed.

Raw extracted books stay outside the repository. Full-text availability is distinct from full-text reading: the agent verified selected passages, not every page in this task. The converter's automatic page/chapter totals mix formats and are not bibliographic counts.

## Auxiliary articles and video text actually read

| ID | Resource | Contribution and limits |
|---|---|---|
| A1 | [Jeb Blount: Use the Ledge Technique for Overcoming Objections](https://salesgravy.com/how-to-use-the-ledge-technique-for-sales-objection-handling-ask-jeb/) | First-party article and accompanying [Ask Jeb video](https://www.youtube.com/watch?v=EppsCQnYWu0). Read the article; video captions/audio were not independently retrieved. Supports agreement, Ledge–Disrupt–Ask and problem-first explanation. Its example customer claims do not transfer to this business. |
| A2 | [Keenan: Problem-Centric Selling](https://salesgrowth.com/problem-centric-selling/) | Author-published text for the INBOUND 2018 talk, dated 2018-09-09. Read alongside selected passages from the actual retrieved video transcript T04 below. Supports PIC, current-state diagnosis, impact, root cause and future state. |
| A3 | [Keenan: Find the Gap, Measure the Gap](https://www.asalesguy.com/find-the-gap-measure-the-gap/) | First-party article: compare existing and desired states; quantify only supported quantities; assess gap alongside change effort, cost and risk. Supports discovery and pilot scoping, not guaranteed savings. |

Accessed 2026-09-18. Public-source extracts were obtained separately using Firecrawl and remain in the ignored research work area. Store source URLs and concise synthesis in the skill; do not copy complete transcripts into it.

## Actual video transcripts incorporated

| ID | Source | Verified contribution and access limitation |
|---|---|---|
| T01 | [30MPC: Cold Call Masterclass — The Perfect Script](https://www.youtube.com/watch?v=2vivv2HeiBU), 2026-01-20, 51:31; [official episode page](https://www.30mpc.com/episodes/cold-call-masterclass-the-perfect-script-with-live-calls-to-prove-it) | Substantive transcript retrieved; selected context/permission and test-drive passages read directly, with the broader method reviewed in auxiliary notes. Reinforces true account context before permission, concrete problem language, one solution sentence, and a meeting purpose derived from the prospect's answer. Publisher chapter markers: 09:00 opener, 12:00 problem, 18:30 objections, 26:00 next meeting, 28:15 examples. The description says prospect responses were recreated with AI voices for privacy; these are not unaltered raw prospect recordings. |
| T04 | [Keenan: Problem Centric Selling](https://www.youtube.com/watch?v=WMd3YUVw2c0), HubSpot Live, uploaded 2018-09-06, 42:55 | Substantive YouTube transcript retrieved; selected PIC and current/future-state passages read directly and cross-checked with A2. Teaches diagnosis before prescribing, with separate problem, impact and root-cause questions. Publisher chapter markers: 12:03 problem centric, 24:58 diagnosing, 28:06 questions, 29:38 gap, 38:47 objections. Broader selling training, not a complete cold-call script. |

Transcript lines may include automatic-caption errors and were not individually timestamped by the retrieval service. Chapter markers above are publisher navigation, not verified timestamps for exact quotations. No audio or prosody analysis was performed. Do not borrow presenters' performance claims, illustrative financial figures, pressured persistence or confrontational language. A1's separate Ledge video still had no usable captions in this run.

Additional research provenance and exclusions: [auxiliary source notes](../../../../docs/sales-playbooks/auxiliary-source-notes.md).

## Explicit synthesis choices

- Default to honest relevance and short permission rather than combining all authors' opening orders. Confirm identity when uncertain, overriding older assume-the-name tactics.
- Use PVP for provisional value and Problem Proposition for concrete articulation; do not pretend they are contradictory definitions of the same framework.
- Use one respectful clarification for an ambiguous brush-off, then accept the response. Stop immediately on a firm refusal or opt-out. This deliberately narrows older repeat-ask advice.
- Do not adopt deceptive familiarity, fake social proof, unsupported results, personal pressure, contemptuous tone, buyer “trap” questions or promises of no future calls in exchange for an answer.
- Use Keenan's diagnosis and impact reasoning without treating every objection as proof that the buyer is irrational. A genuine feature gap, implementation risk or lack of value can justify disqualification.
- Focus on useful next steps and confirmed fit. Any pilot price, implementation capability, reference, success metric or guarantee must come from this campaign and actual agreement.
- Keep deeper source learning outside the live cue. Observational statistics and historical anecdotes are training context, not target guarantees or evidence of engine lift.

## Fold-in limits and reconciliation

The exact *Objections* **Five-Step Buying Commitment Objection Turn-Around Framework** is **Relate → Isolate and clarify → Minimize → Ask → Fall back to an alternative**. Its separate isolate/clarify subheadings must not be counted as two steps while dropping fallback. The prospecting and micro-commitment three-step frameworks have different middle steps and different decisions.

The supplied book permits repeated turnarounds and some callback-after-hangup tactics. PAIS includes ignoring side issues. This engine retains the attribution but adopts stricter refusal boundaries, truthful contact provenance, direct answers to material questions and agreed deferral. It does not use false scarcity, borrowed customer claims or pressure to extract a next step.

Keenan's gap and questioning methods do not prove savings or causal attribution. His recommendations to challenge a buyer's objection become a respectful consistency check against confirmed priorities, with room for correction and a genuine no. Budget allocation differs from affordability; neither can be inferred. A purchase-stage method must not be applied to a stranger declining an interruption.

The PDFs' per-source image counters are unknown; the extractor's aggregate zero is not evidence that all graphics were read. Objections contains OCR noise, particularly blank/graphic pages. We read bounded relevant sections and source headings, not every page. Statistical/neuroscience claims, emotional diagnostic certainty, email scorecards, hiring/management chapters and book-specific commercial promises are outside this compilation. Detailed audit: [Objections and Gap fold-in](../../../../docs/sales-playbooks/objections-gap-foldin.md).
