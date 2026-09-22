import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ProspectPreparation } from "../../shared/campaigns";
import type { PublicLead } from "../../shared/contracts";
import { finalizeCall, prepareLead, refreshLeads } from "./api";
import {
  callDisabledReason,
  cancelCallSession,
  createCallSession,
  type CallSessionView
} from "./calls";
import { connectTwilioCall, hangUpTwilioCall } from "../twilio/device";
import { callReviewPath } from "./openCallReview";
import { useSession } from "./session";

export function useLeadCall(lead: PublicLead | null, ready = true) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, pending, deviceStatus, runQueue, handleSkipLead, setReview, setLiveCall } = useSession();
  const [call, setCall] = useState<CallSessionView | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const callStarting = useRef(false);
  const [prepState, setPrepState] = useState<{
    key: string;
    result: ProspectPreparation | null;
    error: string | null;
    loading: boolean;
  } | null>(null);
  const preparationRequest = useRef<{ token: number; controller: AbortController } | null>(null);
  const preparationToken = useRef(0);

  const campaign = useMemo(
    () => data.campaigns.find((item) => item.id === data.selectedCampaignId) ?? data.campaigns[0],
    [data.campaigns, data.selectedCampaignId]
  );
  const twilioConfigured = data.twilio.status === "ok";
  const callActive = Boolean(call);
  const sheetBlocking = data.sheet.status === "error" || data.sheet.status === "unconfigured";

  const prepKey =
    campaign?.brief && lead
      ? JSON.stringify([
          campaign.id,
          campaign.version,
          lead.leadId,
          lead.company,
          lead.fullName,
          lead.role,
          lead.enrichment
        ])
      : "";
  const preparation = prepState?.key === prepKey ? prepState.result : null;
  const prepError = prepState?.key === prepKey ? prepState.error : null;
  const preparing = Boolean(prepKey && (!ready || prepState?.key !== prepKey || prepState.loading));

  const disabledReason = !ready
    ? "Loading lead"
    : !campaign
      ? "Create a campaign first"
      : campaign.brief && preparing
        ? null
        : campaign.brief && !preparation
          ? "Generate a call brief before calling"
          : callDisabledReason({
            twilioConfigured,
            deviceStatus,
            lead: lead ?? null,
            callActive,
            sheetStatus: data.sheet.status
          });

  useEffect(() => {
    setLiveCall(call);
    return () => setLiveCall(null);
  }, [call, setLiveCall]);

  const startPreparation = useCallback((force: boolean) => {
    if (!ready || !prepKey || !campaign || !lead || callActive) return undefined;
    preparationRequest.current?.controller.abort();
    const controller = new AbortController();
    const token = preparationToken.current + 1;
    preparationToken.current = token;
    preparationRequest.current = { token, controller };
    setPrepState((previous) => ({
      key: prepKey,
      result: previous?.key === prepKey ? previous.result : null,
      error: null,
      loading: true
    }));
    void prepareLead(campaign.id, lead.leadId, force, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted && preparationRequest.current?.token === token) {
          setPrepState({ key: prepKey, result, error: null, loading: false });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted && preparationRequest.current?.token === token) {
          setPrepState((previous) => ({
            key: prepKey,
            result: previous?.key === prepKey ? previous.result : null,
            error: previous?.key === prepKey && previous.result
              ? "Brief not updated. Previous preparation is still shown. Retry intentionally."
              : "Preparation failed. Retry to generate a brief.",
            loading: false
          }));
        }
      });
    return () => {
      controller.abort();
      if (preparationRequest.current?.token === token) {
        preparationRequest.current = null;
      }
    };
  }, [callActive, campaign?.id, lead?.leadId, prepKey, ready]);

  useEffect(() => startPreparation(false), [startPreparation]);

  async function onCall() {
    if (!ready || !lead || !data.selectedCampaignId || disabledReason || callStarting.current) return;
    callStarting.current = true;
    setStarting(true);
    setCallError(null);
    try {
      const session = await createCallSession(lead.leadId, data.selectedCampaignId, preparation?.id);
      setCall(session);
      try {
        await connectTwilioCall(session.id);
      } catch (connectError) {
        setCallError("Call connection was not confirmed. Check call history before intentionally trying again.");
        navigate(callReviewPath(session.id));
        await cancelCallSession(session.id);
        try {
          setReview(await finalizeCall(session.id));
          setCall(null);
          return;
        } catch {
          setCall(null);
        }
        throw connectError;
      }
    } catch (err) {
      setCallError("Call start was not confirmed. Check call history before intentionally trying again.");
    } finally {
      callStarting.current = false;
      setStarting(false);
    }
  }

  async function openReview(sessionId: string) {
    hangUpTwilioCall();
    navigate(callReviewPath(sessionId));
    try {
      const proposal = await finalizeCall(sessionId);
      setReview(proposal);
    } catch (err) {
      setCallError("Call ended, but review could not be prepared. Open the review again to check its status.");
    } finally {
      setCall(null);
    }
  }

  async function onSkip() {
    if (!lead) return;
    const result = await handleSkipLead(lead.leadId);
    // Home queue: stay on /leads so Skip only advances Up next.
    if (location.pathname === "/leads") return;
    if (result?.lead && result.lead.leadId !== lead.leadId) {
      navigate(`/leads/${encodeURIComponent(result.lead.leadId)}`);
    } else {
      navigate("/leads");
    }
  }

  function onRefresh() {
    void runQueue(() => refreshLeads(data.selectedCampaignId));
  }

  const opening =
    preparation?.brief.opening ??
    (preparing ? null : campaign?.strategy?.opening ?? campaign?.openingContext ?? null);
  const firstQuestion =
    preparation?.brief.questions.find((question) => question.required)?.prompt ??
    (preparing
      ? null
      : campaign?.requiredQuestions.find((question) => question.required)?.prompt ??
        campaign?.requiredQuestions[0]?.prompt ??
        null);

  return {
    campaign,
    call,
    setCall,
    callError,
    starting,
    pending,
    disabledReason,
    sheetBlocking,
    preparation,
    preparing,
    prepError,
    opening,
    firstQuestion,
    onCall,
    onSkip,
    onRefresh,
    openReview,
    regeneratePrep: () => {
      if (ready) void startPreparation(true);
    }
  };
}
