import { describe, expect, it } from "vitest";
import { resolveTheme } from "../../src/client/theme.js";

describe("appearance", () => {
  it("always resolves dark, irrespective of ambient preference", () => {
    expect(resolveTheme()).toBe("dark");
  });
});
