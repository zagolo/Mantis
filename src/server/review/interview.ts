import { z } from "zod";
import {
  reviewInterviewTurnSchema,
  type ReviewInterviewAction,
  type WriteFieldsInput
} from "../../shared/schemas.js";
import type { BootstrapResponse, PublicCalendarProposal, PublicLead, PublicProposal } from "../../shared/contracts.js";
import { openingReviewMessage } from "../../shared/reviewOpening.js";
import type { LlmClient } from "../llm/types.js";
import { renderAgentSystem } from "../agents/loader.js";
import type { AppContext } from "../context.js";
import { draftFromUnknown } from "../calendar/draft.js";
import { insertCalendarProposal } from "../calendar/proposals.js";
import {
  approveProposal,
  discardProposal,
  patchProposalFields,
  retryProcessing,
  skipNonConnect,
  ReviewError
} from "./actions.js";

export type ReviewChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type ReviewInterviewResult = {
  text: string;
  proposal: PublicProposal;
  wrote: boolean;
  leftReview: boolean;
  lead: PublicLead | null;
  leads: PublicLead[];
  sheet: BootstrapResponse["sheet"] | null;
  calendarProposal: PublicCalendarProposal | null;
};

function compactProposal(proposal: PublicProposal) {
  return {
    id: proposal.id,
    status: proposal.status,
    kind: proposal.kind,
    contactName: proposal.contactName,
    leadId: proposal.leadId,
    transportOutcome: proposal.transportOutcome,
    semanticOutcome: proposal.semanticOutcome,
    qualification: proposal.qualification,
    qualificationReason: proposal.qualificationReason,
    criteria: proposal.criteria,
    painOrResearchFindings: proposal.painOrResearchFindings,
    objections: proposal.objections,
    nextStep: proposal.nextStep,
    followUpAt: proposal.followUpAt,
    summary: proposal.summary,
    warnings: proposal.warnings,
    proposedFields: proposal.proposedFields,
    diff: proposal.diff.filter((row) => row.key !== "twilio_call_sid" && row.key !== "recording_sid"),
    lastError: proposal.lastError,
    utterances: proposal.utterances.slice(-40).map((item) => ({
      speaker: item.speaker,
      text: item.text
    }))
  };
}

export async function interviewReviewTurn(
  llm: LlmClient,
  messages: ReviewChatMessage[],
  proposal: PublicProposal,
  timeoutMs: number
): Promise<{ message: string; action: ReviewInterviewAction; fields?: WriteFieldsInput; calendarProposal?: z.infer<typeof reviewInterviewTurnSchema>["calendarProposal"] }> {
  const raw = await llm.completeJson({
    system: renderAgentSystem("call-review", JSON.stringify(z.toJSONSchema(reviewInterviewTurnSchema))),
    user: JSON.stringify({
      conversation: messages,
      proposal: compactProposal(proposal)
    }),
    timeoutMs
  });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("AI generation failed or returned an invalid result. Check the AI connection and try again; the Sheet was not written.");
  }
  const parsed = reviewInterviewTurnSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("AI generation failed or returned an invalid result. Check the AI connection and try again; the Sheet was not written.");
  }
  return parsed.data;
}

export function bootstrapReviewReply(proposal: PublicProposal): ReviewInterviewResult {
  return {
    text: openingReviewMessage(proposal),
    proposal,
    wrote: false,
    leftReview: false,
    lead: null,
    leads: [],
    sheet: null,
    calendarProposal: null
  };
}

