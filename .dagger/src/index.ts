import { dag, Directory, func, object } from "@dagger.io/dagger";

@object()
export class Mantis {
  /** Run the repository's native checks with faked providers and no live credentials. */
  @func()
  async qualification(
    /** Repository checkout to qualify.
     * @defaultPath / 
     */
    source: Directory,
  ): Promise<string> {
    return dag.container()
      .from("docker.io/library/node:22-bookworm@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d")
      .withDirectory("/app", source, {
        exclude: [".git", ".devenv", "node_modules", "dist", ".env", ".env.*", "data", "test-results", "playwright-report"],
      })
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withExec(["npm", "ci"])
      .withExec(["npm", "run", "typecheck"])
      .withExec(["npm", "test"])
      .withExec(["npm", "run", "build"])
      .withExec(["npx", "--no-install", "playwright", "install", "--with-deps", "chromium"])
      .withExec(["npm", "run", "test:e2e"])
      .stdout();
  }
}
