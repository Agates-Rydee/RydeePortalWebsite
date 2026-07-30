// Iter 4.1 hotfix: lazy-loaded Popover + Calendar subtree for DatePickerField.
//
// This module owns the Radix Popover + shadcn Calendar (react-day-picker v8 +
// date-fns) so all of that lives in a single async chunk. It auto-opens on
// mount because the parent DatePickerField only mounts it on the user'"'"'s first
// click on the outline trigger button.
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDobDisplay } from "./date-helpers";

interface DatePickerPopoverProps {
  id: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  onClose?: () => void;
  fromYear: number;
  toYear: number;
  placeholder: string;
  errorId: string;
  hasError: boolean;
  ariaLabel?: string;
}

export default function DatePickerPopover({
  id,
  value,
  onChange,
  onClose,
  fromYear,
  toYear,
  placeholder,
  errorId,
  hasError,
  ariaLabel,
}: DatePickerPopoverProps) {
  // Auto-open on first mount (parent lazy-loaded us on user click).
  const [open, setOpen] = useState(true);
  const display = value ? formatDobDisplay(value) : placeholder;
  const defaultMonth = value ?? new Date(toYear, 0, 1);

  return (
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
          aria-describedby={hasError ? errorId : undefined}
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
  );
}
