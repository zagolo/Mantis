# Book evidence and synthesis notes

Prepared 2026-09-18. This document contains original synthesis and brief framework names, not raw book text. It records what was actually available and checked for the two combined sales skills.

## What is available

The user's `document/sales_book` reference resolves to their private iCloud `Documents/salesbooks` library. Originals remain outside the repository; no machine-specific absolute path is required to run the skills.

| Book | Local source | Existing prior analysis | Verification in this run |
|---|---|---|---|
| *Smart Calling*, Art Sobczak, second edition | PDF, 264 PDF pages | `~/.agents/skills/sobczak-smart-calling/`, 20 chapter notes | Selected original passages in chapters 2, 3 and 10; other material read from existing notes |
| *Cold Calling Sucks (And That's Why It Works)*, Armand Farrokh and Nick Cegelski | EPUB | `~/.agents/skills/farrokh-cold-calling-sucks/`, 8 chapter notes | Selected original passages in chapters 1, 2, 3 and 6; detailed existing notes for chapters 1–3 |
| *Fanatical Prospecting*, Jeb Blount | PDF, 307 PDF pages | `~/.agents/skills/blount-fanatical-prospecting/`, 23 chapter notes | Selected original passages in chapters 15 and 16; existing notes for time, research and prioritization |
| *New Sales. Simplified.*, Mike Weinberg | EPUB, 2012 | `~/.agents/skills/weinberg-new-sales-simplified/`, 16 chapter notes | Selected original passages in chapters 5 and 8; detailed existing notes for both |
| *Take the Cold Out of Cold Calling*, Sam Richter, 2008 | PDF, 312 pages, supplied in Downloads | Existing public-source notes | Full extraction; selected original sections folded into research; [page coverage](richter-book-foldin.md) |
| *Objections*, Jeb Blount, 2018 | PDF, 248 pages, supplied in Downloads | Existing public Ledge notes | Full extraction; stage-specific frameworks checked against original; [page coverage](objections-gap-foldin.md) |
| *Gap Selling*, Keenan, first edition 2018 | PDF, 208 pages, supplied in Downloads | Existing public PIC/gap notes | Full extraction; current/future state and question methods checked against original; [page coverage](objections-gap-foldin.md) |

The installed converter is `~/.agents/skills/book-to-skill`, revision `01f8a742aeb9022df59ad61870469d07f299c479`. Its `scripts/extract.py` successfully extracted these four sources in text mode on 2026-09-18 using ebooklib and pypdf. Metadata reports 267,730 words and approximately 356,973 tokens. This is extracted corpus size, not a claim that every word was read in this task.

Raw extraction was created outside this repository in the run's temporary work directory and removed after the skill's validation; the four originals remain untouched. EPUB extraction omitted 138 images from *Cold Calling Sucks* and 20 images from *New Sales. Simplified.*; embedded charts, diagrams, and audio/QR resources were not read by the text extractor. PDF image coverage is unknown. The extractor's combined “598 pages” mixes PDF pages with EPUB spine items and must not be presented as a physical page count. Automatically detected chapter totals also require manual correction; use the books' chapter structures rather than the combined detector count.

At the initial review, engine copies of these author `SKILL.md` files matched their personal originals byte for byte. Upstream research loaded Sobczak and Farrokh/Cegelski; live coach loaded Farrokh/Cegelski and Blount. Weinberg supported campaign generation/interview, and Sobczak/Blount supported post-call. The local manifests now select one role-specific pack per agent; the original author packs remain references.

## Recommended five books for each purpose

These are a fit-based curriculum for this engine, not a measured universal ranking. Overlap is useful: it creates a common language between research and the live call.

| Research rank | Book | Distinct contribution | Source status |
|---|---|---|---|
| 1 | *Smart Calling* — Art Sobczak | Turns intelligence into a Possible Value Proposition and relevant questions | Local original plus prior analysis; selected passages verified |
| 2 | *Cold Calling Sucks (And That's Why It Works)* — Armand Farrokh and Nick Cegelski | Timing signals, account tiers, persona relevance and an opener that uses the research | Local original plus prior analysis; selected passages verified |
| 3 | *Take the Cold Out of Cold Calling* — Sam Richter | Dedicated sales intelligence and public-source research | Full source supplied and extracted; relevant original sections folded in |
| 4 | *New Sales. Simplified.* — Mike Weinberg | Target selection before research and client issues before product description | Local original plus prior analysis; selected passages verified |
| 5 | *Fanatical Prospecting* — Jeb Blount | Research preparation, prioritization and activity discipline | Local original plus prior analysis; selected passages verified |

| Coach rank | Book | Distinct contribution | Source status |
|---|---|---|---|
| 1 | *Cold Calling Sucks (And That's Why It Works)* — Armand Farrokh and Nick Cegelski | Opener, Problem Proposition, objection conversation, meeting | Local original plus prior analysis; selected passages verified |
| 2 | *Smart Calling* — Art Sobczak | Relevance, provisional value, questioning, listening and commitment | Local original plus prior analysis; selected passages verified |
| 3 | *Objections* — Jeb Blount | Dedicated resistance and emotional-control companion | Full source supplied and extracted; relevant original sections folded in |
| 4 | *Gap Selling* — Keenan | Problem discovery, business impact and a reason to change | Full source supplied and extracted; relevant original sections folded in |
| 5 | *Fanatical Prospecting* — Jeb Blount | Compact call/turnaround frameworks and consistent practice | Local original plus prior analysis; selected passages verified |

All seven core source books are now available. The later three PDFs contributed 768 pages and about 201,000 extracted source words. Their fold-in reports preserve exact edition/page locators and extraction limitations. Public interviews and articles remain separately attributed; they are not relabeled as book passages. The originals and raw extraction stay outside the publication set.

## Frameworks checked against original text

| Source and location | Exact name / structure | How it should influence this engine |
|---|---|---|
| Sobczak, ch. 2, printed pp. 26–29 | **Possible Value Proposition (PVP)** | State an outcome that may matter to this buyer; preserve “possible” until questions establish value. A company signal is evidence of change, not proof of pain, budget or need. |
| Sobczak, ch. 3, printed pp. 37–41 | Factual versus situational intelligence | Establish what the company actually does, then identify a business circumstance relevant to the offer. A biography without a call hypothesis is incomplete research. |
| Sobczak, ch. 3, printed pp. 39–40 | Craig Elias's trigger categories: **Bad Experience; Change or Transition; Awareness**; **window of dissatisfaction** | Attribute the trigger taxonomy to Elias as discussed by Sobczak. Prefer timing evidence, but confirm its meaning with the buyer. |
| Sobczak, ch. 10, printed pp. 125–127 | Introduction → intelligence → hint at PVP → possible value contingent on questioning | Connect research to one understandable reason for the call and a question. The first call should not become a recitation of everything found online. |
| Farrokh/Cegelski, ch. 1 | **Tailored Permission Opener** | Use context related to the problem, acknowledge the interruption, and ask for a short opportunity to explain. A person's university is irrelevant unless it changes the business reason to call. |
| Farrokh/Cegelski, ch. 2 | **Problem Proposition**: **Triggering Problem → One-Sentence Solution → Interest-Based CTA** | Describe a recognizable work situation in the persona's language; use one credible solution sentence and test interest before scheduling. |
| Farrokh/Cegelski, ch. 3 | **Mr. Miyagi Method**: **Agree with the objection → Incentivize conversation → Sell the test drive** | Acknowledge specifically, understand the situation, then offer a next conversation with its own useful outcome. Do not immediately re-pitch after agreeing. |
| Farrokh/Cegelski, ch. 6 | **The 30-Second Rule**; top-five research triggers; **A/B/C tiers** | Quickly reject clearly unsuitable accounts; rank timing-based signals; A = problem now, B = problem, C = ICP fit. In software, label A/B as hypotheses unless direct evidence confirms the problem. |
| Weinberg, ch. 5, printed pp. 53–55 | Target list must be **Finite, Focused, Written, and Workable** | Check campaign fit before expensive enrichment. Maintain an explicit, workable queue and learn within a coherent segment. |
| Weinberg, ch. 8, printed pp. 89–91 | **Power Statement**: headline, transitional phrase, client issues, offerings, differentiators | Use as a campaign source document. Extract one or two relevant issue phrases for a cold call; do not deliver the full two-to-three-minute statement during an interruption. |
| Blount, ch. 15, printed pp. 164–168 | Five-step telephone prospecting framework: attention/name → identify self → reason → bridge/because → ask | Ensure the call has identity, reason, buyer relevance and a clear next action even when another opener style is selected. |
| Blount, ch. 16, printed pp. 186–188 | **RBO Turnaround Framework: Anchor → Disrupt → Ask** | Use the anchor to regain composure, remove the expected fight, then ask a relevant question or next step. A repeated refusal is a reason to end politely. |

The existing Sobczak notes additionally support role-specific PVPs, primary and secondary objectives, Smart Questions, listening, and a mutual next action. Existing Blount notes support **Golden Hours / Platinum Hours**, **Power Hours**, **Prospecting Pyramid**, and **E + E = P** (efficiency plus effectiveness equals performance). Those were read as prior analysis in this run, not exhaustively rechecked in the original chapters.

## Reconcile differences before compilation

The following are engine design decisions. They are not presented as a single method invented by any one author.

1. **Research depth is proportional to value and uncertainty.** Sobczak explicitly varies depth by sale complexity. Farrokh/Cegelski's 30-Second Rule is for rejecting bad-fit accounts, not a universal cap on all research. Use a cheap fit check, then a bounded pass for a defensible signal and buyer role. Invest more in strategic accounts. A 30–90 second target can be an operational experiment, not a book-derived law.
2. **Choose one opener per call.** Sobczak introduces self before intelligence; Farrokh/Cegelski put context first; Blount states identity and purpose directly. Default to a short honest, context-based permission opener for an interruption; allow a direct opener when real prior context supports it. Evaluate by segment. Do not concatenate three openings.
3. **PVP and Problem Proposition solve different jobs.** A PVP is the research hypothesis about possible value. A Problem Proposition is a way to articulate a concrete problem and plausible remedy. Keep the hypothesis uncertain while making the spoken situation specific. Reject empty product slogans without falsely claiming Sobczak opposes value.
4. **Truth constrains familiarity and proof.** Do not manufacture customers, referrals, shared investors or previous conversations to use a familiarity opener. A public fact should retain its source and date. A hypothetical example must not be spoken as a client result.
5. **Classify resistance before selecting a response.** Timing, incumbent solution, information request, low relevance, wrong person and explicit opt-out are different states. Use Mr. Miyagi for an objection conversation; Anchor–Disrupt–Ask supports the seller's composure. Never stack both into a long speech. A question is useful only while the prospect remains willing to engage.
6. **Respect the meaning of a no.** Some older tactics in the source notes advocate repeated asks, calling again after a “never call” or trapping the buyer. The engine should end and record an explicit opt-out immediately. A brief clarification after a vague brush-off is different from refusing to accept a boundary. This is an explicit synthesis choice.
7. **Adapt gatekeeper treatment.** Sobczak emphasizes helpers and intelligence; Farrokh/Cegelski emphasize fast routing. Use transparent identity and concise business context, treat the person respectfully, and ask for routing information they are willing to provide. No fake familiarity or fabricated message history.
8. **Choose a voicemail objective.** Sobczak repeats the PVP and caller-owned follow-up; Blount asks for callbacks; Farrokh/Cegelski use voicemail to direct attention to email. Select one objective per campaign. Do not combine their number repetition, pitch and follow-up recipes into a long message.
9. **A cold call usually earns a next step.** Sobczak allows advancing as far as interest supports, while the modern meeting-first framework sells a test drive. For a complex AI service, do not force a deal close before needs, scope, stakeholders and success criteria are clear. If the buyer wants substantive discovery now, follow their engagement.
10. **Book statistics are source claims, not product promises.** Old connect rates, meeting rates, talk ratios and “300M calls” claims are observational and context dependent. Do not use a 55% or one-third talk ratio as a universal live command. Measure connect → relevant conversation → qualified meeting → attendance → opportunity → paid pilot in this engine, split by campaign/persona.

## Attachment interpretation

The two pasted documents supply candidate resources, rankings and example workflows, but their link labels do not establish the underlying URLs or verify their factual claims. Their examples about property managers, US executives, India and AI pilots are useful context, not verified campaign facts. Their claimed video titles, timestamps, publication dates, statistics and research ceilings need source checks before ingestion.

`aaryan.txt` supports the desire for one prospect-research skill, one live-coach skill, auxiliary sources and agent evaluations. It also mentions JIV, post-call/review overlap and historical authentication/domain tasks. Those are discussion notes, not new instructions to change providers, merge agents, remove authentication or contact anyone.

## Suggested acceptance cases for the compiled skills

- Research finds a hiring signal: store the dated evidence, articulate a possible operational problem, and ask a question that can disconfirm it; do not claim hiring proves budget.
- Research finds only an old press release or a same-name company: lower confidence, verify identity, and avoid a false personalized opener.
- No account-specific signal exists: use honest persona relevance with uncertainty or defer; never invent a trigger.
- “We already use X”: acknowledge the working solution, ask one relevant question if welcome, and avoid unsupported competitive claims.
- “Send information”: clarify the relevant topic and obtain a proportionate follow-up next step; do not mark a meeting booked.
- “Please stop calling”: stop, record the request and suppress further coaching pushes.
- The buyer corrects the research hypothesis: accept the correction immediately; do not keep displaying the original opener.
- A meeting is tentatively agreed: confirm the mutual purpose, time zone, attendees and invitation state; coaching text alone is not a calendar action.
- The live transcript is ambiguous: provide a short neutral prompt or stay quiet; do not hallucinate an objection or customer admission.

Keep the live skill compact: one usable next line and its immediate purpose. Put deeper explanations, alternate methods and training drills behind on-demand references. This preserves source richness without making the rep read a book during the call.
