// Bundle-size regression guard. Enforces a narrow gzip band on the main app
// chunk so that unrelated changes cannot silently bloat the first-paint
// payload; tighten (never widen) the band when an intentional change lands.
// The test is skipped when dist/ is absent, so `npm test` in a fresh clone
// (before `npm run build`) still passes cleanly.
import { describe, expect, it } from "vitest";
import { statSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

// The test compresses the largest index-*.js chunk with Node's zlib.gzipSync
// at its default level, which is deterministic across machines running the
// pinned Node major and therefore comparable across CI runs. The Vite CLI's
// reported gzip size differs slightly because it measures a different
// intermediate artifact; CI enforces the value computed here.
const BAND_MIN_KB = 235.5;
const BAND_MAX_KB = 238.5;
const ASSETS_DIR = join(process.cwd(), "dist", "assets");

function findMainJsChunk(): string | null {
  if (!existsSync(ASSETS_DIR)) return null;
  const jsFiles = readdirSync(ASSETS_DIR).filter((f) => f.startsWith("index-") && f.endsWith(".js"));
  if (jsFiles.length === 0) return null;
  jsFiles.sort(
    (a, b) => statSync(join(ASSETS_DIR, b)).size - statSync(join(ASSETS_DIR, a)).size,
  );
  return join(ASSETS_DIR, jsFiles[0]);
}

describe("bundle-size guard (ADR-0004)", () => {
  const main = findMainJsChunk();
  const runOrSkip = main ? it : it.skip;
  runOrSkip(`main JS chunk gzip is inside ${BAND_MIN_KB}–${BAND_MAX_KB} kB band`, () => {
    const buf = readFileSync(main!);
    const gz = gzipSync(buf);
    const kb = gz.length / 1024;
    // eslint-disable-next-line no-console
    console.log(`[bundle-size] main chunk gzip = ${kb.toFixed(2)} kB`);
    expect(kb).toBeGreaterThanOrEqual(BAND_MIN_KB);
    expect(kb).toBeLessThanOrEqual(BAND_MAX_KB);
  });
});