export async function applyReviewInterviewAction(
  ctx: AppContext,
  proposal: PublicProposal,
  action: ReviewInterviewAction,
  fields: WriteFieldsInput | undefined,
  message: string,
  calendarDraft?: z.infer<typeof reviewInterviewTurnSchema>["calendarProposal"],
  source: "operator" | "model" = "model"
): Promise<ReviewInterviewResult> {
  // A provider action is a suggestion, not authorization to change the Sheet.
  // Only the server's exact-command route opts in; explicit write endpoints
  // call the review actions directly. Draft edits and calendar proposals stay
  // available for the operator to review before choosing a write action.
  if (source === "model" && (action === "approve" || action === "retry_write" || action === "skip")) {
    const requestedAction = action;
    const pending = proposal.status === "pending_review" || proposal.status === "pending_retry";
    action = requestedAction === "approve" && pending && Object.values(fields ?? {}).some((value) => value !== undefined)
      ? "propose_fields"
      : "none";
    if (action === "none") fields = undefined;
    if (!pending) {
      message = `No new Sheet write was made. This proposal is ${proposal.status}.`;
    } else if (requestedAction === "retry_write" && proposal.status === "pending_retry") {
      message = 'The previous Sheet write failed; nothing was retried. Send "Retry write" to retry the saved update.';
    } else if (requestedAction === "skip" && proposal.kind === "non_connect") {
      message = 'No Sheet write was made. Send "Skip this contact" to mark this non-connect as Skipped.';
    } else if (requestedAction === "skip") {
      message = 'Connected conversations cannot be skipped. Review the proposal, then choose "Write this update" when ready.';
    } else {
      message = action === "propose_fields"
        ? 'These edits affect the draft only. Review the proposed changes, then choose or send "Write this update" to submit them to the Sheet.'
        : 'No Sheet write was made. Review the proposal, then choose or send "Write this update" to submit it.';
    }
  }
  let calendarProposal: PublicCalendarProposal | null = null;
  if (calendarDraft) {
    const draft = draftFromUnknown(calendarDraft, proposal.contactName || "Meeting");
    if (draft) {
      calendarProposal = insertCalendarProposal(ctx.db, {
        sessionId: proposal.sessionId,
        source: "call_review",
        draft
      });
    }
  }
  if (action === "none") {
    return {
      text: message,
      proposal,
      wrote: false,
      leftReview: false,
      lead: null,
      leads: [],
      sheet: null,
      calendarProposal
    };
  }
  if (action === "propose_fields") {
    const next = await patchProposalFields(ctx, proposal.id, fields ?? {});
    return {
      text: message,
      proposal: next,
      wrote: false,
      leftReview: false,
      lead: null,
      leads: [],
      sheet: null,
      calendarProposal
    };
  }
  if (action === "retry_processing") {
    const next = await retryProcessing(ctx, proposal.id);
    return {
      text: message,
      proposal: next,
      wrote: false,
      leftReview: false,
      lead: null,
      leads: [],
      sheet: null,
      calendarProposal
    };
  }
  if (action === "discard") {
    const next = await discardProposal(ctx, proposal.id);
    return {
      text: message,
      proposal: next,
      wrote: false,
      leftReview: true,
      lead: null,
      leads: [],
      sheet: null,
      calendarProposal
    };
  }

  const result = action === "skip"
    ? await skipNonConnect(ctx, proposal.id)
    : await approveProposal(ctx, proposal.id, action === "approve" ? fields : undefined);
  const applied = result.proposal.status === "applied";
  return {
    text: message,
    proposal: result.proposal,
    wrote: applied,
    leftReview: applied,
    lead: result.lead,
    leads: result.leads,
    sheet: result.sheet,
    calendarProposal
  };
}

export function isBootstrapTurn(messages: ReviewChatMessage[], bootstrap?: boolean): boolean {
  if (bootstrap) return true;
  return !messages.some((item) => item.role === "user");
}

function lastUserText(messages: ReviewChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return messages[index]!.content.trim();
  }
  return "";
}

/** Exact operator phrases from in-thread suggestions (and typed equivalents). */
export function intentFromUserMessage(
  text: string,
  proposal: PublicProposal
): { action: ReviewInterviewAction; fields?: WriteFieldsInput; message: string } | null {
  const value = text.trim().toLowerCase().replace(/[.!]+$/, "");
  if (!value) return null;
  if (
    value === "write this update" ||
    value === "write it" ||
    value === "approve" ||
    value === "confirm" ||
    value === "confirm the write" ||
    value === "yes write" ||
    value === "write to the sheet"
  ) {
    return { action: "approve", message: "Writing the update to the Sheet, then opening the next contact." };
  }
  if (value === "retry the sheet write" || value === "retry write") {
    return { action: "retry_write", message: "Retrying the same Sheet write." };
  }
  if (value === "retry later" || (value === "retry" && proposal.kind === "non_connect")) {
    return {
      action: "approve",
      fields: { call_status: "Retry" },
      message: "Marking this contact to retry. Nothing else was invented."
    };
  }
  if (value === "skip this contact" || value === "skip") {
    return { action: "skip", message: "Skipping this contact without changing semantic CRM fields." };
  }
  if (value === "discard this proposal" || value === "discard") {
    return { action: "discard", message: "Discarded the proposal. The Sheet was not written." };
  }
  return null;
}

export function resolveReviewTurn(
  messages: ReviewChatMessage[],
  proposal: PublicProposal
): { action: ReviewInterviewAction; fields?: WriteFieldsInput; message: string } | null {
  return intentFromUserMessage(lastUserText(messages), proposal);
}
