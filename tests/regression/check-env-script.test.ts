import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testFilePath), "..", "..");
const scriptPath = path.join(repoRoot, "scripts", "check-env.ts");

// Strips VITE_* from the inherited env so an ambient shell value cannot accidentally make an invalid-case test pass. PATH and system variables are kept so `node` can still start.
function scrubbedEnvironment(): NodeJS.ProcessEnv {
  const clone: NodeJS.ProcessEnv = { ...process.env };
  delete clone.VITE_API_BASE_URL;
  delete clone.VITE_ENABLE_MSW;
  return clone;
}

// CHECK_ENV_PROJECT_ROOT is a test-only override that points the gate at a temporary directory whose .env state is fully controlled; the real build pipeline never sets it.
function runGate(
  root: string,
  extraEnv: Record<string, string> = {},
): ReturnType<typeof spawnSync> {
  return spawnSync(
    process.execPath,
    [scriptPath],
    {
      cwd: root,
      env: {
        ...scrubbedEnvironment(),
        ...extraEnv,
        CHECK_ENV_PROJECT_ROOT: root,
      },
      encoding: "utf8",
    },
  );
}

describe("scripts/check-env.ts", () => {
  it("exits non-zero and prints the fix plan when the environment is empty", () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "check-env-empty-"));
    try {
      const result = runGate(tempRoot);
      expect(result.status).not.toBe(0);
      expect(result.status).not.toBeNull();
      const stderr = result.stderr ?? "";
      expect(stderr).toMatch(/Environment configuration error/);
      expect(stderr).toMatch(/VITE_API_BASE_URL/);
      expect(stderr).toMatch(/VITE_ENABLE_MSW/);
      expect(stderr).toMatch(/1\..*\.env\.example/);
      expect(stderr).toMatch(/2\./);
      expect(stderr).toMatch(/3\./);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("exits non-zero with an 'invalid' report when VITE_API_BASE_URL is malformed", () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "check-env-invalid-"));
    try {
      writeFileSync(
        path.join(tempRoot, ".env"),
        "VITE_API_BASE_URL=not-a-url\nVITE_ENABLE_MSW=true\n",
        "utf8",
      );
      const result = runGate(tempRoot);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/VITE_API_BASE_URL/);
      expect(result.stderr).toMatch(/not-a-url/);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("exits zero silently when both variables are present and valid", () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "check-env-valid-"));
    try {
      writeFileSync(
        path.join(tempRoot, ".env"),
        "VITE_API_BASE_URL=http://localhost:3000\nVITE_ENABLE_MSW=false\n",
        "utf8",
      );
      const result = runGate(tempRoot);
      expect(result.status).toBe(0);
      // Silent success keeps the surrounding build output clean.
      expect(result.stdout ?? "").toBe("");
      expect(result.stderr ?? "").toBe("");
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
