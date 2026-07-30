// Iter 4.1 hotfix: shared shadcn-canonical DatePickerField.
//
// Pattern: https://ui.shadcn.com/docs/components/radix/date-picker "Date of Birth"
// example — full-width outline Button trigger with CalendarIcon, showing the
// selected date (DD/MM/YYYY) or a muted placeholder, opening a Popover Calendar
// with year+month dropdowns (react-day-picker v8 captionLayout=dropdown-buttons).
//
// PHASE-6 LAZY-LOAD PRESERVED: only the static <Button> trigger + a mount flag
// live in the main chunk. First click flips pickerMounted=true, React.lazy
// fetches the Popover+Calendar subtree (react-day-picker + date-fns +
// @radix-ui/react-popover + FocusScope/DismissableLayer/Presence/Popper) as a
// single async chunk, which auto-opens on mount and stays mounted afterwards.
//
// Iter 4.x perf: to eliminate the visible Suspense fallback on the FIRST
// click, the chunk is prefetched via a shared memoized loader — idle
// callback after this field mounts, plus onPointerEnter/onFocus on the
// trigger. Both paths share React.lazy's loader (one network request).
//
// Props exchange native Date objects; parents own display/wire formatting.
import { lazy, Suspense, useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared";
import { formatDobDisplay } from "./date-helpers";
import {
  loadDatePickerPopover,
  prefetchDatePickerPopover,
} from "./DatePickerPopover.loader";

// Lazy subtree — Popover + Calendar + Radix Popper. Loads on first open OR
// via the prefetch triggers below. React.lazy and the prefetch hooks share
// the SAME memoized loader (see DatePickerPopover.loader.ts), so at most one
// network request is issued for the ~28.94 kB gzip async chunk.
const DatePickerPopover = lazy(loadDatePickerPopover);

// requestIdleCallback isn't in jsdom (or Safari); fall back to setTimeout at
// ~1.75s so we still never compete with initial render / data fetches on those
// runtimes. Guarded on typeof window so SSR / no-DOM envs are safe too.
const IDLE_PREFETCH_MS = 1750;
type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};
function schedulePrefetchIdle(): (() => void) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    const handle = w.requestIdleCallback(() => prefetchDatePickerPopover(), {
      timeout: 3000,
    });
    return () => w.cancelIdleCallback?.(handle);
  }
  const handle = window.setTimeout(prefetchDatePickerPopover, IDLE_PREFETCH_MS);
  return () => window.clearTimeout(handle);
}

interface DatePickerFieldProps {
  /** Input id — used by <Label htmlFor> on the button trigger. */
  id: string;
  /** Currently selected date, or undefined when empty. */
  value: Date | undefined;
  /** Fires on calendar select (or clear). */
  onChange: (d: Date | undefined) => void;
  /** Fires when the popover closes (used for on-blur-style validation). */
  onClose?: () => void;
  /** Earliest selectable year (dropdown-buttons caption). */
  fromYear: number;
  /** Latest selectable year — dates after Dec 31 of this year are disabled. */
  toYear: number;
  /** Muted placeholder shown when value is undefined. */
  placeholder?: string;
  /** When set, wires aria-invalid + aria-describedby on the trigger button. */
  errorId?: string;
  errorMessage?: string;
  /** Accessible name for the trigger when no visible <label> exists. */
  ariaLabel?: string;
}

export function DatePickerField({
  id,
  value,
  onChange,
  onClose,
  fromYear,
  toYear,
  placeholder = "DD/MM/YYYY",
  errorId,
  errorMessage,
  ariaLabel,
}: DatePickerFieldProps) {
  // Mount flag for the lazy popover subtree. Stays false until first click.
  const [pickerMounted, setPickerMounted] = useState(false);
  const hasError = Boolean(errorMessage);
  const derivedErrorId = errorId ?? `${id}-error`;

  // Layered prefetch: (1) once this field mounts, schedule the chunk fetch
  // during an idle callback (or ~1.75s fallback) so it never competes with
  // initial render / MSW warmup / data fetches. (2) The trigger itself also
  // fires prefetch on pointerenter/focus (see below) for fast-clickers who
  // beat the idle window. Both paths call the SAME memoized loader as
  // React.lazy, so the network request de-dupes to one.
  useEffect(() => {
    const cancel = schedulePrefetchIdle();
    return cancel;
  }, []);

  const display = value ? formatDobDisplay(value) : placeholder;

  return (
    <div className="flex flex-col gap-1.5">
      {!pickerMounted && (
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? derivedErrorId : undefined}
          onPointerEnter={prefetchDatePickerPopover}
          onFocus={prefetchDatePickerPopover}
          onClick={() => setPickerMounted(true)}
          className={
            "w-full h-auto justify-start text-left font-normal rounded-xl px-4 py-3 text-sm border-input bg-background hover:bg-background hover:text-inherit data-[state=open]:bg-background data-[state=open]:text-inherit " +
            (value ? "text-card-foreground" : "text-muted-foreground")
          }
        >
          <CalendarIcon size={16} aria-hidden="true" className="mr-2" />
          {display}
        </Button>
      )}
      {pickerMounted && (
        <Suspense
          fallback={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled
              className="w-full h-auto justify-start text-left font-normal rounded-xl px-4 py-3 text-sm text-muted-foreground"
            >
              <Spinner />
              <span className="ml-2">Loading date picker…</span>
            </Button>
          }
        >
          <DatePickerPopover
            id={id}
            value={value}
            onChange={onChange}
            onClose={onClose}
            fromYear={fromYear}
            toYear={toYear}
            placeholder={placeholder}
            errorId={derivedErrorId}
            hasError={hasError}
            ariaLabel={ariaLabel}
          />
        </Suspense>
      )}
      {errorMessage && (
        <p id={derivedErrorId} role="alert" className="text-xs mt-0.5 text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default DatePickerField;
