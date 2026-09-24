import { useRef, useState } from "react";
import { Alert, Button, Input } from "@heroui/react";
import type { SheetInfo } from "../../shared/contracts";
import { DEFAULT_SHEET_TITLE, EMPTY_COPY } from "../copy";
import { SCROLL } from "../layout/shell";
import { createLeadsSheet, linkLeadsSheet } from "../state/api";

const fieldClass = "flex flex-col gap-2";

export function SheetConnect({
  sheet,
  requestId,
  campaignId,
  onBusy,
  onBound
}: {
  sheet: SheetInfo;
  requestId: string;
  campaignId?: string;
  onBusy: (busy: boolean) => void;
  onBound: (next: SheetInfo) => Promise<void>;
}) {
  const copy = EMPTY_COPY.sheetConnect;
  const [mode, setMode] = useState<"choose" | "link" | "create">("choose");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState(DEFAULT_SHEET_TITLE);
  const [shareEmail, setShareEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const sampleAvailable = sheet.backend === "memory";
  const googleReady = sheet.manageable;
  const target = { requestId, campaignId };

  async function run(action: () => Promise<SheetInfo>) {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    onBusy(true);
    setError(null);
    let confirmed = false;
    try {
      const result = await action();
      confirmed = true;
      await onBound(result);
    } catch {
      setError(confirmed
        ? "Sheet connection was confirmed, but the workspace did not update. Check the connection before retrying."
        : "Sheet connection was not confirmed. Check the Sheet before intentionally retrying.");
    } finally {
      submitting.current = false;
      setPending(false);
      onBusy(false);
    }
  }

  return (
    <div className={`flex h-full min-h-0 flex-col gap-5 ${SCROLL}`}>
      <p className="max-w-[32em] text-sm leading-relaxed text-muted">{copy.description}</p>
      {error ? (
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {!googleReady && !sampleAvailable ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{copy.googleMissing}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}

      {mode === "choose" ? (
        <div className="flex flex-col gap-3">
          {sampleAvailable ? (
            <div className="flex w-full flex-col gap-2 rounded-lg bg-surface p-4 text-left shadow-sm">
              <p className="font-semibold">{copy.sampleLeads}</p>
              <p className="text-sm leading-relaxed text-muted">{copy.sampleLeadsHint}</p>
              <div className="pt-1">
                <Button
                  className="rounded-lg!"
                  isDisabled={pending}
                  isPending={pending}
                  onPress={() => {
                    void run(async () => (await createLeadsSheet({ title, ...target })).sheet);
                  }}
                >
                  {copy.sampleLeads}
                </Button>
              </div>
            </div>
          ) : null}
          {googleReady ? (
            <>
              <Button type="button" variant="secondary" className="h-auto w-full flex-col items-start gap-2 whitespace-normal p-4 text-left" isDisabled={pending} onPress={() => setMode("link")}>
                <span className="font-semibold">{copy.linkExisting}</span>
                <span className="text-sm leading-relaxed text-muted">
                  Use a spreadsheet you already keep leads in.
                </span>
              </Button>
              <Button type="button" variant="secondary" className="h-auto w-full flex-col items-start gap-2 whitespace-normal p-4 text-left" isDisabled={pending} onPress={() => setMode("create")}>
                <span className="font-semibold">{copy.createNew}</span>
                <span className="text-sm leading-relaxed text-muted">
                  Create one with the Mantis headers.
                </span>
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {mode === "link" && googleReady ? (
        <form
          className="flex max-w-lg flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => (await linkLeadsSheet(url, target)).sheet);
          }}
        >
          <label className={fieldClass} htmlFor="sheet-url">
            <span className="text-sm font-semibold">{copy.urlLabel}</span>
            <Input
              id="sheet-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={copy.urlPlaceholder}
              autoComplete="off"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="rounded-lg!" isDisabled={pending || url.trim().length < 8} isPending={pending}>
              {copy.linkAction}
            </Button>
            <Button type="button" variant="tertiary" isDisabled={pending} onPress={() => setMode("choose")}>Back</Button>
          </div>
        </form>
      ) : null}

      {mode === "create" && googleReady ? (
        <form
          className="flex max-w-lg flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => (await createLeadsSheet({
              title,
              shareEmail: shareEmail.trim() || undefined,
              ...target
            })).sheet);
          }}
        >
          <label className={fieldClass} htmlFor="sheet-title">
            <span className="text-sm font-semibold">{copy.titleLabel}</span>
            <Input
              id="sheet-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className={fieldClass} htmlFor="sheet-email">
            <span className="text-sm font-semibold">{copy.shareLabel}</span>
            <Input
              id="sheet-email"
              type="email"
              value={shareEmail}
              onChange={(event) => setShareEmail(event.target.value)}
            />
            <span className="text-sm text-muted">{copy.shareHint}</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="rounded-lg!" isDisabled={pending || title.trim().length < 1} isPending={pending}>
              {copy.createAction}
            </Button>
            <Button type="button" variant="tertiary" isDisabled={pending} onPress={() => setMode("choose")}>Back</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
