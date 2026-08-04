export const EXPECTED_FORMATS: Record<string, string> = {
  VITE_API_BASE_URL:
    "empty (same-origin — required for the dev proxy mode) OR an http:// or https:// URL",
  VITE_ENABLE_MSW: "the literal string true or false",
};

export type EnvironmentProblem =
  | { name: string; kind: "missing" }
  | { name: string; kind: "empty" }
  | { name: string; kind: "invalid"; value: string; reason: string };

export type ValidatedEnvironment = {
  VITE_API_BASE_URL: string;
  VITE_ENABLE_MSW: "true" | "false";
};

export type ValidationResult =
  | { ok: true; values: ValidatedEnvironment }
  | { ok: false; problems: EnvironmentProblem[] };

function classifyBaseUrl(
  name: string,
  raw: string | undefined,
): EnvironmentProblem | null {
  if (raw === undefined) return { name, kind: "missing" };
  // Empty is a valid signal for same-origin/relative requests — the dev proxy mode and the api client's joinUrl both handle a bare path.
  if (raw.trim() === "") return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        name,
        kind: "invalid",
        value: raw,
        reason: "protocol must be http or https",
      };
    }
    return null;
  } catch {
    return { name, kind: "invalid", value: raw, reason: "not a parseable URL" };
  }
}

function classifyBoolean(
  name: string,
  raw: string | undefined,
): EnvironmentProblem | null {
  if (raw === undefined) return { name, kind: "missing" };
  if (raw.trim() === "") return { name, kind: "empty" };
  if (raw !== "true" && raw !== "false") {
    return {
      name,
      kind: "invalid",
      value: raw,
      reason: 'must be exactly "true" or "false"',
    };
  }
  return null;
}

export function validateEnvironment(
  source: Record<string, string | undefined>,
): ValidationResult {
  const problems: EnvironmentProblem[] = [];

  const urlProblem = classifyBaseUrl("VITE_API_BASE_URL", source.VITE_API_BASE_URL);
  if (urlProblem) problems.push(urlProblem);

  const booleanProblem = classifyBoolean(
    "VITE_ENABLE_MSW",
    source.VITE_ENABLE_MSW,
  );
  if (booleanProblem) problems.push(booleanProblem);

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    values: {
      VITE_API_BASE_URL: source.VITE_API_BASE_URL as string,
      VITE_ENABLE_MSW: source.VITE_ENABLE_MSW as "true" | "false",
    },
  };
}
