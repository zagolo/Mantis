import { expect, test as base } from "@playwright/test";
import { startE2eServer, type E2eServer } from "./server.js";
import { signIn } from "./auth.js";

const test = base.extend<{ server: E2eServer }>({
  server: async ({}, use) => {
    const server = await startE2eServer({ initialCampaigns: [] });
    await use(server);
    await server.close();
  }
});

test("create account, land in the app, then sign out", async ({ page, server }) => {
  await page.goto(server.baseURL);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: /switch to (light|dark) theme/i })).toHaveCount(0);
  await page.getByRole("link", { name: "Create one" }).click();
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await page.getByLabel("Email").fill("new-operator@test.local");
  await page.getByLabel("Password", { exact: true }).fill("new-password");
  await page.getByLabel("Confirm password").fill("new-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("link", { name: "Mantis" })).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByText("new-operator@test.local")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await signIn(page, server.baseURL, { email: "new-operator@test.local", password: "new-password" });
  await expect(page.getByRole("heading", { name: "Create a campaign" }).first()).toBeVisible();
});
