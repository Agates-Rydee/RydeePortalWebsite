// Iter 4.4 simplification: canonical shadcn date-picker pattern, single component.
//
// Pattern: https://ui.shadcn.com/docs/components/radix/date-picker "Date of Birth"
// example — full-width outline Button trigger with CalendarIcon, showing the
// selected date (DD/MM/YYYY) or a muted placeholder, opening a Popover Calendar
// with year+month dropdowns (react-day-picker v8 captionLayout=dropdown-buttons).
//
// LAZY-LOADING DROPPED (owner decision 2026-07-30): at ~224 kB total the app
// doesn't need micro-splitting; zero loading states + less code wins. All
// React.lazy / Suspense / pickerMounted / prefetch machinery removed; open/close
// is now pure Radix state. Route-level code-splitting will be reconsidered when
// the app genuinely grows.
//
// Props exchange native Date objects; parents own display/wire formatting.
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDobDisplay } from "./date-helpers";

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
  // Controlled open state so we can close-on-select and fire onClose for
  // blur-style validation. Radix owns focus/keyboard/dismiss semantics.
  const [open, setOpen] = useState(false);
  const hasError = Boolean(errorMessage);
  const derivedErrorId = errorId ?? `${id}-error`;
  const display = value ? formatDobDisplay(value) : placeholder;
  // Anchor the calendar on the currently selected date, or the latest allowed
  // year when empty — otherwise rdp defaults to "today" which is always
  // outside the 18+ window for DOB pickers.
  const defaultMonth = value ?? new Date(toYear, 0, 1);

  return (
    <div className="flex flex-col gap-1.5">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) onClose?.();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? derivedErrorId : undefined}
            // Scoped field-styling locks (65e966b): outline Button would
            // otherwise flash primary-green on hover / when popover is open
            // because --accent === --primary in this palette. Still needed
            // post-merge — verified against current tokens.
            className={
              "w-full h-auto justify-start text-left font-normal rounded-xl px-4 py-3 text-sm border-input bg-background hover:bg-background hover:text-inherit data-[state=open]:bg-background data-[state=open]:text-inherit " +
              (value ? "text-card-foreground" : "text-muted-foreground")
            }
          >
            <CalendarIcon size={16} aria-hidden="true" className="mr-2" />
            {display}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange(d);
              if (d) setOpen(false);
            }}
            defaultMonth={defaultMonth}
            captionLayout="dropdown-buttons"
            fromYear={fromYear}
            toYear={toYear}
            disabled={{ after: new Date(toYear, 11, 31) }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <p id={derivedErrorId} role="alert" className="text-xs mt-0.5 text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default DatePickerField;
