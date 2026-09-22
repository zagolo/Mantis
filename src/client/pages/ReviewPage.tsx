import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../state/session";
import { fetchProposalBySession } from "../state/api";
import { ReviewChat } from "../components/ReviewChat";
import { EmptyState } from "../components/EmptyState";
import { ReviewSkeleton } from "../components/LoadingSkeleton";
import { EMPTY_COPY, PAGE_TITLES } from "../copy";
import { usePageTitle } from "../usePageTitle";
import type { PublicProposal } from "../../shared/contracts";

const PROPOSAL_WAIT_MS = 45_000;
const PROPOSAL_POLL_MS = 400;

async function waitForProposal(sessionId: string, isCancelled: () => boolean): Promise<PublicProposal> {
  const deadline = Date.now() + PROPOSAL_WAIT_MS;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    if (isCancelled()) {
      throw lastError ?? new Error("Proposal is not ready");
    }
    try {
      return await fetchProposalBySession(sessionId);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Proposal is not ready");
      if (!/not ready/i.test(lastError.message)) {
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, PROPOSAL_POLL_MS));
    }
  }
  throw lastError ?? new Error("Proposal is not ready");
}

export function ReviewPage() {
  const { sessionId } = useParams();
  const { setReview, afterWrite, pending, error, refresh } = useSession();
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{ sessionId: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const currentProposal = proposal?.sessionId === sessionId ? proposal : null;
  const navigate = useNavigate();
  usePageTitle(PAGE_TITLES.review(currentProposal?.contactName));

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    void waitForProposal(sessionId, () => cancelled)
      .then((result) => {
        if (cancelled) return;
        setProposal(result);
        setReview(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchError({ sessionId, message: "Review could not load. No Sheet changes were authorized." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, retry]);

  if (!sessionId) {
    return (
      <div>
        <div className="mt-8">
          <EmptyState
            icon="review"
            title={EMPTY_COPY.reviewSession.title}
            description={EMPTY_COPY.reviewSession.description}
            action={
              <Link to="/leads" className="text-sm font-medium underline underline-offset-2">
                Back to ready
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (loading && !currentProposal) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ReviewSkeleton />
      </div>
    );
  }

  if (fetchError?.sessionId === sessionId || !currentProposal) {
    return (
      <div>
        <div className="mt-8">
          <EmptyState
            icon="review"
            title={EMPTY_COPY.reviewMissing.title}
            description={fetchError?.sessionId === sessionId ? fetchError.message : EMPTY_COPY.reviewMissing.description}
            action={<><button type="button" className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground" onClick={() => setRetry((value) => value + 1)}>Retry loading review</button>
              <Link to="/leads" className="text-sm font-medium underline underline-offset-2">Back to queue</Link></>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? <p role="status" className="text-sm text-muted">Updating review…</p> : null}
        <ReviewChat
          key={sessionId}
          proposal={currentProposal}
          pending={pending}
          error={error}
          onProposal={(next) => {
            setProposal(next);
            setReview(next);
          }}
          onFinished={async (path, result) => {
            if (result.sheet) {
              await afterWrite({
                proposal: result.proposal,
                lead: result.lead,
                leads: result.leads,
                sheet: result.sheet
              });
            } else {
              setReview(null);
              await refresh();
            }
            navigate(path);
          }}
        />
      </div>
    </div>
  );
}
