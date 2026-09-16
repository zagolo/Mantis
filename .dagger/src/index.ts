import { dag, Directory, func, object } from "@dagger.io/dagger";

@object()
export class Mantis {
  /** Native repository checks, using fake providers and no external credentials. */
  @func()
  async qualification(
    /**
     * Repository source, excluding local credentials and generated state below.
     * +defaultPath="/"
     */
    source: Directory,
  ): Promise<string> {
    return dag.container()
      .from("docker.io/library/node:22-bookworm@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d")
      .withDirectory("/app", source, {
        exclude: [".git", ".devenv", ".direnv", ".dagger", "node_modules", "dist", ".env", ".env.*", "data", "recordings", "transcripts", ".firecrawl", "config/sheets.yaml", "test-results", "playwright-report"],
      })
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withEnvVariable("NODE_ENV", "development")
      .withExec(["npm", "ci", "--include=dev"])
      .withExec(["npm", "run", "typecheck"])
      .withExec(["npm", "test"])
      .withExec(["npm", "run", "build"])
      .withExec(["npx", "--no-install", "playwright", "install", "--with-deps", "chromium"])
      .withExec(["npm", "run", "test:e2e"])
      .withExec(["node", "-e", "console.log('Typecheck, unit/integration tests, production build, and fake-provider browser tests completed.')"])
      .stdout();
  }
}
