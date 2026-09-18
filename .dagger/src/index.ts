import { dag, Directory, func, object } from "@dagger.io/dagger";

const nodeImage =
  "docker.io/library/node:22-bookworm@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d";
const semgrepImage =
  "docker.io/semgrep/semgrep:1.146.0@sha256:15c3954ba7e0f8ade909e021d85a7c448909d25e1453a1f3e2d3fe8ec2bd5800";

@object()
export class Mantis {
  /** Run every tracked Semgrep rule against the repository source. */
  @func()
  async semgrep(
    /** +defaultPath="/" */
    source: Directory,
  ): Promise<string> {
    return dag
      .container()
      .from(semgrepImage)
      .withDirectory("/src", source, { exclude: [".git", ".dagger", "node_modules", "dist"] })
      .withWorkdir("/src")
      .withExec(["semgrep", "scan", "--config", ".semgrep", "--error", "--exclude", ".semgrep/**"])
      .stdout();
  }

  /** Validate the tracked Alint contract without requiring product dependencies. */
  @func()
  async alint(
    /** +defaultPath="/" */
    source: Directory,
  ): Promise<string> {
    return dag
      .container()
      .from(nodeImage)
      .withDirectory("/src", source, { exclude: [".git", "node_modules", "dist"] })
      .withWorkdir("/src")
      .withExec([
        "node",
        "-e",
        "const fs=require('fs'); const text=fs.readFileSync('.alint.yml','utf8'); if (!text.includes('alint://bundled/hygiene/no-tracked-artifacts@v1') || !text.includes('alint://bundled/agent-hygiene@v1')) process.exit(1); console.log('alint configuration validated');",
      ])
      .stdout();
  }

  /** Validate the tracked ls-lint contract and its conservative .dagger scope. */
  @func()
  async lsLint(
    /** +defaultPath="/" */
    source: Directory,
  ): Promise<string> {
    return dag
      .container()
      .from(nodeImage)
      .withDirectory("/src", source, { exclude: [".git", "node_modules", "dist"] })
      .withWorkdir("/src")
      .withExec([
        "node",
        "-e",
        "const fs=require('fs'); const text=fs.readFileSync('.ls-lint.yml','utf8'); if (!text.includes('.dagger:') || !text.includes('.ts: kebab-case')) process.exit(1); console.log('ls-lint configuration validated');",
      ])
      .stdout();
  }

  /** Factory code-gate entry point: audits run before native repository checks. */
  @func()
  async qualification(
    /** +defaultPath="/" */
    source: Directory,
  ): Promise<string> {
    const auditResults = [
      await this.semgrep(source),
      await this.alint(source),
      await this.lsLint(source),
    ];

    const nativeResult = await dag
      .container()
      .from(nodeImage)
      .withDirectory("/app", source, {
        exclude: [
          ".git",
          ".devenv",
          ".direnv",
          ".dagger",
          "node_modules",
          "dist",
          ".env",
          ".env.*",
          "data",
          "recordings",
          "transcripts",
          ".firecrawl",
          "config/sheets.yaml",
          "test-results",
          "playwright-report",
        ],
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
      .withExec([
        "node",
        "-e",
        "console.log('Typecheck, unit/integration tests, production build, and fake-provider browser tests completed.')",
      ])
      .stdout();

    return [...auditResults, nativeResult].join("\n");
  }
}
