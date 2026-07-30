// Iter 4.x perf: shared memoized loader for the DatePickerPopover async chunk.
//
// Both React.lazy (click path) and the prefetch triggers (requestIdleCallback +
// onPointerEnter/onFocus) use this single loader so they share one network
// request. The dynamic import() is preserved so Vite still emits
// DatePickerPopover as its own async chunk (~28.94 kB gzip). Prefetch failures
// are swallowed silently — the click path retries via React.lazy as before.
let promise: Promise<typeof import("./DatePickerPopover")> | null = null;

/** Kicks off (or returns) the in-flight import of the DatePickerPopover chunk. */
export function loadDatePickerPopover(): Promise<typeof import("./DatePickerPopover")> {
  return (promise ??= import("./DatePickerPopover"));
}

/**
 * Fire-and-forget prefetch. Swallows errors and resets the memo on failure so
 * the eventual click (or a later trigger) can retry cleanly via React.lazy.
 */
export function prefetchDatePickerPopover(): void {
  loadDatePickerPopover().catch(() => {
    promise = null;
  });
}
