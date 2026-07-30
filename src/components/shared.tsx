import logoUrl from "@/assets/Logo.png";

export function Bg() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(23,168,130,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(23,168,130,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(23,168,130,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom right, rgba(23,168,130,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
    </>
  );
}

export function Logo({ subtitle, size = "md" }: { subtitle?: string; size?: "sm" | "md" }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${size === "md" ? "mb-8" : "mb-0"}`}>
      <img src={logoUrl} alt="Rydee"
        className={size === "md" ? "w-48 object-contain" : "w-32 object-contain"}
        style={{ filter: "drop-shadow(0 4px 16px rgba(23,168,130,0.20))" }} />
      {subtitle && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>}
    </div>
  );
}

export const cardStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  boxShadow: "0 0 0 1px rgba(23,168,130,0.06), 0 8px 40px rgba(23,168,130,0.10)",
};

export const btnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #17a882 0%, #0d8f6e 100%)",
  color: "#ffffff",
  boxShadow: "0 4px 20px rgba(23,168,130,0.30)",
  cursor: "pointer",
};

export const btnLoading: React.CSSProperties = {
  background: "rgba(23,168,130,0.5)",
  color: "#ffffff",
  boxShadow: "none",
  cursor: "not-allowed",
};

export const inputBase: React.CSSProperties = {
  background: "var(--input-background)",
  border: "1px solid var(--border)",
  color: "var(--card-foreground)",
  caretColor: "#17a882",
};

export function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.border = "1px solid rgba(23,168,130,0.5)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,168,130,0.10)";
}

export function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.border = "1px solid var(--border)";
  e.currentTarget.style.boxShadow = "none";
}

export function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function FieldInput({
  id, label, type = "text", placeholder, value, onChange,
  autoComplete, inputMode, required = true, readOnly = false, children,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange?: (v: string) => void;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search" | "decimal" | "none";
  required?: boolean; readOnly?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: "#2d5045" }}>{label}</label>
      <div className="relative">
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          autoComplete={autoComplete} inputMode={inputMode} readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          required={required && !readOnly}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
          style={{
            ...inputBase,
            paddingRight: children ? "3rem" : undefined,
            opacity: readOnly ? 0.7 : 1,
            cursor: readOnly ? "default" : "text",
          }}
          onFocus={readOnly ? undefined : focusInput}
          onBlur={readOnly ? undefined : blurInput}
        />
        {children}
      </div>
    </div>
  );
}

export function BackButton({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
      style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--muted)"; e.currentTarget.style.color = "#17a882"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      {label}
    </button>
  );
}
