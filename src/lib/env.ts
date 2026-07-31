import {
  validateEnvironment,
  type ValidationResult,
  type ValidatedEnvironment,
} from "./env-rules";

export {
  EXPECTED_FORMATS,
  validateEnvironment,
  type EnvironmentProblem,
  type ValidatedEnvironment,
  type ValidationResult,
} from "./env-rules";

// Snapshot the live environment ONCE at module load so every consumer sees the same values. Kept out of env-rules.ts because import.meta.env is a browser-bundle-only construct that would crash a Node run.
export const environmentValidation: ValidationResult = validateEnvironment(
  import.meta.env as unknown as Record<string, string | undefined>,
);

// Throws when called before validation has succeeded, because reaching this path means the boot-time guard in main.tsx was bypassed.
export function getValidatedEnvironment(): ValidatedEnvironment {
  if (!environmentValidation.ok) {
    throw new Error(
      "getValidatedEnvironment() called before validateEnvironment() succeeded",
    );
  }
  return environmentValidation.values;
}
