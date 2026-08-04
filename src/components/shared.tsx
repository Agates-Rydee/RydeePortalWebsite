import logoUrl from "@/assets/Logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function Bg() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(23,168,130,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(23,168,130,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(23,168,130,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, rgba(23,168,130,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </>
  );
}

export function Logo({ subtitle, size = "md" }: { subtitle?: string; size?: "sm" | "md" }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${size === "md" ? "mb-8" : "mb-0"}`}>
      <img
        src={logoUrl}
        alt="Rydee"
        className={size === "md" ? "w-48 object-contain" : "w-32 object-contain"}
        style={{ filter: "drop-shadow(0 4px 16px rgba(23,168,130,0.20))" }}
      />
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      role="status"
      aria-label="Loading"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// FieldInput wraps the shadcn Input and Label. Focus styling is CSS-only via the Input's built-in focus-visible ring.
export function FieldInput({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
  required = true,
  readOnly = false,
  error,
  errorId,
  errorMessage,
  children,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (v: string) => void;
  /** Optional callback fired when the input loses focus. */
  onBlur?: () => void;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search" | "decimal" | "none";
  required?: boolean;
  readOnly?: boolean;
  /** Marks the field as invalid for callers that manage their own error message rendering. */
  error?: boolean;
  errorId?: string;
  /** When set, renders an alert paragraph below the field and wires the correct aria-invalid and aria-describedby attributes automatically. */
  errorMessage?: string;
  children?: React.ReactNode;
}) {
  const derivedErrorId = errorId ?? id + "-error";
  const hasError = Boolean(errorMessage) || Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-foreground-label">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          readOnly={readOnly}
          required={required && !readOnly}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? derivedErrorId : undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          className={
            "h-auto rounded-xl px-4 py-3 text-sm" +
            (children ? " pr-12" : "") +
            (readOnly
              ? " opacity-70 cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input"
              : "")
          }
        />
        {children}
      </div>
      {errorMessage && (
        <p id={derivedErrorId} role="alert" className="text-xs mt-0.5 text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground hover:text-primary hover:bg-muted"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </Button>
  );
}
