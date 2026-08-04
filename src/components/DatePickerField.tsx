import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDobDisplay } from "./date-helpers";

interface DatePickerFieldProps {
  id: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  // Fires when the popover closes so callers can trigger blur-style validation.
  onClose?: () => void;
  fromYear: number;
  toYear: number;
  placeholder?: string;
  errorId?: string;
  errorMessage?: string;
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
  // Controlling open state ourselves lets us close the popover on selection
  // and invoke onClose for blur-style validation; Radix still owns focus,
  // keyboard, and outside-click dismissal behaviour.
  const [open, setOpen] = useState(false);
  const hasError = Boolean(errorMessage);
  const derivedErrorId = errorId ?? `${id}-error`;
  const display = value ? formatDobDisplay(value) : placeholder;
  // When no date is selected, anchor the calendar on the latest allowed year
  // instead of the react-day-picker default of today.
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
            // The palette maps --accent onto --primary, which makes the default
            // outline Button flash primary-green on hover and while the popover is
            // open; the class list below pins the background and text colour to
            // stop that flash without touching the shared Button primitive.
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
