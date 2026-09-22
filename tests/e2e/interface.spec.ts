import { expect, test as base } from "@playwright/test";
import { startE2eServer, type E2eServer } from "./server.js";
import { signIn } from "./auth.js";

const test = base.extend<{ server: E2eServer }>({
  server: async ({}, use) => {
    const server = await startE2eServer();
    await use(server);
    await server.close();
  }
});

test("dark from first paint with legacy preferences; routes remain usable at 360 and 1440", async ({ page, server }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("mantis-theme", "light"));
  await page.goto(`${server.baseURL}/login`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await signIn(page, server.baseURL);
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const route of ["/leads", "/analytics", "/notifications", "/settings", "/leads/L-100"]) {
      await page.goto(`${server.baseURL}${route}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.getByRole("main")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    const dialButton = page.getByRole("button", { name: "Dial a number" });
    await dialButton.click();
    const dialog = page.getByRole("dialog", { name: "Dial a number" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await expect.poll(() => dialog.evaluate((el) => {
      const bounds = el.getBoundingClientRect();
      return bounds.left >= -1 && bounds.right <= innerWidth + 1;
    })).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(dialButton).toBeFocused();
  }
  await page.evaluate(() => { localStorage.setItem("mantis-theme", "light"); window.dispatchEvent(new StorageEvent("storage", { key: "mantis-theme", newValue: "light" })); });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).not.toHaveClass(/\blight\b/);
});

test("session check failure keeps protected content private and retry recovers", async ({ page, server }) => {
  let unavailable = true;
  await page.route("**/api/session", (route) => unavailable
    ? route.fulfill({ status: 503, body: "Unavailable" })
    : route.continue());
  await page.goto(`${server.baseURL}/leads`);
  await expect(page.getByRole("heading", { name: "Could not load Mantis" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Leads" })).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Retry loading workspace" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, server.baseURL);
  await expect(page.getByRole("main")).toBeVisible();
});

test("late queue and analytics results cannot replace the selected context", async ({ page, server }) => {
  await signIn(page, server.baseURL);
  await page.getByLabel("Campaign", { exact: true }).click();
  await page.getByRole("option", { name: "Lamina founder sales", exact: true }).click();
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Alex Rivera");
  let releaseQueue!: () => void;
  const heldQueue = new Promise<void>((resolve) => { releaseQueue = resolve; });
  await page.route("**/api/leads?*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") === "Alex") {
      await heldQueue;
    }
    await route.continue().catch(() => undefined);
  });
  const oldRequest = page.waitForRequest((request) => request.url().includes("/api/leads?") && new URL(request.url()).searchParams.get("q") === "Alex");
  await page.getByLabel("Search leads").fill("Alex");
  await oldRequest;
  await expect(page.getByLabel("Search leads")).toHaveValue("Alex");
  await page.getByLabel("Search leads").fill("Jordan");
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Jordan Chen");
  releaseQueue();
  await expect(page.getByRole("table", { name: "Leads" })).not.toContainText("Alex Rivera");
  await page.goto(`${server.baseURL}/analytics`);
  let releaseSummary!: () => void;
  const heldSummary = new Promise<void>((resolve) => { releaseSummary = resolve; });
  let hold = true;
  await page.route("**/api/summary?*", async (route) => {
    if (hold && new URL(route.request().url()).searchParams.get("date") !== null) {
      hold = false;
      await heldSummary;
    }
    await route.continue().catch(() => undefined);
  });
  const summaryRequest = page.waitForRequest((request) => request.url().includes("/api/summary?") && new URL(request.url()).searchParams.has("date"));
  await page.getByRole("button", { name: "Yesterday" }).click();
  await summaryRequest;
  await page.getByRole("button", { name: "Today" }).click();
  releaseSummary();
  await expect(page.getByRole("button", { name: "Today" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
});

test("ready-only emptiness explains phone fixes and broadens without starting a call", async ({ page, server }) => {
  await signIn(page, server.baseURL);
  await page.route("**/api/leads?*", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    if (new URL(route.request().url()).searchParams.get("dialable") === "1") {
      await route.fulfill({ response, json: { ...body, leads: [], total: 0, queueSize: 3, undialableCount: 3, nextCursor: null } });
    } else {
      await route.fulfill({ response, json: body });
    }
  });
  await page.getByLabel("Campaign", { exact: true }).click();
  await page.getByRole("option", { name: "Lamina founder sales", exact: true }).click();
  await page.getByRole("checkbox", { name: "Ready to call" }).uncheck();
  await page.getByRole("checkbox", { name: "Ready to call" }).check();
  await expect(page.getByText("No dialable leads")).toBeVisible();
  await page.getByRole("button", { name: "Show contacts that need a phone fix" }).click();
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Alex Rivera");
  await expect(page.getByRole("button", { name: "Call", exact: true })).toHaveCount(0);
});

test("queue pagination retains rows on failure and retry does not duplicate them", async ({ page, server }) => {
  await signIn(page, server.baseURL);
  await page.goto(`${server.baseURL}/leads?pageSize=1`);
  let rejectMore = true;
  await page.route("**/api/leads?*", (route) => {
    if (rejectMore && new URL(route.request().url()).searchParams.has("cursor")) {
      return route.fulfill({ status: 503, body: "Unavailable" });
    }
    return route.continue();
  });
  await page.getByLabel("Campaign", { exact: true }).click();
  await page.getByRole("option", { name: "Lamina founder sales", exact: true }).click();
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Alex Rivera");
  await expect(page.getByRole("alert")).toContainText("More contacts were not loaded");
  await expect(page.getByRole("table", { name: "Leads" }).getByRole("row")).toHaveCount(2);
  rejectMore = false;
  await page.getByRole("button", { name: "Retry loading contacts" }).click();
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Jordan Chen");
  const names = await page.getByRole("table", { name: "Leads" }).getByRole("link", { name: /Open (Alex Rivera|Jordan Chen)/ }).allTextContents();
  expect(names).toEqual(["Alex Rivera", "Jordan Chen"]);
});

test("queue and analytics reads distinguish initial wait, stale refresh and recovery", async ({ page, server }) => {
  await signIn(page, server.baseURL);
  await page.getByLabel("Campaign", { exact: true }).click();
  await page.getByRole("option", { name: "Lamina founder sales", exact: true }).click();
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Alex Rivera");
  let reject = true;
  await page.route("**/api/leads?*", (route) => reject ? route.fulfill({ status: 503, body: "Unavailable" }) : route.continue());
  await page.getByLabel("Search leads").fill("Jordan");
  await expect(page.getByRole("alert")).toContainText("Could not load contacts for this selection.");
  await expect(page.getByRole("table", { name: "Leads" })).toHaveCount(0);
  reject = false;
  await page.getByRole("button", { name: "Retry loading contacts" }).click();
  await expect(page.getByRole("table", { name: "Leads" })).toContainText("Jordan Chen");
  await expect(page.getByLabel("Search leads")).toHaveValue("Jordan");
  await page.goto(`${server.baseURL}/analytics`);
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await page.route("**/api/summary?*", (route) => reject ? route.fulfill({ status: 503, body: "Unavailable" }) : route.continue());
  reject = true;
  await page.getByRole("button", { name: "Yesterday" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not load analytics");
  reject = false;
  await page.getByRole("button", { name: "Retry analytics" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
