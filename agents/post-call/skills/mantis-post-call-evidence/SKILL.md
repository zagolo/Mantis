---
name: mantis-post-call-evidence
description: Extract a grounded PostCallOutcome proposal from a completed Mantis call using contact evidence, campaign criteria, and actual commitments. Use for post-call extraction, not live selling or authorizing CRM writes.
metadata:
  version: "1.0.2"
---

# Mantis post-call evidence

Produce the most faithful useful record of the conversation, including what remains unknown. This is an application workflow skill derived from the repository contracts, not a synthesis of sales books.

Use [cheatsheet.md](cheatsheet.md) for the runtime evidence and outcome procedure. Mantis loads that file into the post-call prompt; this entrypoint and its supporting reference are for inspection and maintenance.

Use [references/contract-and-provenance.md](references/contract-and-provenance.md) when checking output fields, campaign restrictions, timing, or the evidence behind these rules. The live supplied schema is authoritative if implementation changes.

Keep the roles separate: this skill proposes an extraction; the finalizer records transport fields; the operator reviews; the application executes an approved Sheet write. An extraction is never proof that the CRM was updated.
