import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Button } from "@heroui/react";
import { useSession } from "../state/session";
import { EmptyState } from "../components/EmptyState";
import { LeadsTable, type LeadSortKey } from "../components/LeadsTable";
import { QueueTableSkeleton } from "../components/LoadingSkeleton";
import type { PublicLead } from "../../shared/contracts";
import { AI_DISCONNECTED_COPY, EMPTY_COPY, PAGE_TITLES, QUEUE_COPY } from "../copy";
import { refreshLeads } from "../state/api";
import { usePaginatedLeads } from "../state/usePaginatedLeads";
import { usePageTitle } from "../usePageTitle";
import { clampLeadsLimit } from "../../shared/leadsQueue";

export function LeadsPage() {
  const { data, queueRevision, pending, campaignBusy, setEditor, runQueue, handleSkipLead } = useSession();
  usePageTitle(PAGE_TITLES.home);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [dialableOnly, setDialableOnly] = useState(true);
  const [sortKey, setSortKey] = useState<LeadSortKey>("queue");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const nextLead = data.leads.find((item) => item.dialable) ?? null;
  const campaign = data.campaigns.find((item) => item.id === data.selectedCampaignId) ?? data.campaigns[0];
  const sheetBlocking = data.sheet.status === "error" || data.sheet.status === "unconfigured";

  function onRefresh() {
    void runQueue(() => refreshLeads(data.selectedCampaignId));
  }

  function onSkip() {
    if (nextLead) void handleSkipLead(nextLead.leadId);
  }

  const sheetUnconfigured = sheetBlocking;
  const queueStamp = `${data.selectedCampaignId}:${queueRevision}`;
  const page = usePaginatedLeads({
    campaignId: data.selectedCampaignId,
    query,
    dialableOnly,
    sortKey,
    sortDir,
    enabled: Boolean(data.selectedCampaignId) && !sheetUnconfigured,
    queueStamp,
    limit: clampLeadsLimit(searchParams.get("pageSize"))
  });
  const visible = page.rows;
  const undialableCount = page.undialableCount;
  const tableEmpty = !page.initialLoading && !page.error && !page.loading && visible.length === 0
    ? query.trim()
      ? EMPTY_COPY.search
      : dialableOnly
        ? EMPTY_COPY.dialableFilter
        : EMPTY_COPY.queue
    : null;

  function toggleSort(key: LeadSortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5 lg:overflow-hidden">
      {!campaign ? (
        <div className="pt-6">
          <EmptyState
            icon="campaign"
            title={EMPTY_COPY.campaign.title}
            description={EMPTY_COPY.campaign.description}
            action={<Button className="rounded-lg!" onPress={() => setEditor("new")}>Create a campaign</Button>}
          />
        </div>
      ) : sheetUnconfigured ? (
        <div className="pt-6">
          <EmptyState
            icon="sheet"
            title={EMPTY_COPY.sheet.title}
            description={data.sheet.message || EMPTY_COPY.sheet.description}
            action={
              <Button className="rounded-lg!" onPress={() => setEditor(campaign.brief ? "edit" : "new")}>
                Open Sheet connection
              </Button>
            }
          />
        </div>
      ) : page.queueSize === 0 && !page.initialLoading && !page.error && !page.loading && !query.trim() ? (
        <div className="pt-6">
          <EmptyState
            icon="leads"
            title={EMPTY_COPY.queue.title}
            description={EMPTY_COPY.queue.description}
            action={<div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="rounded-lg!" isDisabled={pending || campaignBusy} onPress={onRefresh}>
                {pending ? "Refreshing contacts…" : "Refresh contacts"}
              </Button>
              <Button variant="outline" className="rounded-lg!" onPress={() => setEditor("edit")}>Check Sheet connection</Button>
            </div>}
          />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
          <QueueAlerts
            aiStatus={data.ai.status}
            aiMessage={data.ai.message}
            researchStatus={data.research.status}
            researchMessage={data.research.message}
          />
          {page.error || page.moreError ? (
            <Alert status="danger" role="alert"><Alert.Indicator /><Alert.Content>
              <Alert.Title>{page.error ?? page.moreError}</Alert.Title>
              <Button size="sm" variant="outline" onPress={page.moreError ? page.retryMore : page.retry}>Retry loading contacts</Button>
            </Alert.Content></Alert>
          ) : null}
          <LeadsQueue
            query={query}
            setQuery={setQuery}
            dialableOnly={dialableOnly}
            setDialableOnly={setDialableOnly}
            sortKey={sortKey}
            sortDir={sortDir}
            toggleSort={toggleSort}
            visible={visible}
            leadsCount={page.total}
            undialableCount={undialableCount}
            tableEmpty={tableEmpty}
            hasMore={page.hasMore}
            loadingMore={page.loadingMore}
            updating={page.loading}
            initialLoading={page.initialLoading}
            onLoadMore={page.moreError ? undefined : page.loadMore}
            onRefresh={onRefresh}
            refreshDisabled={pending || campaignBusy}
            nextLeadId={nextLead?.leadId ?? null}
            onSkip={onSkip}
            skipDisabled={pending || sheetBlocking}
          />
        </div>
      )}
    </div>
  );
}

