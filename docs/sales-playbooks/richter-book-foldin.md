# Richter book fold-in

Updated 2026-09-18. The supplied full text of **Take the Cold Out of Cold Calling: Web Search Secrets for the Inside Info on Companies, Industries, and People** by **Sam Richter** is now integrated into [prospect-research-playbook](../../agents/prospect-research/skills/prospect-research-playbook/SKILL.md), version **1.1.0**. This closes the research curriculum's missing-source gap. It is targeted operational synthesis from a full extraction, not a claim that every page, screenshot or referenced website was checked.

Version 1.1.0 records this book fold-in; the subsequent 1.1.1 update adds runtime evidence and identity checks following actual-model evaluation.

## Source and extraction record

| Item | Verified value |
|---|---|
| Edition identified | Copyright 1995, 2008; supplied 2008 edition; no later revision stated |
| Publisher | Adams Business & Professional, an imprint of Beaver's Pond Press |
| ISBN | 978-1-59298-209-7; 1-59298-209-3 |
| Input | User-supplied PDF; original retained privately, outside the repository |
| PDF size/pages | 11.57 MB; 312 PDF pages |
| Printed numbering | Main text starts at printed p. 1 on PDF p. 22; printed p. 290 is PDF p. 311 |
| Table of contents | Twenty chapters plus preface, resource guide, index and quick references |
| Converter | Installed book-to-skill, Update / Fold-in; text mode; pypdf fallback because pdftotext was unavailable |
| Extracted source body | 79,829 words, 483,615 characters, estimated 106,438 tokens |
| Combined extraction | 79,857 words, 483,986 characters, estimated 106,476 tokens, including converter wrapper |
| Automatic chapter detector | Reported twelve numeric headings; manual contents review corrected this to twenty chapters |

The full input was passed through the converter, then queried by section rather than loaded repeatedly. A private page-addressed extraction supported printed/PDF locators. Prose was readable, with typical ligatures and line-wrap artifacts; the diagnostic found no Unicode replacement characters. This does not certify visual fidelity.

The parser reported ten undecodable image objects. Screenshots and illustrations were not comprehensively inspected. The source-level `images_dropped` field was unknown; the combined field of zero must not be interpreted as zero image loss. Text descriptions supported the adopted methods; no decision relies on an unread screenshot. Raw PDF text, screenshots and extraction files are not part of the skill or tracked documentation.

Before synthesis, the full-read planning estimate was roughly 138K input tokens (converter estimate × 1.3), plus about 5K output for the focused fold-in. That was a planning estimate, not actual measured usage or a price quote. Targeted reads avoided an exhaustive full-book generation.

## Relevant sections checked

Locators below refer to this supplied edition. Printed pages and PDF pages differ by 21 throughout the main text. Rows identify source sections reviewed, not one-to-one generated chapters.

| Source chapter / topic | Printed pages checked | PDF pages | Applied decision |
|---|---|---|---|
| II, Turn Cold Calls Into Warm Calls | 7–11 | 28–32 | Use a relevant business issue instead of a feature-first pitch; source examples and hypothetical conversion arithmetic are not product proof |
| III, Differentiating with Value | 12–17 | 33–38 | Useful, relevant, timely, credible and objective context; continue learning after a sale |
| IV, The Fourth R — Research | 18–23 | 39–44 | Research should improve business-specific questions and the relevance of a proposed capability |
| V, Practicing the Fourth R | 24–27 | 45–48 | Check source quality; public search may miss useful information; avoid endless free-web searching |
| VIII, Search Right the First Time | 39–47, 50–52 | 60–68, 71–73 | Phrase/Boolean reasoning, query refinement, Webmaster Think and source-specific search; current syntax remains tool-dependent |
| IX, The Power of Google | 61–66 | 82–87 | Domain and document search as discovery patterns; exclude accidentally exposed private material |
| XII, The Invisible Web | 99–102 | 120–123 | A general search is incomplete; consider appropriate specialized databases rather than treating no result as no need |
| XIII, Company Information | 103–104, 108–110, 113–114, 120–123 | 124–125, 129–131, 134–135, 141–144 | Distinguish same-name entities; check patent ownership; use local news, job adverts and dated archives with limits |
| XIV, Industry Information | 124–126 | 145–147 | Research the prospect's industry and its customers' industries; use trade/association context as questions, not account diagnoses |
| XV, Personal Information | 157–159, 190–192 | 178–180, 211–213 | Reviewed the relationship/personal-profile advice and explicitly narrowed the skill to relevant professional context |
| XVI, Premium Information Sources | 193–196 | 214–217 | Access coverage can differ between public search and licensed databases; historical products/prices are not current recommendations |
| XVII, Power Research for Individuals | 209–213, 218–220 | 230–234, 239–241 | Consider authorized public/university library resources for valuable unanswered questions; availability and access vary |
| XVIII, Putting It Together: The Warm Call | 229–251 | 250–272 | CRMT, company versus industry opening, adaptation to the channel, discovery before offering, follow-up based on actual discussion |
| XIX, Fourth R Exercise | 252–254, 267–270 | 273–275, 288–291 | Research → organized record → relevant conversation; distinguish first-call depth from meeting/proposal depth; examples are not reusable client proof |

