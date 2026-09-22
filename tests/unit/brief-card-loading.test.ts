import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BriefCardSkeleton, BriefLoading, bootSkeleton } from "../../src/client/components/LoadingSkeleton.js";

describe("brief card loading geometry", () => {
  it("fills the pane with a labeled, still placeholder while researching", () => {
    const markup = renderToStaticMarkup(BriefLoading({}));
    expect(markup).toContain("AI prospect brief");
    expect(markup).toContain("data-brief-state=\"loading\"");
    expect(markup).toContain("Preparing the prospect brief");
    expect(markup).toContain("flex h-full min-h-0 flex-col overflow-hidden");
    expect(markup).toContain("bg-surface");

    expect(markup).not.toContain("Say this");

    expect(markup).not.toContain("animate-spin");

  });

  it("renders preparation failures as an actionable error instead of loading", () => {
    const markup = renderToStaticMarkup(BriefLoading({ error: "Preparation failed", action: "Retry preparation" }));
    expect(markup).toContain("role=\"alert\"");
    expect(markup).toContain("data-brief-state=\"error\"");
    expect(markup).toContain("Preparation failed");
    expect(markup).toContain("Retry preparation");
    expect(markup).not.toContain("aria-busy=\"true\"");

  });

  it("keeps the lead boot brief on the same locked card", () => {
    const boot = renderToStaticMarkup(bootSkeleton("/leads/L-1"));
    const skeleton = renderToStaticMarkup(BriefCardSkeleton());
    expect(boot).toContain("data-brief-state=\"loading\"");
    expect(boot).toContain("Preparing the prospect brief");
    expect(skeleton).toContain("flex h-full min-h-0 flex-col overflow-hidden");


  });
});
