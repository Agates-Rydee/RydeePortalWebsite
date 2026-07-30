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
// Props exchange native Date objects; parents own display/wire formatting.
import { lazy, Suspense, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared";
import { formatDobDisplay } from "./date-helpers";

// Lazy subtree — Popover + Calendar + Radix Popper. Loads on first open.
const DatePickerPopover = lazy(() => import("./DatePickerPopover"));

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
          onClick={() => setPickerMounted(true)}
          className={
            "w-full h-auto justify-start text-left font-normal rounded-xl px-4 py-3 text-sm " +
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