The remaining directory walkthroughs, exhaustive quick references and illustrations were not converted into procedures. Their 2008 interfaces and availability would require current verification. The prior four books retain their documented selective original-text checks and prior-analysis coverage.

## What changed in the single compiled skill

- **Fourth R:** start with a business question, then choose the evidence that could improve it. The term and attribution now come from the supplied book, rather than only a public interview.
- **Search judgment:** verify entity and source; use the publisher's likely terminology; repair over-constrained queries; choose local/trade/association or authorized specialized sources when a material gap remains. Added [chapter 5](../../agents/prospect-research/skills/prospect-research-playbook/chapters/ch05-purposeful-search.md).
- **Company versus industry context:** a sector trend supports a question about the company, not a claim that the company has the trend's problem. This distinction is present in the runtime cheatsheet.
- **CRMT:** carry dated external context alongside contact history while preserving their origins. It maps to the existing application brief; it does not introduce unsupported output fields or force a full research dossier before every dial.
- **Handoff:** the contact may disprove the research. Update the angle rather than defend a source. Research does not establish authority, consent, qualification or a booked meeting.
- **Single source of execution guidance:** updated the existing SKILL, all four prior workflow chapters, glossary, patterns, sources and runtime cheatsheet. No separate Richter-only runtime skill was introduced.

All examples added here and in the skill are original hypothetical examples. No source scripts, copyrighted screenshots or raw chapters are embedded.

## Deliberate adaptations and conflicts resolved

| Source advice or tension | Compiled rule |
|---|---|
| 2008 search tools and interfaces | Preserve precise-query reasoning. Verify live operator support, interfaces and access before use; do not promise obsolete cache or directory features. No live websites were tested in this fold-in. |
| Historical statistics and sample success claims | Do not use search-coverage percentages, conversion examples, author results or hypothetical ROI as application benchmarks or user product proof. |
| Personal details in research and CRMT | Exclude family, religion, politics, home values and inferred personal wealth. Keep professional relevance. Personal wealth never establishes business budget. |
| Indexed sensitive files | Public indexing alone does not make leaked employee, customer or internal financial material suitable for prospecting. |
| Association access / implied relationships | Use actual access and true professional context; do not invent advertising interest, a referral or an existing relationship. |
| Job adverts, patents and industry trends | Treat them as clues with alternatives. A mentioned company may not own a patent; an application is not a launch; hiring may replace staff; sector pressures may not affect this account. |
| Deep preparation versus dialing | Richter's printed p. 253 recommends a 10–15 minute ceiling for a traditional cold call and deeper work for a meeting/proposal. His longer library-research discussion is a different task. The team's shorter routine defaults remain tunable, not author benchmarks. |
| Historical script lengths | Keep the logic of relevant evidence and an invitation; use the application's shorter opening and the campaign's actual objective, without a mandatory 90-second pitch or 45-minute meeting. |

The later public interview's “three by five” heuristic stays labeled as interview material. It was not found and is not claimed as a framework of this 2008 edition.

## Validation

The skill-creator structural validator passed. The book-to-skill advisory scan passed for its defined generated-file scope; it explicitly excluded `sources.md`, which was manually reviewed for attribution, URLs and unintended instructions. The runtime cheatsheet is 625 words / 4,235 characters (approximately 1,059 tokens by a character-count estimate), below the intended approximate 1,200-token budget. Tokenization varies by model.

The skill's frontmatter remains `prospect-research-playbook`; the existing agent manifest can continue selecting it. Runtime-critical additions are in `cheatsheet.md`, because the Mantis loader injects that file rather than the chapter library. Application invocation and behavioral checks are recorded separately in the overall integration validation; a successful document validator alone does not prove model behavior.
