import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicLead } from "../../shared/contracts";
import { LEADS_PAGE_SIZE, leadsListQueryKey, type LeadSortKey } from "../../shared/leadsQueue";
import { fetchLeads } from "./api";

type Page = {
  key: string;
  rows: PublicLead[];
  nextCursor: string | null;
  total: number;
  queueSize: number;
  undialableCount: number;
};

export function usePaginatedLeads(input: {
  campaignId: string | null;
  query: string;
  dialableOnly: boolean;
  sortKey: LeadSortKey;
  sortDir: 1 | -1;
  enabled: boolean;
  queueStamp: string;
  limit?: number;
}) {
  const limit = input.limit ?? LEADS_PAGE_SIZE;
  const [debouncedQuery, setDebouncedQuery] = useState(input.query);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(input.query), 150);
    return () => window.clearTimeout(timer);
  }, [input.query]);
  const key = leadsListQueryKey({
    campaignId: input.campaignId, q: debouncedQuery, dialableOnly: input.dialableOnly,
    sort: input.sortKey, dir: input.sortDir
  });
  const displayKey = leadsListQueryKey({
    campaignId: input.campaignId, q: input.query, dialableOnly: input.dialableOnly,
    sort: input.sortKey, dir: input.sortDir
  });
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [moreError, setMoreError] = useState<{ key: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const moreBusy = useRef(false);
  const pageRef = useRef(page);
  pageRef.current = page;
  const currentKey = useRef(displayKey);
  currentKey.current = displayKey;
  const currentStamp = useRef(input.queueStamp);
  currentStamp.current = input.queueStamp;
  const pageForContext = input.enabled && page?.key === displayKey ? page : null;

  useEffect(() => {
    const token = ++generation.current;
    moreBusy.current = false;
    setLoadingMore(false);
    if (!input.enabled) {
      setLoading(false);
      setError(null);
      setMoreError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setMoreError(null);
    void fetchLeads({
      campaignId: input.campaignId, q: debouncedQuery, dialableOnly: input.dialableOnly,
      sort: input.sortKey, dir: input.sortDir, cursor: null, limit, signal: controller.signal
    }).then((result) => {
      if (controller.signal.aborted || token !== generation.current || key !== currentKey.current) return;
      setPage({ key, rows: result.leads, nextCursor: result.nextCursor,
        total: result.total, queueSize: result.queueSize, undialableCount: result.undialableCount });
    }).catch(() => {
      if (!controller.signal.aborted && token === generation.current && key === currentKey.current) {
        setError({ key, message: pageRef.current?.key === key ? "Queue not updated. Previous contacts are still shown." : "Could not load contacts for this selection." });
      }
    }).finally(() => {
      if (!controller.signal.aborted && token === generation.current) setLoading(false);
    });
    return () => { controller.abort(); generation.current++; };
  }, [input.enabled, input.campaignId, input.dialableOnly, input.sortKey, input.sortDir, input.queueStamp, debouncedQuery, limit, key, retry]);

  const loadMore = useCallback(() => {
    const current = pageRef.current;
    if (!input.enabled || !current || current.key !== currentKey.current || !current.nextCursor || moreBusy.current) return;
    const token = generation.current;
    const stamp = currentStamp.current;
    const cursor = current.nextCursor;
    moreBusy.current = true;
    setLoadingMore(true);
    setMoreError(null);
    void fetchLeads({ campaignId: input.campaignId, q: debouncedQuery,
      dialableOnly: input.dialableOnly, sort: input.sortKey, dir: input.sortDir, cursor, limit
    }).then((result) => {
      if (token !== generation.current || current.key !== currentKey.current || stamp !== currentStamp.current) return;
      setPage((previous) => {
        if (!previous || previous.key !== current.key || previous.nextCursor !== cursor) return previous;
        const seen = new Set(previous.rows.map((lead) => lead.leadId));
        return { key: current.key, rows: [...previous.rows, ...result.leads.filter((lead) => !seen.has(lead.leadId))],
          nextCursor: result.nextCursor, total: result.total, queueSize: result.queueSize,
          undialableCount: result.undialableCount };
      });
    }).catch(() => {
      if (token === generation.current && current.key === currentKey.current && stamp === currentStamp.current) {
        setMoreError({ key: current.key, message: "More contacts were not loaded. Previous contacts are still shown." });
      }
    }).finally(() => {
      if (token === generation.current && stamp === currentStamp.current) {
        moreBusy.current = false;
        setLoadingMore(false);
      }
    });
  }, [input.enabled, input.campaignId, input.dialableOnly, input.sortKey, input.sortDir, debouncedQuery, limit]);

  const contextError = error?.key === displayKey ? error.message : null;
  return {
    rows: pageForContext?.rows ?? [], nextCursor: pageForContext?.nextCursor ?? null,
    hasMore: Boolean(pageForContext?.nextCursor), total: pageForContext?.total ?? 0,
    queueSize: pageForContext?.queueSize ?? 0, undialableCount: pageForContext?.undialableCount ?? 0,
    loading: loading || (input.enabled && displayKey !== key), initialLoading: !pageForContext && input.enabled && !contextError,
    loadingMore, error: contextError, moreError: moreError?.key === displayKey ? moreError.message : null,
    loadMore, retry: () => setRetry((value) => value + 1),
    retryMore: () => { setMoreError(null); loadMore(); }
  };
}
