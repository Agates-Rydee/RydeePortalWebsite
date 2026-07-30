// Iter 4 phase 6: lazy-loaded DOB picker (Popover + Calendar).
//
// This module owns the entire Radix Popover subtree AND the shadcn Calendar,
// so react-day-picker + date-fns + @radix-ui/react-popover + FocusScope +
// DismissableLayer + Presence + Popper all live in the async chunk. The main
// chunk sees only a static <Button> trigger + a mount flag; the first click
// mounts this component and auto-opens the popover.
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DobPickerProps {
  selected: Date | undefined;
  onSelect: (d: Date | undefined) => void;
  defaultMonth: Date;
  fromYear: number;
  toYear: number;
}

export default function DobPicker({
  selected,
  onSelect,
  defaultMonth,
  fromYear,
  toYear,
}: DobPickerProps) {
  // Auto-open on first mount (parent lazy-loaded us on user click).
  const [open, setOpen] = useState(true);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open date picker"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent"
        >
          <CalendarIcon size={16} aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
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
