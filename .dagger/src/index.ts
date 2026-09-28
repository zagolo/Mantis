import { dag, Directory, func, object } from "@dagger.io/dagger";

const nodeImage =
  "docker.io/library/node:22-bookworm@sha256:8a34c4ab3ea2c5cd194f07e317b2a8f09461d3c8b05c4e34c8ccd56d56024c4d";
const semgrepImage =
  "docker.io/semgrep/semgrep:1.146.0@sha256:15c3954ba7e0f8ade909e021d85a7c448909d25e1453a1f3e2d3fe8ec2bd5800";

@object()
export class Mantis {
  @func()
  async semgrep(/** +defaultPath="/" */ source: Directory): Promise<string> {
    return dag.container().from(semgrepImage)
      .withDirectory("/src", source, { exclude: [".git", ".dagger", "node_modules", "dist"] })
      .withWorkdir("/src")
      .withExec(["semgrep", "--test", ".semgrep"])
      .withExec(["semgrep", "scan", "--config", ".semgrep", "--error", "--exclude", ".semgrep"])
      .stdout();
  }

  private auditTools(source: Directory) {
    return dag.container().from(nodeImage)
      .withWorkdir("/src")
      .withDirectory("/src", source, { exclude: [".git", "node_modules", "dist"] })
      .withExec(["npm", "install", "--global", "--ignore-scripts", "@asamarts/alint@0.15.0", "@ls-lint/ls-lint@2.3.1"]);
  }

  @func()
  async alint(/** +defaultPath="/" */ source: Directory): Promise<string> {
    return this.auditTools(source)
      .withExec(["alint", "validate-config"])
      .withExec(["alint", "check", "--fail-on-warning", "--format", "github", "--no-docs"])
      .stdout();
  }

  @func()
  async lsLint(/** +defaultPath="/" */ source: Directory): Promise<string> {
    return this.auditTools(source)
      .withExec(["ls-lint", "--config", ".ls-lint.yml"])
      .stdout();
  }

  @func()
  async qualification(/** +defaultPath="/" */ source: Directory): Promise<string> {
    const audits = [await this.semgrep(source), await this.alint(source), await this.lsLint(source)];
    const native = await dag.container().from(nodeImage)
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withEnvVariable("NODE_ENV", "development")
      .withMountedCache("/root/.npm", dag.cacheVolume("mantis-npm"))
      .withFile("package.json", source.file("package.json"))
      .withFile("package-lock.json", source.file("package-lock.json"))
      .withExec(["npm", "ci", "--include=dev", "--prefer-offline"])
      .withExec(["npx", "--no-install", "playwright", "install", "--with-deps", "chromium"])
      .withDirectory("/app", source, { exclude: [
        ".git", ".devenv", ".direnv", ".dagger", "node_modules", "dist", ".env", ".env.*",
        "data", "recordings", "transcripts", ".firecrawl", "config/sheets.yaml",
        "test-results", "playwright-report",
      ] })
      .withExec(["npm", "run", "skills:check"])
      .withExec(["npm", "run", "typecheck"])
      .withExec(["npm", "test"])
      .withEnvVariable("NODE_ENV", "production")
      .withEnvVariable("VITE_E2E", "false")
      .withExec(["npm", "run", "build"])
      .withExec(["npm", "run", "test:e2e"])
      .withExec(["node", "-e", "const fs=require('fs'); for(const dir of ['dist/client','dist/e2e-client']) { if (!fs.existsSync(`${dir}/index.html`) || !fs.readdirSync(`${dir}/assets`).length) process.exit(1) }"])
      .stdout();
    return [...audits, native].join("\n");
  }
}
