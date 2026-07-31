// ADR-0004 §"Bundle impact" — bundle size guard.
// Enforces the gzip band [219.0, 227.9] kB on the main JS chunk. If a change
// pushes the size outside this band, either optimize or tighten the band
// with explicit justification in the PR (never silently widen).
//
// Runs against the LAST built dist/ output. Skipped gracefully if dist/ is
// absent (e.g. `npm test` before `npm run build` in a fresh clone).
import { describe, expect, it } from "vitest";
import { statSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

// Band updated 2026-07-31: row → detail Sheet fast-follow (F3) pulled the
// Radix Dialog primitive (via components/ui/sheet.tsx) into the app bundle
// for the first time; URL-persistence + RiderDetailSheet added another
// ~1 kB. This test measures gzip of the LARGEST `index-*.js` chunk in
// `dist/assets` (see `findMainJsChunk` below) via Node's `zlib.gzipSync`
// at default level 6 — deterministic across machines running the same
// Node major (pinned in package.json `engines`: >=24 <25). Vite CLI's
// reported build size (~228.5 kB) differs from this test's number because
// Vite reports gzip of a different intermediate artifact (pre-final-hash
// asset accounting), not a different compression level. CI enforces the
// value this test computes. Band tightened around 223.1 to preserve
// headroom while catching regressions (never silently widened).
const BAND_MIN_KB = 221.5;
const BAND_MAX_KB = 224.5;
const ASSETS_DIR = join(process.cwd(), "dist", "assets");

function findMainJsChunk(): string | null {
  if (!existsSync(ASSETS_DIR)) return null;
  const jsFiles = readdirSync(ASSETS_DIR).filter((f) => f.startsWith("index-") && f.endsWith(".js"));
  if (jsFiles.length === 0) return null;
  // Largest .js is the main app chunk.
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
    // Print for CI visibility.
    // eslint-disable-next-line no-console
    console.log(`[bundle-size] main chunk gzip = ${kb.toFixed(2)} kB`);
    expect(kb).toBeGreaterThanOrEqual(BAND_MIN_KB);
    expect(kb).toBeLessThanOrEqual(BAND_MAX_KB);
  });
});