function QueueAlerts({
  aiStatus,
  aiMessage,
  researchStatus,
  researchMessage,
}: {
  aiStatus: string;
  aiMessage: string;
  researchStatus: string;
  researchMessage: string;
}) {
  return (
    <>
      {aiStatus !== "ok" ? (
        <Alert status="warning" role="status">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{aiMessage.includes("LLM_") ? AI_DISCONNECTED_COPY : aiMessage}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {researchStatus !== "ok" && aiStatus === "ok" ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{researchMessage}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
    </>
  );
}

function LeadsQueue({
  query,
  setQuery,
  dialableOnly,
  setDialableOnly,
  sortKey,
  sortDir,
  toggleSort,
  visible,
  leadsCount,
  undialableCount,
  tableEmpty,
  hasMore,
  loadingMore,
  updating,
  initialLoading,
  onLoadMore,
  onRefresh,
  refreshDisabled,
  nextLeadId,
  onSkip,
  skipDisabled
}: {
  query: string;
  setQuery: (value: string) => void;
  dialableOnly: boolean;
  setDialableOnly: (value: boolean) => void;
  sortKey: LeadSortKey;
  sortDir: 1 | -1;
  toggleSort: (key: LeadSortKey) => void;
  visible: PublicLead[];
  leadsCount: number;
  undialableCount: number;
  tableEmpty: { title: string; description: string } | null;
  hasMore: boolean;
  loadingMore: boolean;
  updating: boolean;
  initialLoading: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  nextLeadId: string | null;
  onSkip: () => void;
  skipDisabled: boolean;
}) {
  return (
    <section aria-label={QUEUE_COPY.section} className="flex min-h-0 min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-1">
        <label className="min-w-0 flex-1 basis-48 text-sm">
          <span className="sr-only">Search leads</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, company, phone…"
            aria-label="Search leads"
            className="field-quiet w-full rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-[var(--field-placeholder)]"
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={dialableOnly}
              aria-label="Ready to call"
              className="size-3.5 accent-[var(--accent)]"
              onChange={(event) => setDialableOnly(event.target.checked)}
            />
            Ready
          </label>
          {undialableCount > 0 ? (
            <Link
              to="/notifications#queue"
              className="inline-flex min-h-11 items-center hover:text-foreground hover:underline hover:underline-offset-4"
            >
              {undialableCount} need a phone fix
            </Link>
          ) : null}
          <div className="flex items-center gap-0.5" role="group" aria-label="Sort leads">
            {([["queue", "Queue"], ["name", "Name"], ["company", "Company"], ["status", "Status"]] as Array<[LeadSortKey, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={sortKey === key}
                className={`min-h-11 px-1.5 ${sortKey === key ? "font-semibold text-foreground" : "hover:text-foreground"}`}
                onClick={() => toggleSort(key)}
              >
                {label}{sortKey === key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
              </button>
            ))}
          </div>
          {onRefresh ? (
            <button
              type="button"
              className="min-h-11 font-semibold hover:text-foreground hover:underline hover:underline-offset-4 disabled:opacity-50"
              disabled={refreshDisabled}
              onClick={onRefresh}
            >
              {refreshDisabled ? "Refreshing…" : "Refresh"}
            </button>
          ) : null}
        </div>
      </div>
      {updating && visible.length > 0 ? <p role="status" className="px-2 text-sm text-muted">Updating contacts…</p> : null}
      <p className="sr-only" aria-live="polite">
        {visible.length} of {leadsCount}
      </p>
      {initialLoading ? (
        <div role="status" aria-label="Loading contacts for this campaign">
          <p className="mb-3 text-sm text-muted">Loading contacts for this campaign…</p>
          <QueueTableSkeleton />
        </div>
      ) : <LeadsTable
        leads={visible}
        nextLeadId={nextLeadId}
        onSkip={onSkip}
        skipDisabled={skipDisabled}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        empty={
          tableEmpty ? (
            <EmptyState
              compact
              icon={query.trim() ? "search" : "leads"}
              title={tableEmpty.title}
              description={tableEmpty.description}
              action={
                query.trim() ? (
                  <Button variant="outline" size="sm" onPress={() => setQuery("")}>
                    Clear search
                  </Button>
                ) : dialableOnly && undialableCount > 0 ? (
                  <Button variant="outline" size="sm" onPress={() => setDialableOnly(false)}>
                    Show contacts that need a phone fix
                  </Button>
                ) : !dialableOnly ? (
                  <Button variant="outline" size="sm" onPress={onRefresh} isDisabled={refreshDisabled}>
                    {refreshDisabled ? "Refreshing…" : "Refresh contacts"}
                  </Button>
                ) : null
              }
            />
          ) : null
        }
      />}
    </section>
  );
}
