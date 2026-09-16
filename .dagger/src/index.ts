import { dag, Directory, func, object } from "@dagger.io/dagger";

@object()
export class Mantis {
  /** Repository checks with fake providers only; no live integration validation. */
  @func()
  async qualification(
    /**
     * Checkout to qualify.
     * @defaultPath "/"
     */
    source: Directory,
  ): Promise<string> {
    const checked = dag.container()
      .from("docker.io/library/node:22-bookworm@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d")
      .withDirectory("/app", source, {
        exclude: [".git", ".env", ".env.*", ".devenv", "node_modules", "dist", "test-results", "playwright-report", "data"],
      })
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withEnvVariable("SHEETS_BACKEND", "memory")
      .withExec(["npm", "ci", "--no-audit", "--no-fund"])
      .withExec(["npm", "run", "typecheck"])
      .withExec(["npm", "run", "build"])
      .withExec(["npm", "test"])
      .withExec(["npx", "--no-install", "playwright", "install", "--with-deps", "chromium"])
      .withExec(["npm", "run", "test:e2e"]);
    await checked.sync();
    return "Typecheck, production client build, Vitest, and fake-provider Playwright checks passed. Live integrations were not validated.";
  }
}
