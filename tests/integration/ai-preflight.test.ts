import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";

const exec = promisify(execFile);

it.each([
  { status: 401, text: "private-provider-diagnostic", exit: 1, message: "authentication:" },
  { status: 403, text: "private-provider-diagnostic", exit: 1, message: "authentication:" },
  { status: 200, text: '{"ok":false}', exit: 1, message: "AI generation probe failed" },
  { status: 200, text: '{"ok":true}', exit: 0, message: "PASS: authenticated upstream AI generation" }
])("AI deployment preflight propagates HTTP $status and expected result ($exit)", async ({ status, text, exit, message }) => {
  const directory = await mkdtemp(join(tmpdir(), "mantis-ai-preflight-"));
  const requests: string[] = [];
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`);
    request.resume();
    response.writeHead(status, { "content-type": "application/json" });
    response.end(status === 200 ? JSON.stringify({
      status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text }] }]
    }) : JSON.stringify({ error: { message: text } }));
  });
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected local test server");
    const result = await exec(process.execPath, ["--import", "tsx", "scripts/check-ai.ts"], {
      timeout: 10_000,
      // No inherited provider credentials or real environment file.
      env: {
        PATH: process.env.PATH,
        AI_ENV_FILE: join(directory, "absent.env"),
        LLM_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
        LLM_API_KEY: "fixture-only",
        LLM_MODEL: "fixture-only",
        LLM_API_MODE: "responses"
      }
    }).then(({ stdout, stderr }) => ({ code: 0, output: stdout + stderr }),
      (error: { code: number; stdout: string; stderr: string }) => ({ code: error.code, output: error.stdout + error.stderr }));
    expect(result.code).toBe(exit);
    expect(result.output).toContain(message);
    expect(result.output).not.toContain("private-provider-diagnostic");
    expect(result.output).not.toContain("fixture-only");
    expect(requests).toEqual(["POST /v1/responses"]);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
